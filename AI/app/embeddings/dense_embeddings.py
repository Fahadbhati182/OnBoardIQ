
from sentence_transformers import SentenceTransformer


EMBEDDING_MODEL="sentence-transformers/all-MiniLM-L6-v2"


model =SentenceTransformer(EMBEDDING_MODEL)


def generate_embeddings(texts):
    """Convert text into normalized embedding vectors."""
    if not texts:
        return []

    embeddings = model.encode(
        texts,
        normalize_embeddings=True,
        convert_to_numpy=True,
        show_progress_bar=False,
    )

    return embeddings.tolist()



def generate_embedding_query(query):
    """Generate an embedding for a user's question."""
    if not query:
        raise Exception("Empty query")

    embeddings = generate_embeddings([query])
    return embeddings[0]