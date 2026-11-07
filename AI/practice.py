import os
import uuid

from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

load_dotenv()

from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams,
    Distance,
    SparseVectorParams,
    SparseIndexParams,
    Modifier,
    Prefetch,
    SparseVector,
    PointStruct,
    RrfQuery,
    Rrf
)



# configuration
QDRANT_URL = os.getenv("QDRANT_ENDPOINT")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "demo")

if not QDRANT_URL or not QDRANT_API_KEY:
    raise ValueError("Qdrant endpoint or API key is missing.")

qdrant_client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY,
)

# embedding model
from fastembed import TextEmbedding,SparseTextEmbedding

dense_embedding_model = TextEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
sparse_embedding_model = SparseTextEmbedding(model_name="Qdrant/bm25")


# Create collections
def create_collection():
    if not qdrant_client.collection_exists(COLLECTION_NAME):
        qdrant_client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config={
                "dense": VectorParams(
                    size=384,
                    distance=Distance.COSINE,
                )
            },
            sparse_vectors_config={
                "sparse": SparseVectorParams(
                    index=SparseIndexParams(
                        on_disk=False,
                    ),
                    modifier=Modifier.IDF,
                )
            },
        )

        print(f"Created hybrid collection: {COLLECTION_NAME}")



def ingestion_pipeline(docs:list[dict]):

    text = [ doc['text'] for doc in docs]

    # generate dense vector
    dense_vector  = list(dense_embedding_model.embed(text))
    sparse_vector  = list(sparse_embedding_model.embed(text))


    points = []

    for doc,dense,sparse in zip(text,dense_vector,sparse_vector):
        points.append(
            PointStruct(
                id= str(uuid.uuid4()),
                payload={
                    "text": doc["text"],
                    "source": doc.get("source", "unknown"),
                    "department": doc.get("department", "GENERAL"),
                },
                vector={
                    "dense":dense.tolist(),
                    "sparse":SparseVector(
                        indices=sparse.indices.tolist(),
                        values=sparse.values.tolist()
                    )
                },

            )
        )

    qdrant_client.upsert(
        collection_name=COLLECTION_NAME,
        points=points,
        wait=True
    )
    print(f"Successfully indexed {len(points)} document chunks.")



# Creating ReRanker


RERANKER_MODEL_NAME="cross-encoder/ms-marco-MiniLM-L-6-v2"
from sentence_transformers import CrossEncoder

reranker = CrossEncoder(RERANKER_MODEL_NAME)




def hybrid_search(query:str, top_k: int = 5,candidate_k: int = 20):
    if top_k < 1 or candidate_k < top_k:
        raise ValueError(
            "Require top_k >= 1 and candidate_k >= top_k."
        )

    dense_query = next(
        dense_embedding_model.query_embed(query)
    )

    sparse_query = next(
        sparse_embedding_model.query_embed(query)
    )

    results =  qdrant_client.query_points(
        collection_name=COLLECTION_NAME,
        prefetch=[
            Prefetch(
                query=dense_query,
                using="dense",
                limit=candidate_k,
            ),
            Prefetch(
                query=SparseVector(
                    indices=sparse_query.indices.tolist(),
                    values=sparse_query.values.tolist(),
                ),
                using="sparse",
                limit=candidate_k,
            )
        ],

        query= RrfQuery(
            rrf=Rrf(),
        ),
        limit=candidate_k,
        with_payload=True

    )

    candidates = []

    for point in results.points:
        payload = point.payload or {}

        text = payload.get("text", "")

        if not text:
            continue


        candidates.append({
            "id": str(point.id),
            "rrf_score": point.score,
            "text": text,
            "source": payload.get("source", "unknown"),
            "department": payload.get("department", "GENERAL"),
        })


    pairs = [
        (query,candidate['text']) for candidate in candidates
    ]


    reranker_score = reranker.predict(pairs)


    for candidate,rerank_score in zip(candidates,reranker_score):
        candidate["rerank_score"] = float(rerank_score)


    reranked_score = sorted(candidate,key=lambda item:item['rerank_score'],reverse=True)


    return reranked_score[:top_k]




llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0,
)


query_rewrite_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """
        You are a query rewriting assistant for an enterprise RAG system.

        Rewrite the user's question into a clear, concise search query
        that improves retrieval from company documents.

        Rules:
        1. Preserve the original intent.
        2. Do not answer the question.
        3. Do not invent facts or add unsupported assumptions.
        4. Preserve important names, dates, departments, and technical terms.
        5. Expand ambiguous terminology only when the context supports it.
        6. Return only the rewritten query, without explanations or quotes.
        """
    ),
    (
        "human",
        "Original question: {question}"
    ),
])


compression_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """
        You are a contextual compression component in an enterprise RAG system.

        Your task is to extract only the information from the provided
        document that is relevant to answering the user's question.

        Rules:
        1. Preserve the original meaning and factual details.
        2. Do not introduce facts that are not present in the document.
        3. Do not answer the user's question.
        4. Do not add outside knowledge or assumptions.
        5. Preserve important dates, numbers, names, conditions,
           exceptions, and approval requirements.
        6. Prefer extracting relevant original sentences over rewriting them.
        7. If only part of a sentence is relevant, retain enough context
           to preserve its original meaning.
        8. If no information is relevant, return exactly: NO_RELEVANT_CONTEXT
        9. Return only the extracted text, without explanations.
        """
    ),
    (
        "human",
        """
        User question:
        {question}

        Retrieved document:
        {document}
        """
    ),
])

def rewrite_query(question: str) -> str:
    if not question or not question.strip():
        raise ValueError("Question cannot be empty.")

    chain = query_rewrite_prompt | llm

    response = chain.invoke({
        "question": question.strip()
    })

    rewritten_query = response.content.strip()

    # Fall back to the original query if the response is empty.
    return rewritten_query or question.strip()


def compress_document(question:str,document:str)->str:
    if not question.strip() or not document.strip():
        return ""

    chain = compression_prompt | llm

    response = chain.invoke({
        "question": question,
        "document": document,
    })

    compressed_text = response.content.strip()

    if not compressed_text:
        return ""

    if compressed_text == "NO_RELEVANT_CONTEXT":
        return ""

    return compressed_text

def compress_search_results(
    question: str,
    search_results: list[dict],
) -> list[dict]:

    compressed_results = []

    for result in search_results:

        compressed_text = compress_document(
            question=question,
            document=result["text"],
        )

        # Skip documents containing no relevant information.
        if not compressed_text:
            continue

        # Preserve the original metadata and scores.
        compressed_result = {
            **result,
            "original_text": result["text"],
            "text": compressed_text,
        }

        compressed_results.append(compressed_result)

    return compressed_results


if __name__ == "__main__":

    original_query = "What is the company's annual leave policy?"

    # Step 1: Rewrite the query if you have implemented query rewriting.
    rewritten_query = rewrite_query(original_query)

    # Step 2: Retrieve and rerank documents.
    search_results = hybrid_search(
        query=rewritten_query,
        candidate_k=20,
        top_k=5,
    )

    # Step 3: Compress the retrieved documents.
    compressed_results = compress_search_results(
        question=original_query,
        search_results=search_results,
    )

    print("\nOriginal Query:", original_query)
    print("\nCompressed Search Results:")

    for index, result in enumerate(compressed_results, start=1):
        print(f"\nResult {index}")
        print("Source:", result["source"])
        print("Department:", result["department"])
        print("Reranking Score:", result["rerank_score"])
        print("Original Text:", result["original_text"])
        print("Compressed Text:", result["text"])
