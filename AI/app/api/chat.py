from dotenv import load_dotenv
load_dotenv()


import hmac
import os
from typing import Literal

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from app.agent.graph import rag_agent
from app.agent.state import AgentState

router = APIRouter()



class ChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=10000)


class ChatRequest(BaseModel):
    conversation_id: str = Field(min_length=1, max_length=100)
    user_id: str = Field(min_length=1, max_length=100)
    user_role: str = Field(min_length=1, max_length=100)
    access_scope: str = Field(min_length=1, max_length=100)
    team_id: str | None = Field(default=None, max_length=100)
    query: str = Field(min_length=1, max_length=10000)
    history: list[ChatHistoryMessage] = Field(default_factory=list, max_length=100)


class Citation(BaseModel):
    document_id: str | None = None
    version_id: str | None = None
    document_title: str | None = None
    page_number: int | str | None = None


class ChatResponse(BaseModel):
    conversation_id: str
    thread_id: str
    answer: str
    citations: list[Citation]


def _require_service_token(authorization: str | None) -> None:
    expected = os.getenv("ONBOARDIQ_SERVICE_TOKEN")
    provided = authorization[7:] if authorization and authorization.startswith("Bearer ") else None
    if not expected or not provided or not hmac.compare_digest(provided, expected):
        raise HTTPException(status_code=401, detail="Service authentication required")





@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    authorization: str | None = Header(default=None)
):

    # 1. Authenticate Node.js backend
    _require_service_token(authorization)

    try:

        # 2. Initialize LangGraph state
        initial_state: AgentState = {

            # Request information
            "conversation_id": request.conversation_id,
            "user_id": request.user_id,
            "user_role": request.user_role,
            "access_scope": request.access_scope,
            "team_id": request.team_id,

            # Current user query
            "query": request.query,

            # Previous conversation history
            "conversation_history": [ message.model_dump() for message in request.history]
        }

        # 3. Execute Agentic RAG workflow
        result = await rag_agent.ainvoke(initial_state)

        # 4. Extract generated answer
        answer = result.get("answer", "")

        citations = result.get("citations", [])

        if not answer:
            raise HTTPException(
                status_code=502,
                detail="The AI workflow did not generate an answer"
            )

        # 5. Return response to Node.js
        return ChatResponse(
            conversation_id=request.conversation_id,
            thread_id=request.conversation_id,
            answer=answer,
            citations=citations
        )

    except HTTPException:
        raise

    except Exception as error:

        print("Agentic RAG execution failed:", error)

        raise HTTPException(
            status_code=502,
            detail="The AI workflow could not complete"
        ) from error




