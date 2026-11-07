


import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams,Distance,SparseVectorParams,SparseIndexParams,Modifier

load_dotenv()

QDRANT_CLIENT_URL = os.getenv("QDRANT_ENDPOINT")
QDRANT_CLIENT_API_KEY = os.getenv("QDRANT_API_KEY")


COLLECTION_NAME = os.getenv("COLLECTION_NAME")


if not QDRANT_CLIENT_URL:
    raise ValueError("QDRANT_ENDPOINT is missing from .env")

if not QDRANT_CLIENT_API_KEY:
    raise ValueError("QDRANT_API_KEY is missing from .env")

qdrant_client: QdrantClient = QdrantClient(
    url=QDRANT_CLIENT_URL,
    api_key=QDRANT_CLIENT_API_KEY,
)

COLLECTION_NAME = "on_board_iq"

def create_collections():

    if qdrant_client.collection_exists(COLLECTION_NAME):
        return

    qdrant_client.create_collection(
        collection_name=COLLECTION_NAME,

        vectors_config={
            "dense": VectorParams(
                size=384,
                distance=Distance.COSINE
            )
        },

        sparse_vectors_config={
            "sparse": SparseVectorParams(
                index=SparseIndexParams(
                    on_disk=False
                ),
                modifier=Modifier.IDF
            )
        }
    )

    print("Hybrid collection created successfully.")