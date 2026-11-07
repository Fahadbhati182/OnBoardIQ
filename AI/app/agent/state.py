from typing import TypedDict, Literal, Any


class ConversationMessage(TypedDict):
    role: Literal["user", "assistant"]
    content: str


class QueryAnalysis(TypedDict):
    intent: Literal[
        "GREETING",
        "FACTUAL",
        "COMPARISON",
        "MULTI_HOP",
        "FOLLOW_UP",
        "OUT_OF_SCOPE"
    ]

    requires_retrieval: bool


class AgentState(TypedDict, total=False):

    # Request information
    conversation_id: str
    user_id: str
    user_role: str
    access_scope: str
    team_id: str | None

    # User query
    query: str
    contextualized_query: str

    # Conversation
    conversation_history: list[ConversationMessage]

    # Query analysis
    query_analysis: QueryAnalysis

    # Retrieval
    retrieved_documents: list[Any]
    reranked_documents: list[Any]

    # Compression
    compressed_documents: list[dict]
    compressed_context: str

    # Final response
    answer: str
    citations: list[dict]