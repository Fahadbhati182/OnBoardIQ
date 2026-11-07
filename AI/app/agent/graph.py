from typing import Literal

from langgraph.graph import START,StateGraph,END
from app.agent.state import AgentState
from app.agent.node import (
    reranker,
    answer_generation,
    contextual_compressor,
    conversation_context_loader,
    hybrid_retriever,
    query_analyzer,
    query_contextualizer,
    direct_response
)

# router function
def route_after_analysis(state: AgentState) -> Literal["retrieve", "direct"]:
    """
       Decides whether the query requires document retrieval.
    """

    query_analysis = state["query_analysis"]

    if query_analysis["requires_retrieval"]:
        return "retrieve"

    return "direct"


rag_agent_graph = StateGraph(AgentState)


# nodes
rag_agent_graph.add_node("conversation_context_loader",conversation_context_loader)
rag_agent_graph.add_node("query_contextualizer",query_contextualizer)
rag_agent_graph.add_node("query_analyzer",query_analyzer)
rag_agent_graph.add_node("hybrid_retriever",hybrid_retriever)
rag_agent_graph.add_node("reranker",reranker)
rag_agent_graph.add_node("contextual_compressor",contextual_compressor)
rag_agent_graph.add_node("answer_generation",answer_generation)
rag_agent_graph.add_node("direct_response",direct_response)


# edges

rag_agent_graph.add_edge(START,"conversation_context_loader")
rag_agent_graph.add_edge("conversation_context_loader","query_contextualizer")
rag_agent_graph.add_edge("query_contextualizer","query_analyzer")

rag_agent_graph.add_conditional_edges(
    "query_analyzer",
    route_after_analysis,
    {
        "retrieve": "hybrid_retriever",
        "direct": "direct_response"
    }
)

rag_agent_graph.add_edge("hybrid_retriever","reranker")
rag_agent_graph.add_edge("reranker","contextual_compressor")
rag_agent_graph.add_edge("contextual_compressor","answer_generation")

rag_agent_graph.add_edge("answer_generation",END)
rag_agent_graph.add_edge("direct_response",END)


rag_agent = rag_agent_graph.compile()

