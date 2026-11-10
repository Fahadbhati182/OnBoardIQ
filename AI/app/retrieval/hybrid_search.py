from app.embeddings.sparse_embeddings import generate_sparse_embedding_query
from app.embeddings.dense_embeddings import generate_embedding_query

from qdrant_client.models import Prefetch, Rrf, RrfQuery

from app.retrieval.metadata_filter import metadata_filter
from app.utils.qdrant import qdrant_client, COLLECTION_NAME


def hybrid_search(
    user_query: str,
    access_scope: str,
    team_id: str = None,
    top_k: int = 10,
    candidate_k: int = 20
):

    if not user_query:
        raise ValueError("user_query cannot be empty")

    dense_embedding_query = generate_embedding_query(user_query)
    sparse_embedding_query = generate_sparse_embedding_query(user_query)

    query_filter = metadata_filter(access_scope, team_id)

    result = qdrant_client.query_points(
        collection_name=COLLECTION_NAME,
        prefetch=[
            Prefetch(
                query=dense_embedding_query,
                using="dense",
                limit=candidate_k,
                # filter=query_filter
            ),
            Prefetch(
                query=sparse_embedding_query,
                using="sparse",
                limit=candidate_k,
                # filter=query_filter
            )
        ],
        query=RrfQuery(
            rrf=Rrf()
        ),
        limit=top_k,
        with_payload=True
    )


    return result.points

