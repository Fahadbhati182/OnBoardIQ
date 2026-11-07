
from langchain_text_splitters import RecursiveCharacterTextSplitter


def chunk_documents(documents:list, chunk_size:int= 500,chunk_overlap:int=300):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        add_start_index=True,
    )

    chunks = splitter.split_documents(documents)

    for index, chunk in enumerate(chunks):
        chunk.metadata['chunk_index'] = index

    print(f"Chunks created of length: {len(chunks)}")

    return chunks