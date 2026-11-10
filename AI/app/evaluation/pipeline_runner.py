
import json
from datetime import datetime, timezone
from pathlib import Path
import sys
import traceback

from dotenv import load_dotenv

# --------------------------------------------------
# Project configuration
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[2]

sys.path.insert(0, str(PROJECT_ROOT))

load_dotenv(PROJECT_ROOT / ".env")

from dataset_loader import load_golden_dataset

# Reuse the exact functions used by your existing RAG nodes
from app.retrieval.hybrid_search import hybrid_search
from app.retrieval.reranker import rerank_documents
from app.retrieval.context_compressor import compress_search_results
from app.generation.answer import generate_answer


# --------------------------------------------------
# File paths
# --------------------------------------------------

CURRENT_DIR = Path(__file__).resolve().parent

OUTPUT_PATH = CURRENT_DIR / "ragas_api_responses.json"
IDENTITY_PATH = CURRENT_DIR / "evaluation_identities.json"


# --------------------------------------------------
# Evaluation identity configuration
# --------------------------------------------------

def load_identity_overrides() -> dict:
    """
    Load optional team IDs for evaluation personas.

    Example:
    {
        "Q025": {
            "team_id": "YOUR_REAL_TEAM_ID"
        }
    }
    """

    if not IDENTITY_PATH.exists():
        return {}

    with IDENTITY_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


# --------------------------------------------------
# Convert Qdrant points into your existing document format
# --------------------------------------------------

def convert_points_to_documents(points: list) -> list:
    """
    Convert Qdrant ScoredPoint objects into the same
    dictionary structure used by hybrid_retriever().
    """

    documents = []

    for point in points:

        payload = point.payload or {}

        metadata = {
            "document_id": payload.get("document_id"),
            "version_id": payload.get("version_id"),
            "title": payload.get("title"),
            "file_name": payload.get("file_name"),
            "document_type": payload.get("document_type"),
            "page_number": payload.get("page_number"),
            "page": payload.get("page"),
            "access_scope": payload.get("access_scope"),
            "team_id": payload.get("team_id"),
            "version_number": payload.get("version_number")
        }

        document = {
            "id": str(point.id),
            "text": payload.get("text", ""),
            "metadata": metadata,
            "source": payload.get("source", "Unknown"),
            "score": point.score
        }

        documents.append(document)

    return documents


# --------------------------------------------------
# Direct RAG pipeline
# --------------------------------------------------

