from ragas.metrics.collections import (
    Faithfulness,
    AnswerRelevancy,
    ContextPrecision,
    ContextRecall,
    AnswerCorrectness,
)


def evaluation_metrics(llm, embeddings):
    """
    Initialize RAGAS evaluation metrics using native RAGAS interfaces.
    """

    metrics = {
        "faithfulness": Faithfulness(
            llm=llm
        ),

        "answer_relevancy": AnswerRelevancy(
            llm=llm,
            embeddings=embeddings
        ),

        "context_precision": ContextPrecision(
            llm=llm
        ),

        "context_recall": ContextRecall(
            llm=llm
        ),

        "answer_correctness": AnswerCorrectness(
            llm=llm,
            embeddings=embeddings
        ),
    }

    return metrics