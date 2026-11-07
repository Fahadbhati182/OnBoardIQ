from langchain_core.prompts import ChatPromptTemplate

from app.utils.pick_llm import pick_llm

llm = pick_llm("medium")

compression_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        """
        You are a contextual compression component in an enterprise RAG system.

        Your task is to extract only the information from the provided
        document that is relevant to answering the user's question.

        Rules:
        1. Preserve the original meaning and factual details.
        2. Do not introduce facts that are not present in the document.
        3. Do not answer the user's question.
        4. Do not add outside knowledge or assumptions.
        5. Preserve important dates, numbers, names, conditions,
           exceptions, and approval requirements.
        6. Prefer extracting relevant original sentences over rewriting them.
        7. If only part of a sentence is relevant, retain enough context
           to preserve its original meaning.
        8. If no information is relevant, return exactly: NO_RELEVANT_CONTEXT
        9. Return only the extracted text, without explanations.
        """
    ),
    (
        "human",
        """
        User question:
        {question}

        Retrieved document:
        {document}
        """
    ),
])

def compress_document(question:str,document:str):
    if not question.strip() or not document.strip():
        return ""

    chain = compression_prompt | llm

    response = chain.invoke({
        "question": question,
        "document": document,
    })

    compressed_text = response.content.strip()

    if not compressed_text:
        return ""

    if compressed_text == "NO_RELEVANT_CONTEXT":
        return ""

    return compressed_text




def compress_search_results(
    question: str,
    search_results: list,
) -> list[dict]:

    compressed_results = []

    for result in search_results:

        # Extract text from Qdrant payload
        original_text = result.payload.get("text", "")

        if not original_text:
            continue

        compressed_text = compress_document(
            question=question,
            document=original_text,
        )

        # Skip documents containing no relevant information
        if not compressed_text:
            continue

        # Convert Qdrant ScoredPoint into a dictionary
        compressed_result = {
            "id": result.id,
            "score": result.score,
            "original_text": original_text,
            "text": compressed_text,
            **result.payload,
        }

        compressed_results.append(compressed_result)

    return compressed_results

