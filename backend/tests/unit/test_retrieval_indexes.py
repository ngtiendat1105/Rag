"""Regression checks for the production BHXH retrieval/index failure."""

import json
from types import SimpleNamespace
from unittest.mock import MagicMock

import numpy as np
import pytest
from qdrant_client.http import models
from qdrant_client.http.exceptions import UnexpectedResponse

from payload_indexes import REQUIRED_PAYLOAD_INDEXES, ensure_payload_indexes
from retriever_service import LegalRetrieverService, RetrievalError


def qdrant_error(field="metadata.source_file", status_code=400):
    message = f'Bad request: Index required but not found for "{field}" of type keyword.'
    return UnexpectedResponse(
        status_code=status_code,
        reason_phrase="Bad Request",
        content=json.dumps({"status": {"error": message}}).encode(),
        headers={},
    )


def service_with_client(query_points, mandatory_filters=False):
    service = object.__new__(LegalRetrieverService)
    service.stats = {
        "total_queries": 0,
        "total_documents_retrieved": 0,
        "avg_documents_per_query": 0.0,
    }
    service.similarity_threshold = 0.3
    service.use_metadata_filtering = mandatory_filters
    service.reranker = None
    service.embedder = SimpleNamespace(embed_text=lambda _: np.zeros(3))
    service.qdrant_client = SimpleNamespace(query_points=query_points)
    return service


@pytest.mark.unit
def test_bhxh_query_keeps_semantic_results_if_optional_source_index_is_missing():
    calls = []
    hit = SimpleNamespace(
        id="bhxh-chunk", score=0.9,
        payload={
            "content": "Các chế độ bảo hiểm xã hội gồm ốm đau, thai sản.",
            "metadata": {"title": "Luật Bảo hiểm xã hội 2024", "is_verified": True},
        },
    )

    def query_points(**kwargs):
        calls.append(kwargs)
        keys = {condition.key for condition in kwargs["query_filter"].must}
        if "metadata.source_file" in keys:
            raise qdrant_error()
        return SimpleNamespace(points=[hit])

    service = service_with_client(query_points, mandatory_filters=True)
    documents = service.retrieve_documents("Chế độ bảo hiểm xã hội", k=1)

    assert len(documents) == 1
    assert "bảo hiểm xã hội" in documents[0].page_content
    scoped = [c for c in calls if any(
        condition.key == "metadata.source_file" for condition in c["query_filter"].must
    )]
    assert scoped
    assert scoped[0]["query_filter"].must[0].match.value == "02_Luat_Bao_hiem_xa_hoi_2024.md"
    for call in calls:
        keys = {condition.key for condition in call["query_filter"].must}
        assert {"metadata.is_verified", "metadata.weight"} <= keys


@pytest.mark.unit
def test_missing_required_filter_index_does_not_retry_without_filter():
    calls = []

    def query_points(**kwargs):
        calls.append(kwargs)
        raise qdrant_error("metadata.is_verified")

    service = service_with_client(query_points, mandatory_filters=True)
    with pytest.raises(RetrievalError):
        service.retrieve_documents("Chế độ bảo hiểm xã hội")

    assert len(calls) == 1
    assert calls[0]["query_filter"] is not None


@pytest.mark.unit
@pytest.mark.parametrize("error", [
    TimeoutError("Qdrant read timed out"),
    qdrant_error(status_code=403),
    qdrant_error("metadata.is_verified"),
])
def test_optional_source_search_propagates_unrelated_errors(error):
    def query_points(**kwargs):
        if kwargs["query_filter"] is not None:
            raise error
        return SimpleNamespace(points=[])

    service = service_with_client(query_points)
    with pytest.raises(RetrievalError) as result:
        service.retrieve_documents("Chế độ bảo hiểm xã hội")
    assert result.value.__cause__ is error


@pytest.mark.unit
def test_payload_index_provisioning_is_idempotent_and_never_changes_vectors():
    class Client:
        schema = {}
        calls = []

        def get_collection(self, **_kwargs):
            return SimpleNamespace(payload_schema=self.schema)

        def create_payload_index(self, **kwargs):
            self.calls.append(kwargs)
            self.schema[kwargs["field_name"]] = SimpleNamespace(data_type=kwargs["field_schema"])

    client = Client()
    assert set(ensure_payload_indexes(client, "test")) == set(REQUIRED_PAYLOAD_INDEXES)
    assert ensure_payload_indexes(client, "test") == []
    assert len(client.calls) == 3
    assert all(call["wait"] is True for call in client.calls)


@pytest.mark.unit
def test_incompatible_index_is_not_overwritten():
    client = SimpleNamespace(get_collection=lambda **_: SimpleNamespace(payload_schema={
        "metadata.source_file": SimpleNamespace(data_type=models.PayloadSchemaType.INTEGER)
    }))
    with pytest.raises(ValueError, match="expected keyword"):
        ensure_payload_indexes(client, "test")


@pytest.mark.unit
def test_existing_float_weight_index_and_fractional_filter_are_preserved():
    client = SimpleNamespace(get_collection=lambda **_: SimpleNamespace(payload_schema={
        field: SimpleNamespace(data_type=(
            models.PayloadSchemaType.FLOAT if field == "metadata.weight" else kind
        )) for field, kind in REQUIRED_PAYLOAD_INDEXES.items()
    }))
    assert ensure_payload_indexes(client, "test") == []
    service = service_with_client(lambda **_: None)
    condition = service._build_qdrant_filter({"weight": 1.5}).must[0]
    assert condition.match is None
    assert condition.range.gte == condition.range.lte == 1.5


@pytest.mark.unit
def test_ingestion_manager_uses_remote_environment_by_default(monkeypatch):
    import vector_db_manager

    calls = []
    monkeypatch.setenv("QDRANT_URL", "https://example.invalid")
    monkeypatch.setenv("QDRANT_API_KEY", "test-key")
    monkeypatch.setenv("QDRANT_TIMEOUT_SECONDS", "17")
    monkeypatch.setattr(vector_db_manager, "QdrantClient", lambda **kwargs: calls.append(kwargs))
    monkeypatch.setattr(vector_db_manager.VectorDBManager, "_check_connection", lambda _: None)

    manager = vector_db_manager.create_vector_db_manager()

    assert manager.local_mode is False
    assert calls == [{"url": "https://example.invalid", "api_key": "test-key", "timeout": 17.0}]


@pytest.mark.unit
def test_explicit_local_mode_keeps_ingestion_off_remote_cloud(monkeypatch):
    import vector_db_manager

    calls = []
    root = MagicMock()
    storage_path = root.__truediv__.return_value
    storage_path.__str__.return_value = "local-test-storage"
    monkeypatch.setenv("QDRANT_URL", "https://example.invalid")
    monkeypatch.setattr(vector_db_manager, "VECTOR_DB_DIR", root)
    monkeypatch.setattr(vector_db_manager, "QdrantClient", lambda **kwargs: calls.append(kwargs))
    monkeypatch.setattr(vector_db_manager.VectorDBManager, "_check_connection", lambda _: None)

    manager = vector_db_manager.create_vector_db_manager(local_mode=True)

    assert manager.local_mode is True
    assert calls == [{"path": "local-test-storage"}]
