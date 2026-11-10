
import json
from pathlib import Path

from datasets import Dataset


DATASET_PATH = (
    Path(__file__).resolve().parent
    / "datasets"
    / "onboardiq_golden_dataset_v1.json"
)
REQUIRED_FIELDS = {
    "id",
    "question",
    "ground_truth",
    "source_document",
    "source_page",
    "required_access_scope",
    "required_department",
    "evaluation_persona",
    "question_type",
}


def load_golden_dataset(path: Path = DATASET_PATH) -> list[dict]:
    """Load and validate the golden evaluation dataset."""

    if not path.is_file():
        raise FileNotFoundError(
            f"Golden dataset not found: {path}"
        )

    with path.open("r", encoding="utf-8") as file:
        records = json.load(file)

    if not isinstance(records, list) or not records:
        raise ValueError(
            "Golden dataset must be a non-empty JSON array."
        )

    seen_ids = set()

    for index, record in enumerate(records):
        if not isinstance(record, dict):
            raise ValueError(
                f"Record at index {index} must be an object."
            )

        missing = REQUIRED_FIELDS - record.keys()

        if missing:
            raise ValueError(
                f"Record {index} missing fields: {sorted(missing)}"
            )

        for field in ("id", "question", "ground_truth"):
            value = record[field]

            if not isinstance(value, str) or not value.strip():
                raise ValueError(
                    f"Record {index}: {field} must be non-empty."
                )

        if record["id"] in seen_ids:
            raise ValueError(
                f"Duplicate question ID: {record['id']}"
            )

        seen_ids.add(record["id"])

    return records


def load_ragas_dataset(path: Path = DATASET_PATH) -> Dataset:
    """Prepare question/reference pairs for RAGAS."""

    records = load_golden_dataset(path)

    return Dataset.from_list([
        {
            "user_input": record["question"],
            "reference": record["ground_truth"],
        }
        for record in records
    ])


if __name__ == "__main__":
    records = load_golden_dataset()
    ragas_dataset = load_ragas_dataset()

    print(f"Loaded {len(records)} golden questions")
    print(f"RAGAS dataset size: {len(ragas_dataset)}")
    print("\nFirst sample:")
    print(ragas_dataset[0])
