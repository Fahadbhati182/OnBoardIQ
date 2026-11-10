import re

from langchain_core.prompts import ChatPromptTemplate

from app.prompts.prompt import ANSWER_GENERATION_SYSTEM_PROMPT
from app.utils.pick_llm import pick_llm

llm = pick_llm("medium")



def generate_answer(
    query: str,
    compressed_documents: list[dict],
    chat_history: list = None
) -> dict:

    # 1. Prepare context and source mapping

    context, source_mapping = prepare_context(
        compressed_documents
    )

    # 2. Format conversation history

    history_text = "\n".join(
        f"{message['role'].upper()}: {message['content']}"
        for message in (chat_history or [])
    )

    # 3. Use your existing compression-aware system prompt

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            ANSWER_GENERATION_SYSTEM_PROMPT
        ),
        (
            "human",
            """
            CHAT HISTORY:
            {chat_history}

            RETRIEVED CONTEXT:
            {context}

            EMPLOYEE QUESTION:
            {query}

            Provide an accurate answer based on the retrieved context.
            """
        )
    ])

    # 4. Execute LLM

    chain = prompt | llm

    response = chain.invoke({
        "chat_history": history_text,
        "context": context,
        "query": query
    })

    answer = response.content.strip()

    # 5. Extract source references from the answer

    referenced_sources = re.findall(
        r"\[Source:\s*(S\d+(?:\s*,\s*S\d+)*)\]",
        answer
    )

    source_ids = []

    for group in referenced_sources:
        for source_id in re.findall(r"S\d+", group):
            if source_id not in source_ids:
                source_ids.append(source_id)

    # 6. Map source IDs to actual document metadata

    citations = [
        source_mapping[source_id]
        for source_id in source_ids
        if source_id in source_mapping
    ]

    return {
        "answer": answer,
        "citations": citations
    }



def prepare_context(compressed_documents: list[dict]):

    context_parts = []
    source_mapping = {}

    for index, document in enumerate(compressed_documents, start=1):

        source_id = f"S{index}"

        # Metadata is nested inside the document dictionary
        metadata = document.get("metadata") or {}

        print("\n========== CITATION METADATA DEBUG ==========")

        for index, document in enumerate(compressed_documents, start=1):
            print(f"\nDocument {index}")
            print("Top-level keys:", document.keys())
            print("Metadata:", document.get("metadata"))
            print("Document ID:", document.get("document_id"))
            print("Version ID:", document.get("version_id"))
            print("File name:", document.get("file_name"))
            print("Page:", document.get("page_number"))

        print("=============================================\n")

        # Support fields stored either at the top level or inside metadata
        document_id = document.get("document_id") or metadata.get("document_id")
        version_id = document.get("version_id") or metadata.get("version_id")

        title = (
            document.get("file_name")
            or document.get("document_title")
            or metadata.get("file_name")
            or metadata.get("title")
        )

        page_number = (
            document.get("page_number")
            or metadata.get("page_number")
            or metadata.get("page")
        )

        document_type = (
            document.get("document_type")
            or metadata.get("document_type")
        )

        source_mapping[source_id] = {
            "document_id": document_id,
            "version_id": version_id,
            "document_title": title,
            "page_number": page_number
        }

        context_parts.append(
            f"""
[Source: {source_id}]
Document: {title or 'Unknown'}
Page: {page_number or 'Unknown'}
Document Type: {document_type or 'Unknown'}

Content:
{document.get('text', '')}
"""
        )

    return "\n\n".join(context_parts), source_mapping