from fastembed import SparseTextEmbedding

SPARSE_EMBEDDING_MODEL = "Qdrant/bm25"

# Initialize sparse embedding model
sparse_model = SparseTextEmbedding(
    model_name=SPARSE_EMBEDDING_MODEL
)


def generate_sparse_embeddings(texts: list[str]) -> list[dict]:
    """
    Generate sparse embeddings for multiple text chunks.

    Returns:
        List of dictionaries containing indices and values.
    """

    if not texts:
        return []

    embeddings = list(sparse_model.embed(texts))

    sparse_embeddings = []

    for embedding in embeddings:
        sparse_embeddings.append({
            "indices": embedding.indices.tolist(),
            "values": embedding.values.tolist()
        })

    return sparse_embeddings


def generate_sparse_embedding_query(query: str) -> dict:
    """
    Generate sparse embedding for a user's query.
    """

    if not query or not query.strip():
        raise ValueError("Query cannot be empty")

    embeddings = generate_sparse_embeddings([query.strip()])

    return embeddings[0]