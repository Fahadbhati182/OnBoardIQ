
from sentence_transformers import CrossEncoder

RERANKER_MODEL_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"

reranker = CrossEncoder(RERANKER_MODEL_NAME)


def rerank_documents(
    user_query: str,
    documents: list,
    top_k: int = 5
) -> list:

    candidates = []

    for document in documents:

        # Documents are dictionaries, not Qdrant ScoredPoint objects
        text = document.get("text", "")

        if not text or not text.strip():
            continue

        candidates.append(document)

    if not candidates:
        return []

    # Create query-document pairs for CrossEncoder
    pairs = [
        [user_query, document["text"]]
        for document in candidates
    ]

    # Calculate relevance scores
    scores = reranker.predict(pairs)

    # Attach CrossEncoder scores while preserving original metadata
    ranked_results = []

    for document, score in zip(candidates, scores):

        ranked_document = {
            **document,
            "rrf_score": document.get("score"),
            "rerank_score": float(score)
        }

        ranked_results.append(ranked_document)

    # Sort by CrossEncoder relevance score
    ranked_results.sort(
        key=lambda document: document["rerank_score"],
        reverse=True
    )

    return ranked_results[:top_k]
