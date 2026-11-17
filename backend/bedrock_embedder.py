"""Amazon Bedrock Titan Text Embeddings adapter.

This adapter deliberately has no torch/sentence-transformers dependency so it is
safe to run in a small Lambda container.
"""

import json
import os
import time
from typing import List, Optional

import boto3
import numpy as np


class BedrockEmbedder:
    def __init__(
        self,
        model_name: Optional[str] = None,
        dimension: Optional[int] = None,
        region_name: Optional[str] = None,
    ):
        self.model_name = model_name or os.getenv("RAG_EMBEDDING_MODEL", "amazon.titan-embed-text-v2:0")
        self.embedding_dimension = int(dimension or os.getenv("RAG_EMBEDDING_DIMENSION", "1024"))
        self.region_name = region_name or os.getenv("BEDROCK_REGION", "us-east-1")
        self.client = boto3.client("bedrock-runtime", region_name=self.region_name)
        self.total_texts_embedded = 0
        self.total_time_seconds = 0.0

    def embed_text(self, text: str) -> np.ndarray:
        if not text or not text.strip():
            raise ValueError("Text cannot be empty for embedding")
        started = time.time()
        try:
            response = self.client.invoke_model(
                modelId=self.model_name,
                body=json.dumps({
                    "inputText": text,
                    "dimensions": self.embedding_dimension,
                    "normalize": True,
                }),
                contentType="application/json",
                accept="application/json",
            )
            payload = json.loads(response["body"].read())
            vector = np.asarray(payload["embedding"], dtype=np.float32)
            if vector.shape != (self.embedding_dimension,):
                raise RuntimeError(
                    f"Bedrock embedding dimension mismatch: expected {self.embedding_dimension}, got {vector.shape}"
                )
            self.total_texts_embedded += 1
            self.total_time_seconds += time.time() - started
            return vector
        except Exception as exc:
            raise RuntimeError(f"Bedrock embedding failed: {exc}") from exc

    def embed_batch(self, texts: List[str]) -> np.ndarray:
        valid = [text for text in texts if text and text.strip()]
        if not valid:
            raise ValueError("No valid texts for embedding")
        return np.vstack([self.embed_text(text) for text in valid])

    def get_embedding_dimension(self) -> int:
        return self.embedding_dimension

    def get_model_info(self) -> dict:
        return {
            "provider": "bedrock",
            "model_name": self.model_name,
            "region": self.region_name,
            "embedding_dimension": self.embedding_dimension,
            "total_texts_embedded": self.total_texts_embedded,
            "total_time_seconds": self.total_time_seconds,
        }

    def validate_embeddings(self, embeddings: np.ndarray, expected_count: int) -> bool:
        return bool(
            isinstance(embeddings, np.ndarray)
            and embeddings.ndim == 2
            and embeddings.shape == (expected_count, self.embedding_dimension)
            and not np.any(np.isnan(embeddings))
        )

