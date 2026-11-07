import os
import uuid

from dotenv import load_dotenv
from qdrant_client.models import PointStruct, SparseVector

from app.utils.qdrant import qdrant_client, create_collections

load_dotenv()

COLLECTION_NAME = os.getenv("COLLECTION_NAME")


def store_to_vector_db(document_id: str, embedding_chunks: list):

    if not COLLECTION_NAME:
        raise ValueError("COLLECTION_NAME is not configured")

    if not embedding_chunks:
        print("No chunks available for indexing.")
        return

    if not qdrant_client.collection_exists(COLLECTION_NAME):
        create_collections()

    points = []

    for item in embedding_chunks:

        metadata = item["metadata"]

        point_key = (
            f"{document_id}:"
            f"{metadata['version_id']}:"
            f"{metadata['chunk_index']}"
        )

        point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, point_key))

        # Prepare Qdrant payload
        payload = {
            **metadata,
            "document_id": document_id,
            "text": item["text"],
        }

        # Extract sparse vector
        sparse = item["sparse_vector"]

        points.append(
            PointStruct(
                id=point_id,
                payload=payload,
                vector={
                    "dense": item["dense_vector"],

                    "sparse": SparseVector(
                        indices=sparse["indices"],
                        values=sparse["values"]
                    )
                }
            )
        )

    # Store points in Qdrant
    qdrant_client.upsert(
        collection_name=COLLECTION_NAME,
        points=points,
        wait=True
    )

    print(f"Successfully indexed {len(points)} document chunks.")