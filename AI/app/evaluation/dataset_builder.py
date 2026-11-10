
import json
from pathlib import Path

CURRENT_DIR = Path(__file__).resolve().parent

INPUT_PATH = CURRENT_DIR / "ragas_api_responses.json"
OUTPUT_PATH = CURRENT_DIR / "ragas_evaluation_dataset.json"


def build_evaluation_dataset():

    if not INPUT_PATH.exists():
        raise FileNotFoundError(
            f"Pipeline responses not found: {INPUT_PATH}"
        )

    with INPUT_PATH.open("r", encoding="utf-8") as file:
        data = json.load(file)

    results = data.get("results", [])

    # Keep only successful RAG pipeline executions.
    successful_results = [
        item for item in results
        if item.get("status") == "success"
    ]

    evaluation_records = []

    skipped = []

    for item in successful_results:

        question_id = item.get("id")
        question = item.get("question")
        answer = item.get("response")
        contexts = item.get("retrieved_contexts", [])
        ground_truth = item.get("ground_truth")

        # Validate required fields.
        if not question or not answer or not ground_truth:
            skipped.append(question_id)
            continue

        if not contexts:
            skipped.append(question_id)
            continue

        evaluation_records.append({
            "question_id": question_id,
            "user_input": question,
            "retrieved_contexts": contexts,
            "response": answer,
            "reference": ground_truth
        })

    # Save dataset.
    with OUTPUT_PATH.open("w", encoding="utf-8") as file:
        json.dump(
            evaluation_records,
            file,
            indent=4,
            ensure_ascii=False
        )

    print("\n========== RAGAS DATASET BUILDER ==========")
    print("Total pipeline responses:", len(results))
    print("Successful responses:", len(successful_results))
    print("Evaluation records:", len(evaluation_records))
    print("Skipped records:", len(skipped))

    if skipped:
        print("Skipped question IDs:", skipped)

    print("Output:", OUTPUT_PATH)
    print("===========================================\n")


if __name__ == "__main__":
    build_evaluation_dataset()
