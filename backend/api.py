import logging
import os
import secrets
import sys
import threading
import time
from pathlib import Path
from collections import defaultdict, deque
from functools import lru_cache
from typing import TYPE_CHECKING

from fastapi import Depends, FastAPI, File, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / '.env.local')

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except AttributeError:
        pass

if TYPE_CHECKING:
    from rag_pipeline import RAGPipeline


app = FastAPI(title="LegalAI RAG API", version="1.0.0")
logger = logging.getLogger(__name__)
configured_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "https://legalai.id.vn,https://www.legalai.id.vn",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-API-Key"],
)

RATE_LIMIT = int(os.getenv("LEGALAI_RATE_LIMIT", "20"))
RATE_WINDOW_SECONDS = int(os.getenv("LEGALAI_RATE_WINDOW_SECONDS", "60"))
_requests = defaultdict(deque)
_rate_lock = threading.Lock()
_reindex_lock = threading.Lock()


class ChatRequest(BaseModel):
    question: str = Field(min_length=2, max_length=2000)


class ChatResponse(BaseModel):
    question: str
    answer: str
    sources: list
    has_warning: bool
    num_sources: int


@lru_cache(maxsize=1)
def get_pipeline() -> "RAGPipeline":
    from config_llm import LLMProvider
    from rag_pipeline import create_rag_pipeline
    provider_name = os.getenv("RAG_LLM_PROVIDER", "ollama").strip().lower()
    providers = {
        "ollama": LLMProvider.OLLAMA,
        "openai": LLMProvider.OPENAI,
        "google_gemini": LLMProvider.GOOGLE_GEMINI,
        "gemini": LLMProvider.GOOGLE_GEMINI,
        "bedrock": LLMProvider.BEDROCK,
    }
    provider = providers.get(provider_name)
    if provider is None:
        raise ValueError(f"RAG_LLM_PROVIDER không hợp lệ: {provider_name}")
    return create_rag_pipeline(
        provider=provider,
        model_name=(
            os.getenv("RAG_LLM_MODEL")
            or (os.getenv("OLLAMA_MODEL", "llama3.2:3b") if provider == LLMProvider.OLLAMA else None)
        ),
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


def _release_cached_pipeline() -> None:
    if get_pipeline.cache_info().currsize == 0:
        return
    pipeline = get_pipeline()
    client = getattr(getattr(pipeline, "retriever_service", None), "qdrant_client", None)
    close = getattr(client, "close", None)
    if callable(close):
        close()
    get_pipeline.cache_clear()


@app.post("/api/documents/ingest")
def ingest_document(
    file: UploadFile = File(...),
    _: None = Depends(require_api_key),
):
    """Save an uploaded document and rebuild the local knowledge index."""
    from config import UPLOAD_DIR
    from sync_documents import build_knowledge_base, rebuild_index

    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".md", ".markdown", ".docx", ".pdf", ".png", ".jpg", ".jpeg", ".tif", ".tiff"}:
        raise HTTPException(status_code=400, detail="Định dạng tài liệu không được hỗ trợ")

    safe_name = Path(file.filename or "document").name
    target = UPLOAD_DIR / safe_name
    try:
        target.write_bytes(file.file.read())
        with _reindex_lock:
            _release_cached_pipeline()
            count, errors = build_knowledge_base()
            if errors:
                raise RuntimeError("; ".join(errors))
            rebuild_index()
            get_pipeline.cache_clear()
        return {"status": "indexed", "file": safe_name, "chunks": count}
    except Exception as exc:
        logger.exception("Document ingestion failed for %s", safe_name)
        raise HTTPException(status_code=503, detail=f"File đã nhận nhưng chưa lập chỉ mục: {exc}") from exc


@app.post("/api/chat", response_model=ChatResponse)
def chat(
    request: Request,
    payload: ChatRequest,
    _: None = Depends(require_api_key),
):
    from query_understanding import OFF_TOPIC_RESPONSE, is_supported_question

    enforce_rate_limit(request)
    question = payload.question.strip()
    if not is_supported_question(question):
        return {
            "question": question,
            "answer": OFF_TOPIC_RESPONSE,
            "sources": [],
            "has_warning": False,
            "num_sources": 0,
        }
    from retriever_service import RetrievalError
    try:
        result = get_pipeline().query(question)
    except RetrievalError as exc:
        logger.exception("RAG retrieval failed")
        raise HTTPException(status_code=503, detail="Không thể truy vấn kho tài liệu. Vui lòng thử lại sau.") from exc
    except Exception as exc:
        logger.exception("RAG pipeline initialization or generation failed")
        raise HTTPException(status_code=502, detail="LLM không thể xử lý yêu cầu") from exc

    if "error" in result:
        logger.error("RAG generation failed: %s", result["error"])
        raise HTTPException(status_code=502, detail="Dịch vụ AI không thể xử lý yêu cầu. Vui lòng thử lại sau.")
    return result
