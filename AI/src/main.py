
import logging
import threading
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from services.retrieval_pipeline import retrieval_pipeline
from utils.kafka_client import start_consumer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="OnboardIQ AI Service",
    description="AI-powered employee onboarding and document processing API",
    version="1.0.0",
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class HealthResponse(BaseModel):
    status: str
    service: str


@app.on_event("startup")
def startup_event():
    # Run Kafka separately so it cannot block FastAPI startup.
    consumer_thread = threading.Thread(
        target=start_consumer,
        daemon=True,
        name="kafka-consumer",
    )
    consumer_thread.start()

    logger.info("Kafka consumer background thread started")


@app.get("/")
def root():
    return {
        "message": "Welcome to OnboardIQ AI Service",
        "docs": "/docs",
    }


@app.get("/api/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="healthy",
        service="OnboardIQ AI Service",
    )


@app.get("/api/rag")
def rag():
    query = (
        "What is the company's leave policy, including annual leave, "
        "sick leave, and the process for requesting time off?"
    )

    try:
        result = retrieval_pipeline(query)

        return {
            "status": "ok",
            "query": result["question"],
            "answer": result["answer"],
            "retrieved_documents": result["context"],
        }

    except Exception:
        logger.exception("RAG retrieval failed")
        raise HTTPException(
            status_code=500,
            detail="RAG retrieval failed. Check the AI service logs.",
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
    )
