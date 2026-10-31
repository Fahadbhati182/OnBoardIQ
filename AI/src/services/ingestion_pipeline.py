import uuid

from dotenv import load_dotenv


load_dotenv()

import os
from pathlib import Path


from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from qdrant_client.models import Distance,VectorParams,PointStruct
from services.document_client import download_document, get_document_versions
from services.embedding_service import generate_embeddings
from utils.qdrant import qdrant_client

CHUNK_OVERLAP = 300
CHUNK_SIZE = 1000
COLLECTION_NAME=os.getenv("COLLECTION_NAME")


def extract_data_from_db(document_id:str)->dict:
    """ Extract data from database via API call """
    path:Path = download_document(document_id)
    version:list = get_document_versions(document_id)

    return {
        "document_dir":path,
        "versions":version
    }

# document loader

def document_loader(document_id:str,path: Path,versions: list):

    loader = PyPDFLoader(str(path))
    documents = loader.load()
    version = versions[0]

    for document in documents:
        document.metadata["document_id"] = document_id
        document.metadata["version_id"] = version["id"]
        document.metadata["file_name"] = version["file_name"]
        document.metadata["file_size_bytes"] = version["file_size_bytes"]

    return documents

def chunk_documents(documents):
    splitter = RecursiveCharacterTextSplitter(
        chunk_overlap=CHUNK_OVERLAP,
        chunk_size=CHUNK_SIZE,
        add_start_index=True,
    )
    chunks = splitter.split_documents(documents)

    for index, chunk in enumerate(chunks):
        chunk.metadata["chunk_index"] = index

    print(f"Total chunks created: {len(chunks)}")

    return chunks


def embed_chunks(chunks:list)->list[dict]:
    """Generate embeddings for extracted text chunks."""

    texts = [chunk.page_content  for chunk in chunks]

    embedding = generate_embeddings(texts)

    if len(embedding) != len(chunks):
        raise ValueError(
            f"Expected {len(chunks)} embeddings, "
            f"but received {len(embedding)}"
        )

    embedded_chunks = []

    for chunk,embedding in zip(chunks,embedding):
        embedded_chunks.append({
            "text":chunk.page_content,
            "metadata":chunk.metadata,
            "embedding":embedding
        })


    return embedded_chunks

def store_embeddings(document_id:str,embedding_chunks:list[dict]) -> int:
    """Store vectors and metadata in Qdrant."""

    points = []

    for item in embedding_chunks:
        metadata = item["metadata"]

        point_key =(
            f"{document_id}:"
            f"{metadata['version_id']}:"
            f"{metadata['chunk_index']}"
        )

        point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, point_key))

        payload = {
            **metadata,
            "document_id":document_id,
            "text": item["text"]
        }

        points.append(PointStruct(
            id=point_id,
            payload=payload,
            vector=item["embedding"]
        ))

    if points:
        qdrant_client.upsert(
            collection_name=COLLECTION_NAME,
            points=points,
            wait=True
        )

    print(f"Stored {len(points)} vectors in Qdrant.")

    return len(points)







def ingestion_pipeline(document_id:str):
    """Extract text from a PDF for the OnBoardIQ ingestion pipeline."""

    # Step 1: Download the PDF and retrieve metadata
    file_data = extract_data_from_db(document_id)

    path: Path = file_data["document_dir"]
    versions: list = file_data["versions"]

    if not path.exists():
        raise FileNotFoundError(f"PDF not found: {path}")

    if not versions:
        raise ValueError(f"No version metadata found for {document_id}")



    # STEP 1 : Loading Document
    documents  = document_loader(document_id,path,versions)

    # STEP 2 : Chunking the Documents
    chunks = chunk_documents(documents)

    # STEP 3 : Embed the chunks
    embeddings = embed_chunks(chunks)

    # STEP 4 : Store to Vector DB


    if not qdrant_client.collection_exists(COLLECTION_NAME):
        qdrant_client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=384,
                distance=Distance.COSINE,
            )
        )

    stored_count =  store_embeddings(document_id,embeddings)

    if path.exists():
        path.unlink()
        print("File deleted successfully")
    else:
        print("File not found")

    return {
        "document_id": document_id,
        "version_id": versions[0]["id"],
        "file_name": versions[0]["file_name"],
        "page_count": len(documents),
        "chunk_count": len(chunks),
        "stored_count": stored_count,
        "status": "COMPLETED",
    }

















