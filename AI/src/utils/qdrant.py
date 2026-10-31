


import os
from dotenv import load_dotenv
from qdrant_client import QdrantClient

load_dotenv()

QDRANT_CLIENT_URL = os.getenv("QDRANT_ENDPOINT")
QDRANT_CLIENT_API_KEY = os.getenv("QDRANT_API_KEY")
print("Qdrant endpoint configured:", bool(QDRANT_CLIENT_URL))
print("Qdrant API key configured:", bool(QDRANT_CLIENT_API_KEY))


if not QDRANT_CLIENT_URL:
    raise ValueError("QDRANT_ENDPOINT is missing from .env")

if not QDRANT_CLIENT_API_KEY:
    raise ValueError("QDRANT_API_KEY is missing from .env")

qdrant_client: QdrantClient = QdrantClient(
    url=QDRANT_CLIENT_URL,
    api_key=QDRANT_CLIENT_API_KEY,
)
