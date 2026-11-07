from typing import Literal
from pydantic import BaseModel


class QueryAnalysisOutput(BaseModel):

    intent: Literal[
        "GREETING",
        "FACTUAL",
        "COMPARISON",
        "MULTI_HOP",
        "FOLLOW_UP",
        "OUT_OF_SCOPE"
    ]

    requires_retrieval: bool