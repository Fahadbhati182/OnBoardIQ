from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader


def document_loader(path:Path,data:dict):
    loader = PyPDFLoader(str(path))
    documents = loader.load()

    # adding metadata
    metadata = {
        # Document identification
        "document_id": data["documentId"],
        "version_id": data["versionId"],

        # File information
        "storage_key": data["storageKey"],
        "file_name": data["fileName"],
        "mime_type": data["mimeType"],
        "file_size": data.get("fileSize"),

        # Document information
        "title": data["title"],
        "description": data.get("description"),
        "document_type": data["documentType"],

        # Authorization metadata
        "access_scope": data["accessScope"],
        "team_id": data.get("teamId"),
        "status": data["status"],

        # Ownership and versioning
        "uploaded_by": data["uploadedBy"],
        "version_number": data["versionNumber"],
    }

    for index,document in enumerate(documents):
        document.metadata.update(metadata)
        document.metadata["page_number"] = index + 1

    print(f"The len of documents is {len(documents)}")
    return documents
