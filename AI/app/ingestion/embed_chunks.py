from app.embeddings.dense_embeddings import generate_embeddings
from app.embeddings.sparse_embeddings import generate_sparse_embeddings


def embed_chunks(chunks: list):

    if not chunks:
        return []

    texts = [chunk.page_content for chunk in chunks]

    # Generate dense and sparse embeddings
    dense_vector_embedding = generate_embeddings(texts)
    sparse_vector_embedding = generate_sparse_embeddings(texts)

    # Validate embedding counts
    if len(dense_vector_embedding) != len(chunks):
        raise ValueError(
            f"Expected {len(chunks)} dense embeddings, "
            f"but received {len(dense_vector_embedding)}"
        )

    if len(sparse_vector_embedding) != len(chunks):
        raise ValueError(
            f"Expected {len(chunks)} sparse embeddings, "
            f"but received {len(sparse_vector_embedding)}"
        )

    embedded_chunks = []

    for index, (chunk, dense, sparse) in enumerate(
        zip(chunks, dense_vector_embedding, sparse_vector_embedding)
    ):

        embedded_chunks.append({
            "text": chunk.page_content,

            "dense_vector": dense,

            "sparse_vector": sparse,

            "metadata": {
                **chunk.metadata,
                "chunk_index": index
            }
        })

    return embedded_chunks


