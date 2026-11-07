from pathlib import Path

from app.ingestion.document_loader import document_loader
from app.ingestion.fetch_document_data import extract_data_from_db
from app.ingestion.chunk_document import chunk_documents
from app.ingestion.embed_chunks import embed_chunks
from app.ingestion.vector_store import store_to_vector_db


def ingestion_pipeline(data: dict):
    """Execute the complete OnBoardIQ document ingestion pipeline."""

    document_id = data["documentId"]
    version_id = data["versionId"]

    path = None

    try:
        # STEP 1: Fetch document and metadata from database
        file_data = extract_data_from_db(document_id)

        path: Path = file_data["document_dir"]
        versions: list = file_data["versions"]

        if not path.exists():
            raise FileNotFoundError(f"PDF not found: {path}")

        if not versions:
            raise ValueError(
                f"No version metadata found for document {document_id}"
            )

        # Verify that the requested version exists
        version = next(
            (v for v in versions if str(v["id"]) == str(version_id)),
            None
        )

        if version is None:
            raise ValueError(
                f"Version {version_id} not found for document {document_id}"
            )

        print(f"Starting ingestion: {document_id}")
        print(f"Version: {version_id}")

        # STEP 2: Load PDF
        documents = document_loader(path, data)

        if not documents:
            raise ValueError("No content extracted from PDF")

        print(f"Total pages loaded: {len(documents)}")

        # STEP 3: Split documents into chunks
        chunks = chunk_documents(documents)

        if not chunks:
            raise ValueError("No chunks generated from document")

        print(f"Total chunks generated: {len(chunks)}")

        # STEP 4: Generate dense and sparse embeddings
        embeddings = embed_chunks(chunks)

        if not embeddings:
            raise ValueError("Embedding generation failed")

        print(f"Total embeddings generated: {len(embeddings)}")

        # STEP 5: Store embeddings in Qdrant
        stored_count = store_to_vector_db(
            document_id,
            embeddings
        )

        print(f"Successfully stored {stored_count} chunks")


        return {
            "document_id": document_id,
            "version_id": version_id,
            "file_name": version["file_name"],
            "page_count": len(documents),
            "chunk_count": len(chunks),
            "stored_count": stored_count,
            "status": "COMPLETED",
        }

    finally:
        # STEP 7: Clean up downloaded PDF
        if path is not None and path.exists():
            path.unlink()
            print("Temporary PDF deleted successfully")