def execute_rag_pipeline(
    record: dict,
    identity_overrides: dict
) -> dict:

    question_id = record["id"]
    query = record["question"]

    access_scope = record["required_access_scope"]

    identity = identity_overrides.get(question_id, {})

    team_id = identity.get("team_id")

    print("\n" + "=" * 60)
    print(f"Processing: {question_id}")
    print("Question:", query)
    print("Access Scope:", access_scope)
    print("Team ID:", team_id)
    print("=" * 60)

    # TEAM_ONLY retrieval requires a real team ID.
    if access_scope == "TEAM_ONLY" and not team_id:
        raise ValueError(
            f"{question_id}: TEAM_ONLY question requires "
            "a real team_id in evaluation_identities.json"
        )

    # --------------------------------------------------
    # STEP 1: HYBRID RETRIEVAL
    # --------------------------------------------------

    print("\n========== HYBRID RETRIEVER ==========")

    retrieved_points = hybrid_search(
        user_query=query,
        access_scope=access_scope,
        team_id=team_id
    )

    retrieved_documents = convert_points_to_documents(
        retrieved_points
    )

    print("Retrieved Points:", len(retrieved_documents))

    # --------------------------------------------------
    # STEP 2: RERANKING
    # --------------------------------------------------

    print("\n========== RERANKER ==========")

    reranked_documents = rerank_documents(
        query,
        retrieved_documents
    )

    print("Input Documents:", len(retrieved_documents))
    print("Output Documents:", len(reranked_documents))

    # --------------------------------------------------
    # STEP 3: CONTEXT COMPRESSION
    # --------------------------------------------------

    print("\n========== CONTEXT COMPRESSOR ==========")

    compressed_documents = compress_search_results(
        query,
        reranked_documents
    )

    print("Input Documents:", len(reranked_documents))
    print("Output Documents:", len(compressed_documents))

    compressed_context = "\n\n".join(
        f"Source: {document.get('source', 'Unknown')}\n"
        f"Content: {document.get('text', '')}"
        for document in compressed_documents
    )

    print("Compressed Context Length:", len(compressed_context))

    # --------------------------------------------------
    # STEP 4: ANSWER GENERATION
    # --------------------------------------------------

    print("\n========== ANSWER GENERATION ==========")

    answer_result = generate_answer(
        query=query,
        compressed_documents=compressed_documents,
        chat_history=[]
    )

    answer = answer_result.get("answer", "")
    citations = answer_result.get("citations", [])

    print("Generated Answer:", answer)
    print("Citations:", citations)

    print("\n========== RAG PIPELINE COMPLETE ==========\n")

    # --------------------------------------------------
    # STEP 5: RETURN EVALUATION DATA
    # --------------------------------------------------

    return {
        "id": question_id,
        "question": query,
        "ground_truth": record["ground_truth"],

        "source_document": record["source_document"],
        "source_page": record["source_page"],

        "required_access_scope": access_scope,
        "required_department": record["required_department"],
        "evaluation_persona": record["evaluation_persona"],
        "question_type": record["question_type"],

        "status": "success",

        "response": answer,
        "citations": citations,

        # Exact contexts passed to answer generation.
        # Use these as RAGAS retrieved_contexts.
        "retrieved_contexts": [
            document.get("text", "")
            for document in compressed_documents
            if document.get("text")
        ],

        # Keep intermediate stages for debugging.
        "retrieval_debug": {
            "retrieved_count": len(retrieved_documents),
            "reranked_count": len(reranked_documents),
            "compressed_count": len(compressed_documents),

            "retrieved_contexts": [
                document.get("text", "")
                for document in retrieved_documents
            ],

            "reranked_contexts": [
                document.get("text", "")
                for document in reranked_documents
            ],

            "compressed_context": compressed_context
        },

        "error": None
    }


# --------------------------------------------------
# Run evaluation pipeline
# --------------------------------------------------

def run_pipeline():

    records = load_golden_dataset()
    identity_overrides = load_identity_overrides()

    print("\n========== RAGAS PIPELINE RUN ==========")
    print("Total Questions:", len(records))
    print("Execution Mode: Direct Python Function Calls")
    print("API Calls: None")
    print("========================================\n")

    results = []

    for record in records:

        try:
            result = execute_rag_pipeline(
                record,
                identity_overrides
            )

        except Exception as error:

            print(f"\nFAILED: {record['id']}")
            traceback.print_exc()

            result = {
                "id": record["id"],
                "question": record["question"],
                "ground_truth": record["ground_truth"],

                "source_document": record["source_document"],
                "source_page": record["source_page"],

                "required_access_scope": record["required_access_scope"],
                "required_department": record["required_department"],
                "evaluation_persona": record["evaluation_persona"],
                "question_type": record["question_type"],

                "status": "failed",
                "response": "",
                "citations": [],
                "retrieved_contexts": [],
                "retrieval_debug": None,

                "error": {
                    "type": type(error).__name__,
                    "detail": str(error)
                }
            }

        results.append(result)

    # --------------------------------------------------
    # Save results
    # --------------------------------------------------

    output = {
        "evaluation_run": {
            "started_at": datetime.now(timezone.utc).isoformat(),
            "total_questions": len(results),

            "successful": sum(
                item["status"] == "success"
                for item in results
            ),

            "failed": sum(
                item["status"] == "failed"
                for item in results
            ),

            "retrieval_empty": sum(
                item["status"] == "success"
                and not item["retrieved_contexts"]
                for item in results
            )
        },

        "results": results
    }

    with OUTPUT_PATH.open("w", encoding="utf-8") as file:
        json.dump(
            output,
            file,
            indent=4,
            ensure_ascii=False
        )

    print("\n========== PIPELINE SUMMARY ==========")
    print("Total:", output["evaluation_run"]["total_questions"])
    print("Successful:", output["evaluation_run"]["successful"])
    print("Failed:", output["evaluation_run"]["failed"])
    print("Empty Context:", output["evaluation_run"]["retrieval_empty"])
    print("Saved:", OUTPUT_PATH)
    print("======================================\n")


if __name__ == "__main__":
    run_pipeline()
