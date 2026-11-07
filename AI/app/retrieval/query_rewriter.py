from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

from app.utils.pick_llm import  pick_llm
llm:ChatGroq= pick_llm("medium")

def rewrite_query(user_query:str):
    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            """
            You are a query rewriting assistant for an enterprise RAG system.
    
            Rewrite the user's question into a clear, concise search query
            that improves retrieval from company documents.
    
            Rules:
            1. Preserve the original intent.
            2. Do not answer the question.
            3. Do not invent facts or add unsupported assumptions.
            4. Preserve important names, dates, departments, and technical terms.
            5. Expand ambiguous terminology only when the context supports it.
            6. Return only the rewritten query, without explanations or quotes.
            """
        ),
        (
            "human",
            "Original question: {question}"
        ),
    ])

    chain = prompt | llm

    response = chain.invoke({
        "question": user_query.strip()
    })

    rewritten_query = response.content.strip()


    return rewritten_query or user_query.strip()





