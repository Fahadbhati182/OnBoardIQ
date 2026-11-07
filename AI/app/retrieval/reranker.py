
from sentence_transformers import CrossEncoder


RERANKER_MODEL_NAME="cross-encoder/ms-marco-MiniLM-L-6-v2"


reranker = CrossEncoder(RERANKER_MODEL_NAME)


def rerank_documents(
    user_query: str,
    points: list,
    top_k: int = 5
) -> list:

    candidates = []

    for point in points:
        payload = point.payload or {}

        text = payload.get("text", "")

        if not text:
            continue

        candidates.append({
            "id": str(point.id),
            "rrf_score": point.score,
            "text": text,
            "source": payload.get("source", "unknown"),
        })

    if not candidates:
        return []


    pairs = [
        [user_query,candidate['text']]
        for candidate in candidates
    ]

    scores = reranker.predict(pairs)

    ranked_results = sorted(
        zip(points, scores),
        key=lambda x: x[1],
        reverse=True
    )

    reranked_documents = [
        point for point, score in ranked_results[:top_k]
    ]

    return reranked_documents[:top_k]
