from dotenv import load_dotenv
load_dotenv()

import os
from pathlib import Path

import requests

BACKEND_URL = os.getenv(
    "BACKEND_URL",
    "http://localhost:3000"
)

SERVICE_TOKEN = os.getenv("ONBOARDIQ_SERVICE_TOKEN")

DOWNLOAD_DIR = Path("downloads")
DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _download_document(document_id: str) -> Path:
    """
    Download the latest PDF version from the Node.js backend.
    Returns the path to the downloaded file.
    """

    if not SERVICE_TOKEN:
        raise RuntimeError("ONBOARDIQ_SERVICE_TOKEN is not configured")

    url = (
        f"{BACKEND_URL}/api/documents/internal/"
        f"{document_id}/download"
    )
    print(url)


    headers = {
        "Authorization": f"Bearer {SERVICE_TOKEN}"
    }

    response = requests.get(
        url,
        headers=headers,
        stream=True,
        timeout=(5, 60),
    )

    try:
        response.raise_for_status()

        content_type = response.headers.get(
            "Content-Type", ""
        ).split(";")[0].strip().lower()

        if content_type != "application/pdf":
            raise ValueError(
                f"Expected a PDF, received: {content_type}"
            )

        file_path = DOWNLOAD_DIR / f"{document_id}.pdf"
        temporary_path = DOWNLOAD_DIR / f"{document_id}.pdf.part"

        try:
            with temporary_path.open("wb") as file:
                for chunk in response.iter_content(
                    chunk_size=1024 * 1024
                ):
                    if chunk:
                        file.write(chunk)

            temporary_path.replace(file_path)

        except Exception:
            temporary_path.unlink(missing_ok=True)
            raise

        return file_path

    finally:
        response.close()


def _get_document_versions(document_id: str) -> list:
    """
    Retrieve the version history of a document.
    """

    if not SERVICE_TOKEN:
        raise RuntimeError("ONBOARDIQ_SERVICE_TOKEN is not configured")

    url = (
        f"{BACKEND_URL}/api/documents/internal/"
        f"{document_id}/versions"
    )
    print(url)

    headers = {
        "Authorization": f"Bearer {SERVICE_TOKEN}"
    }

    response = requests.get(
        url,
        headers=headers,
        timeout=(5, 30),
    )

    try:
        response.raise_for_status()

        result = response.json()

        if not result.get("success"):
            raise RuntimeError(
                "Backend did not return a successful response"
            )

        return result.get("data", [])

    finally:
        response.close()



def extract_data_from_db(document_id:str)->dict:
    """ Extract data from database via API call """
    path:Path = _download_document(document_id)
    version:list = _get_document_versions(document_id)

    return {
        "document_dir":path,
        "versions":version
    }




