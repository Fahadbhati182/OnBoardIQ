from dotenv import load_dotenv
load_dotenv()

from app.evaluation.config import (
    get_evaluation_llm,
    get_evaluation_embeddings,
)

from app.evaluation.metrics import evaluation_metrics


def main():
    llm = get_evaluation_llm()
    embeddings = get_evaluation_embeddings()

    metrics = evaluation_metrics(llm, embeddings)

    print("\nInitialized RAGAS metrics:")

    for name, metric in metrics.items():
        print(f"{name}: {metric.__class__.__name__}")


if __name__ == "__main__":
    main()