from dotenv import load_dotenv
load_dotenv()

import asyncio
import json
from pathlib import Path
from datetime import datetime, timezone

from config import (
    get_evaluation_llm,
    get_evaluation_embeddings,
)
from metrics import evaluation_metrics


BASE_DIR = Path(__file__).resolve().parent

DATASET_PATH = BASE_DIR / "datasets" / "ragas_evaluation_dataset.json"
OUTPUT_PATH = BASE_DIR / "evaluation_results.json"


def load_evaluation_dataset():
    if not DATASET_PATH.is_file():
        raise FileNotFoundError(
            f"Evaluation dataset not found: {DATASET_PATH}"
        )

    with DATASET_PATH.open("r", encoding="utf-8") as file:
        records = json.load(file)

    if not isinstance(records, list) or not records:
        raise ValueError("Evaluation dataset must be a non-empty JSON array.")

    required_fields = {
        "user_input",
        "retrieved_contexts",
        "response",
        "reference",
    }

    for index, record in enumerate(records):
        missing = required_fields - record.keys()

        if missing:
            raise ValueError(
                f"Record {index} is missing fields: {sorted(missing)}"
            )

        if not isinstance(record["retrieved_contexts"], list):
            raise ValueError(
                f"Record {index}: retrieved_contexts must be a list."
            )

    return records


async def score_metric(metric, metric_input):
    result = await metric.ascore(**metric_input)
    return result.value


async def evaluate_dataset():
    records = load_evaluation_dataset()

    print(f"Loaded {len(records)} evaluation samples.")

    llm = get_evaluation_llm()
    embeddings = get_evaluation_embeddings()

    metrics = evaluation_metrics(llm, embeddings)

    metric_inputs = {
        "faithfulness": [
            "user_input",
            "response",
            "retrieved_contexts",
        ],
        "answer_relevancy": [
            "user_input",
            "response",
        ],
        "context_precision": [
            "user_input",
            "reference",
            "retrieved_contexts",
        ],
        "context_recall": [
            "user_input",
            "reference",
            "retrieved_contexts",
        ],
        "answer_correctness": [
            "user_input",
            "response",
            "reference",
        ],
    }

    results = []

    for index, record in enumerate(records, start=1):
        question_id = record.get(
            "question_id",
            record.get("id", f"Q{index:03d}")
        )

        print(f"\n[{index}/{len(records)}] Evaluating {question_id}")

        sample_result = {
            "question_id": question_id,
            "user_input": record["user_input"],
            "scores": {},
            "errors": {},
        }

        for metric_name, metric in metrics.items():
            keys = metric_inputs[metric_name]

            metric_input = {
                key: record[key]
                for key in keys
            }

            try:
                score = await score_metric(metric, metric_input)

                sample_result["scores"][metric_name] = score

                print(f"  {metric_name}: {score:.4f}")

            except Exception as error:
                sample_result["scores"][metric_name] = None
                sample_result["errors"][metric_name] = str(error)

                print(f"  {metric_name}: FAILED - {error}")

        results.append(sample_result)

        # Save progress after every sample.
        save_results(results, complete=False)

    save_results(results, complete=True)

    print("\nEvaluation completed.")
    print_summary(results)


def save_results(results, complete):
    metric_names = [
        "faithfulness",
        "answer_relevancy",
        "context_precision",
        "context_recall",
        "answer_correctness",
    ]

    summary = {}

    for name in metric_names:
        valid_scores = [
            item["scores"].get(name)
            for item in results
            if item["scores"].get(name) is not None
        ]

        summary[name] = (
            sum(valid_scores) / len(valid_scores)
            if valid_scores
            else None
        )

    output = {
        "evaluation_timestamp": datetime.now(
            timezone.utc
        ).isoformat(),
        "total_samples": len(results),
        "completed": complete,
        "overall_scores": summary,
        "results": results,
    }

    with OUTPUT_PATH.open("w", encoding="utf-8") as file:
        json.dump(output, file, indent=4, ensure_ascii=False)


def print_summary(results):
    metric_names = [
        "faithfulness",
        "answer_relevancy",
        "context_precision",
        "context_recall",
        "answer_correctness",
    ]

    print("\n========== RAGAS EVALUATION SUMMARY ==========")

    for name in metric_names:
        valid_scores = [
            item["scores"].get(name)
            for item in results
            if item["scores"].get(name) is not None
        ]

        if valid_scores:
            average = sum(valid_scores) / len(valid_scores)
            print(
                f"{name:22s}: {average:.4f} "
                f"({len(valid_scores)}/{len(results)} samples)"
            )
        else:
            print(f"{name:22s}: No successful scores")

    print("==============================================")
    print(f"Results saved to: {OUTPUT_PATH}")


if __name__ == "__main__":
    asyncio.run(evaluate_dataset())
