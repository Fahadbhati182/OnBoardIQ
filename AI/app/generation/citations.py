# generation/citations.py

def generate_citations(retrieved_chunks):

    citations = []
    seen = set()

    for chunk in retrieved_chunks:

        metadata = chunk.metadata

        document_id = metadata.get("document_id")
        version_id = metadata.get("version_id")
        page = metadata.get("page")
        title = metadata.get("title")

        key = (document_id, version_id, page)

        if key in seen:
            continue

        seen.add(key)

        citations.append({
            "document_id": document_id,
            "version_id": version_id,
            "document_title": title,
            "page_number": page
        })

    return citations