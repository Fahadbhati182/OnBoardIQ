import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from openai import AsyncOpenAI
from ragas.llms import llm_factory
from ragas.embeddings.base import embedding_factory

ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(ENV_PATH)


@lru_cache(maxsize=1)
def get_evaluation_llm():
    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise ValueError("GROQ_API_KEY is missing in .env")

    model = os.getenv(
        "RAGAS_LLM_MODEL",
        "llama-3.3-70b-versatile"
    )

    client = AsyncOpenAI(
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1"
    )

    return llm_factory(
        model=model,
        client=client,
        temperature=0,
        max_tokens=16384,
    )


@lru_cache(maxsize=1)
def get_evaluation_embeddings():
    model_name = os.getenv(
        "RAGAS_EMBEDDING_MODEL",
        "sentence-transformers/all-MiniLM-L6-v2"
    )

    return embedding_factory(
        provider="huggingface",
        model=model_name
    )