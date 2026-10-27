"""Validated application settings shared by backend configuration modules."""

from enum import Enum
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class SettingsProvider(str, Enum):
    OPENAI = "openai"
    GOOGLE_GEMINI = "google_gemini"
    OLLAMA = "ollama"
    HUGGINGFACE = "huggingface"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(
            Path(__file__).resolve().parents[1] / ".env.local",
            Path(__file__).resolve().parents[1] / ".env",
        ),
        extra="ignore",
        case_sensitive=False,
    )

    rag_llm_provider: SettingsProvider = SettingsProvider.OPENAI
    rag_llm_model: str = "llama3.2:latest"
    rag_top_k: int = Field(default=8, gt=0)
    rag_retrieval_top_k: int | None = Field(default=None, gt=0)
    rag_rerank_top_n: int = Field(default=3, gt=0)
    rag_max_output_tokens: int = Field(default=700, gt=0)
    llm_request_timeout_seconds: float = Field(default=120.0, gt=0)
    llm_max_retries: int = Field(default=2, ge=0)
    rag_request_timeout_ms: int = Field(default=180_000, gt=0)
    rag_max_context_documents: int = Field(default=3, gt=0)
    rag_max_context_chars: int = Field(default=8_000, gt=0)
    rag_similarity_threshold: float = Field(default=0.3, ge=0.0, le=1.0)
    openai_api_key: str = ""
    google_api_key: str = ""
    ollama_base_url: str = "http://localhost:11434"
    ollama_keep_alive: str = "30m"
    ollama_num_ctx: int = Field(default=4096, gt=0)
    rag_reranker_model: str = ""
    rag_reranker_max_length: int = Field(default=512, gt=0)
    rag_use_metadata_filtering: bool = False

    @field_validator("rag_llm_model", "ollama_base_url")
    @classmethod
    def require_non_empty(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("configuration value must not be empty")
        return value

    @property
    def effective_retrieval_top_k(self) -> int:
        return self.rag_retrieval_top_k or self.rag_top_k


settings = Settings()
