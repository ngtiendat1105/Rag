import os
import secrets
import threading
import time
from collections import defaultdict, deque
from functools import lru_cache

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config_llm import LLMProvider
from rag_pipeline import RAGPipeline, create_rag_pipeline
from retriever_service import RetrievalError


app = FastAPI(title="LegalAI RAG API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://legalai.id.vn", "https://www.legalai.id.vn"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-API-Key"],
)

RATE_LIMIT = int(os.getenv("LEGALAI_RATE_LIMIT", "20"))
RATE_WINDOW_SECONDS = int(os.getenv("LEGALAI_RATE_WINDOW_SECONDS", "60"))
_requests = defaultdict(deque)
_rate_lock = threading.Lock()


class ChatRequest(BaseModel):
    question: str = Field(min_length=2, max_length=2000)


class ChatResponse(BaseModel):
    question: str
    answer: str
    sources: list
    has_warning: bool
    num_sources: int


@lru_cache(maxsize=1)
def get_pipeline() -> RAGPipeline:
    return create_rag_pipeline(
        provider=LLMProvider.OLLAMA,
        model_name=os.getenv("OLLAMA_MODEL", "llama3.2:latest"),
    )


def require_api_key(x_api_key: str | None = Header(default=None)) -> None:
    configured_key = os.getenv("LEGALAI_API_KEY")
    if not configured_key:
        raise HTTPException(status_code=503, detail="API key chưa được cấu hình")
    if not x_api_key or not secrets.compare_digest(x_api_key, configured_key):
        raise HTTPException(status_code=401, detail="API key không hợp lệ")


def enforce_rate_limit(request: Request) -> None:
    client_ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    with _rate_lock:
        timestamps = _requests[client_ip]
        while timestamps and now - timestamps[0] >= RATE_WINDOW_SECONDS:
            timestamps.popleft()
        if len(timestamps) >= RATE_LIMIT:
            raise HTTPException(status_code=429, detail="Quá giới hạn request, vui lòng thử lại sau")
        timestamps.append(now)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "legalai-rag"}


@app.post("/api/chat", response_model=ChatResponse)
def chat(
    request: Request,
    payload: ChatRequest,
    _: None = Depends(require_api_key),
):
    enforce_rate_limit(request)
    try:
        result = get_pipeline().query(payload.question.strip())
    except RetrievalError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="LLM không thể xử lý yêu cầu") from exc

    if "error" in result:
        raise HTTPException(status_code=502, detail=result["error"])
    return result
