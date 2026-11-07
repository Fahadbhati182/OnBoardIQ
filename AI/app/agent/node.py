from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.agent.services.pydantic_output_parser import QueryAnalysisOutput
from app.agent.state import AgentState
from app.prompts.prompt import QUERY_CONTEXTUALIZER_PROMPT, QUERY_ANALYZER_PROMPT
from app.utils.pick_llm import pick_llm
from app.retrieval.hybrid_search import hybrid_search
from app.retrieval.reranker import rerank_documents
from app.retrieval.context_compressor import compress_search_results
from app.generation.answer import generate_answer


MAX_HISTORY_MESSAGES = 10

def conversation_context_loader(state:AgentState)->AgentState:
    """ Retrieve the previous conversation between the employee and the AI chatbot and load it into the current agent state. """
    query = state["query"].strip()
    history = state.get("conversation_history", [])

    # 1. Normalize conversation messages

    normalized_history = []

    for message in history:

        role = message.get("role")
        content = message.get("content", "")

        if role not in ("user", "assistant"):
            continue

        if not isinstance(content, str) or not content.strip():
            continue

        normalized_history.append({
            "role": role,
            "content": content.strip()
        })

    # 2. Remove the current user query from history.
    # Your Node.js controller already includes the newly inserted user message in the history.

    if normalized_history:

        last_message = normalized_history[-1]

        if (
                last_message["role"] == "user"
                and last_message["content"] == query
        ):
            normalized_history.pop()

    # 3. Keep only the latest 12 previous messages

    normalized_history = normalized_history[-MAX_HISTORY_MESSAGES:]

    state['conversation_history'] = normalized_history
    return state


def query_contextualizer(state: AgentState) -> AgentState:
    """
    Understand the user's current question using the conversation
    history and transform it into a standalone, meaningful query.
    """

    llm = pick_llm("medium")
    conversation_history = state.get("conversation_history", [])
    query = state["query"].strip()

    if not conversation_history:
        return {
            "contextualized_query": query
        }

    history_text = "\n".join(
        f"{message['role'].upper()}: {message['content']}"
        for message in conversation_history
    )

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            QUERY_CONTEXTUALIZER_PROMPT
        ),
        (
            "human",
            """
            Conversation History:

            {conversation_history}

            Current User Question:

            {query}

            Standalone Query:
            """
        )
    ])
    chain = prompt | llm | StrOutputParser()


    result = chain.invoke({
        "query": query,
        "conversation_history": history_text
    })

    contextualized_query = result.strip()

    if not contextualized_query:
        contextualized_query = query

    state["contextualized_query"] = contextualized_query
    return state



def query_analyzer(state: AgentState) -> AgentState:

    llm = pick_llm("medium")

    query = state.get(
        "contextualized_query",
        state["query"]
    )

    history = state.get("conversation_history", [])

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """
            You are a query classification component
            for an enterprise RAG chatbot.

            Classify the user's question.

            Available intents:

            GREETING:
            Simple greetings and conversational messages.

            FACTUAL:
            Questions requiring company document information.

            COMPARISON:
            Questions comparing company policies or procedures.

            MULTI_HOP:
            Questions requiring information from multiple
            document sections.

            FOLLOW_UP:
            Questions referring to previous conversation context.

            OUT_OF_SCOPE:
            Questions unrelated to company documentation,
            employee onboarding, HR, IT or engineering.

            Retrieval rules:

            - GREETING: requires_retrieval = false
            - OUT_OF_SCOPE: requires_retrieval = false
            - FACTUAL: requires_retrieval = true
            - COMPARISON: requires_retrieval = true
            - MULTI_HOP: requires_retrieval = true
            - FOLLOW_UP: requires_retrieval = true when
              company document information is needed.

            Return ONLY a valid JSON object.

            Required JSON format:

            {{
                "intent": "FACTUAL",
                "requires_retrieval": true
            }}

            Do not return markdown.
            Do not return tool calls.
            Do not include additional fields.
            """
        ),
        (
            "human",
            """
            Conversation history:
            {history}

            Current question:
            {query}
            """
        )
    ])

    # Enable Groq JSON mode instead of tool calling
    json_llm = llm.bind(
        response_format={"type": "json_object"}
    )

    chain = prompt | json_llm | StrOutputParser()

    response = chain.invoke({
        "query": query,
        "history": str(history)
    })

    # Validate JSON against our Pydantic schema
    result = QueryAnalysisOutput.model_validate_json(response)

    state["query_analysis"] = result.model_dump()

    return state

def hybrid_retriever(state: AgentState) -> AgentState:
    """
    Retrieves relevant documents from Qdrant using:

    1. Metadata filtering
    2. Dense retrieval
    3. Sparse retrieval
    4. RRF fusion
    """

    # Check whether retrieval is required
    query_analysis = state["query_analysis"]

    if not query_analysis["requires_retrieval"]:
        return {
            "retrieved_documents": []
        }

    access_scope = state["access_scope"]
    team_id = state.get("team_id")
    user_query = state["contextualized_query"]


    #  Perform hybrid search
    retrieved_points = hybrid_search(user_query,access_scope,team_id)

    state['retrieved_documents'] = retrieved_points
    return state



def reranker(state: AgentState) -> AgentState:
    """  It ranks the retrieved chunks against the standalone query. """
    user_query = state["contextualized_query"]
    retrieved_documents = state["retrieved_documents"]

    reranked_documents:list = rerank_documents(user_query,retrieved_documents)
    state['reranked_documents'] = reranked_documents

    return state


def contextual_compressor(state:AgentState)->AgentState:
    """ Its responsibility is to remove irrelevant information from the retrieved chunks while preserving facts necessary to answer the question. """
    user_query = state["contextualized_query"]
    reranked_documents = state["reranked_documents"]

    compressed_document = compress_search_results(user_query,reranked_documents)


    compressed_context = "\n\n".join(
        f"Source: {document.get('source', 'Unknown')}\n"
        f"Content: {document['text']}"
        for document in compressed_document
    )

    state['compressed_document'] = compressed_document
    state['compressed_context'] = compressed_context

    return state


def answer_generation(state: AgentState) -> AgentState:
    """
    Generates a grounded answer using compressed
    documents and conversation history.
    """

    compressed_document = state.get('compressed_document',[])

    result = generate_answer(
        query=state["contextualized_query"],
        compressed_documents=compressed_document,
        chat_history=state.get(
            "conversation_history", []
        )
    )

    state['answer'] = result["answer"]
    state["citations"]  = result["citations"]
    return state


def direct_response(state: AgentState) -> dict:
    """
    Handles queries that do not require document retrieval.
    """

    intent = state["query_analysis"]["intent"]

    if intent == "GREETING":

        answer = (
            "Hello! I'm OnBoardIQ, your AI assistant "
            "for Northstar Technologies. "
            "How can I help you today?"
        )

    elif intent == "OUT_OF_SCOPE":

        answer = (
            "I'm OnBoardIQ, designed to assist with "
            "company policies, HR guidelines, IT procedures, "
            "engineering documentation and onboarding. "
            "I can help you with questions related to these areas."
        )

    else:

        answer = (
            "Could you please provide a little more context "
            "so I can assist you accurately?"
        )

    return {
        "answer": answer,
        "citations": []
    }

