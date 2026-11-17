import os
import secrets
import threading
import time
import tempfile
import shutil
from pathlib import Path
from collections import defaultdict, deque
from functools import lru_cache
from typing import TYPE_CHECKING

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / '.env.local')

if TYPE_CHECKING:
    from rag_pipeline import RAGPipeline


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
    suggested_questions: list[str] = []


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
    }
    provider = providers.get(provider_name)
    if provider is None:
        raise ValueError(f"RAG_LLM_PROVIDER không hợp lệ: {provider_name}")
    return create_rag_pipeline(
        provider=provider,
        model_name=os.getenv("RAG_LLM_MODEL") or os.getenv("OLLAMA_MODEL", "llama3.2:latest"),
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
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="LLM không thể xử lý yêu cầu") from exc

    if "error" in result:
        raise HTTPException(status_code=502, detail=result["error"])
    return result


@app.post("/api/chat/local", response_model=ChatResponse)
def local_chat(
    request: Request,
    question: str = Form(..., min_length=2, max_length=2000),
    files: list[UploadFile] = File(...),
    _: None = Depends(require_api_key),
):
    enforce_rate_limit(request)
    if not files or len(files) > 5:
        raise HTTPException(status_code=400, detail="Vui lòng đính kèm từ 1 đến 5 tài liệu.")

    from document_loader import load_document

    combined_parts = []
    first_name = files[0].filename or "tài liệu tải lên"
    temp_paths: list[Path] = []
    try:
        for upload in files:
            filename = Path(upload.filename or "document").name
            suffix = Path(filename).suffix.lower()
            if suffix not in {".pdf", ".doc", ".docx", ".txt"}:
                raise HTTPException(status_code=400, detail=f"{filename}: chỉ hỗ trợ PDF, Word hoặc TXT.")
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
                shutil.copyfileobj(upload.file, temp)
                temp_paths.append(Path(temp.name))
            if temp_paths[-1].stat().st_size > 10 * 1024 * 1024:
                raise HTTPException(status_code=413, detail=f"{filename}: kích thước vượt quá 10 MB.")
            if suffix == ".txt":
                text = temp_paths[-1].read_text(encoding="utf-8", errors="replace")
            else:
                _, text = load_document(temp_paths[-1])
            combined_parts.append(f"### Tài liệu: {filename}\n{text}")
        result = get_pipeline().query_local_document(question, first_name, "\n\n".join(combined_parts))
        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Không thể phân tích tài liệu đính kèm: {exc}") from exc
    finally:
        for path in temp_paths:
            path.unlink(missing_ok=True)


@app.get("/api/documents/preview")
def document_preview(name: str, _: None = Depends(require_api_key)):
    from config import INPUT_DIR, UPLOAD_DIR

    safe_name = Path(name).name
    candidates = [UPLOAD_DIR / safe_name, INPUT_DIR / safe_name]
    path = next((candidate for candidate in candidates if candidate.is_file()), None)
    if path is None or path.suffix.lower() != ".pdf":
        raise HTTPException(status_code=404, detail="Không tìm thấy file PDF nguồn.")
    return FileResponse(path, media_type="application/pdf", filename=path.name)
