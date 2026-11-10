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

    print("\n========== QUERY ANALYZER ==========")
    print("Original Query:", state["query"])
    print("Contextualized Query:", state.get("contextualized_query"))
    print("Analysis:", state.get("query_analysis"))
    print("====================================\n")

    return state

def hybrid_retriever(state: AgentState) -> AgentState:

    print("\n========== HYBRID RETRIEVER ==========")

    query_analysis = state["query_analysis"]

    if not query_analysis["requires_retrieval"]:
        return {"retrieved_documents": []}

    access_scope = state["access_scope"]
    team_id = state.get("team_id")
    user_query = state["contextualized_query"]

    retrieved_points = hybrid_search(
        user_query,
        access_scope,
        team_id
    )

    print("Retrieved Points:", len(retrieved_points))

    # Convert Qdrant ScoredPoint objects into dictionaries

    for i, point in enumerate(retrieved_points, start=1):
        print(f"\nRAW QDRANT PAYLOAD {i}:")
        print(point.payload)

    documents = []

    for point in retrieved_points:
        payload = point.payload or {}

        # Preserve all Qdrant metadata fields
        metadata = {
            "document_id": payload.get("document_id"),
            "version_id": payload.get("version_id"),
            "title": payload.get("title"),
            "file_name": payload.get("file_name"),
            "document_type": payload.get("document_type"),
            "page_number": payload.get("page_number"),
            "page": payload.get("page"),
            "access_scope": payload.get("access_scope"),
            "team_id": payload.get("team_id"),
            "version_number": payload.get("version_number")
        }

        document = {
            "id": str(point.id),
            "text": payload.get("text", ""),
            "metadata": metadata,
            "source": payload.get("source", "Unknown"),
            "score": point.score
        }

        documents.append(document)

    state["retrieved_documents"] = documents

    print("Successfully stored retrieved documents:", len(documents))

    return state


def reranker(state: AgentState) -> AgentState:
    """  It ranks the retrieved chunks against the standalone query. """

    user_query = state["contextualized_query"]
    retrieved_documents = state["retrieved_documents"]

    print("\n========== RERANKER ==========")
    print("Input Documents:", len(retrieved_documents))

    reranked_documents:list = rerank_documents(user_query,retrieved_documents)
    state['reranked_documents'] = reranked_documents

    print("Output Documents:", len(reranked_documents))

    for i, doc in enumerate(reranked_documents):
        print(f"\nReranked Document {i + 1}")
        print("Text:", doc.get("text", "")[:500])
        print("Score:", doc.get("score"))

    print("==============================\n")


    return state



def contextual_compressor(state: AgentState) -> AgentState:

    user_query = state["contextualized_query"]
    reranked_documents = state["reranked_documents"]

    print("\n========== CONTEXT COMPRESSOR ==========")
    print("Input Documents:", len(reranked_documents))

    compressed_documents = compress_search_results(
        user_query,
        reranked_documents
    )

    print("Output Documents:", len(compressed_documents))

    compressed_context = "\n\n".join(
        f"Source: {document.get('source', 'Unknown')}\n"
        f"Content: {document['text']}"
        for document in compressed_documents
    )

    state["compressed_documents"] = compressed_documents
    state["compressed_context"] = compressed_context

    print("Compressed Context Length:", len(compressed_context))
    print("Compressed Context:\n", compressed_context[:3000])

    print("========================================\n")

    return state



def answer_generation(state: AgentState) -> AgentState:

    print("\n========== ANSWER GENERATION ==========")

    compressed_document = state.get("compressed_documents", [])

    print("Query:", state["contextualized_query"])
    print("Documents:", len(compressed_document))

    result = generate_answer(
        query=state["contextualized_query"],
        compressed_documents=compressed_document,
        chat_history=state.get("conversation_history", [])
    )

    print("Generated Answer:", result.get("answer"))
    print("Citations:", result.get("citations"))

    state["answer"] = result["answer"]
    state["citations"] = result["citations"]

    print("=======================================\n")

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

