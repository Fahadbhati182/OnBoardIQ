from app.retrieval.reranker import rerank_documents
from app.retrieval.hybrid_search import hybrid_search
from app.retrieval.context_compressor import compress_search_results
from app.retrieval.query_rewriter import rewrite_query

from app.generation.answer import generate_answer


def _retrieve_documents(
    user_query: str,
    access_scope: str,
    team_id: str = None,
    top_k: int = 5,
    candidate_k: int = 20
):

    # Step 1 : Rewriting the user query
    question = rewrite_query(user_query)


    # Step 2: Hybrid Search
    points = hybrid_search(
        user_query=question,
        access_scope=access_scope,
        team_id=team_id,
        top_k=candidate_k
    )

    # Step 3: Reranking
    reranked_documents = rerank_documents(
        user_query=question,
        points=points,
        top_k=top_k
    )

    # Step 4: Context Compression
    result  = compress_search_results(question,reranked_documents)


    return result



def retrieval_pipeline(
    user_query: str,
    access_scope: str,
    team_id: str = None,
):
    results = _retrieve_documents(
        user_query=user_query,
        access_scope=access_scope,
        team_id=team_id,
    )

    answer = generate_answer(
        query=user_query,
        context=results
    )

    return answer



if __name__ == "__main__":
    result  = retrieval_pipeline(
        user_query="What expenses are eligible for reimbursement?",
        access_scope="ALL_EMPLOYEES",
        team_id=None,
    )

    print(result)