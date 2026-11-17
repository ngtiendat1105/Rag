"""HTTP contract tests: auth, validation, safe infrastructure failures, response schema."""

import sys
from types import ModuleType, SimpleNamespace

import pytest
from fastapi.testclient import TestClient

import api
from query_understanding import OFF_TOPIC_RESPONSE


pytestmark = pytest.mark.unit
QUESTION = "Thời gian thử việc tối đa là bao lâu?"
TEST_KEY = "test-only-api-key"


class RetrievalError(RuntimeError):
    """Test double for the HTTP boundary; retrieval has separate unit tests."""


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("LEGALAI_API_KEY", TEST_KEY)
    # The endpoint only needs this exception symbol. Avoid importing the ML
    # runtime for HTTP contract tests that never execute vector retrieval.
    retriever_module = ModuleType("retriever_service")
    retriever_module.RetrievalError = RetrievalError
    monkeypatch.setitem(sys.modules, "retriever_service", retriever_module)
    api._requests.clear()
    # Every test must explicitly supply a pipeline if its path should reach it.
    def unexpected_pipeline():
        raise AssertionError("This request must not initialize a real pipeline")
    monkeypatch.setattr(api, "get_pipeline", unexpected_pipeline)
    with TestClient(api.app) as http:
        yield http
    api._requests.clear()


def post(client, payload=None):
    return client.post(
        "/api/chat", headers={"X-API-Key": TEST_KEY},
        json=payload if payload is not None else {"question": QUESTION},
    )


@pytest.mark.parametrize("key", [None, "incorrect-key"])
def test_chat_rejects_missing_or_incorrect_key_before_pipeline(client, key):
    response = client.post(
        "/api/chat", json={"question": QUESTION},
        headers={"X-API-Key": key} if key is not None else {},
    )
    assert response.status_code == 401
    assert TEST_KEY not in response.text


def test_chat_requires_server_api_key_configuration(client, monkeypatch):
    monkeypatch.delenv("LEGALAI_API_KEY")
    response = post(client)
    assert response.status_code == 503
    assert response.json() == {"detail": "API key chưa được cấu hình"}


@pytest.mark.parametrize("payload", [{}, {"question": ""}, {"question": "x"}, {"question": "x" * 2001}])
def test_chat_validates_request_before_initializing_pipeline(client, payload):
    assert post(client, payload).status_code == 422


def test_off_topic_request_has_no_sources_and_never_initializes_model(client):
    response = post(client, {"question": "2 + 2 = ?"})
    assert response.status_code == 200
    assert response.json() == {
        "question": "2 + 2 = ?", "answer": OFF_TOPIC_RESPONSE,
        "sources": [], "has_warning": False, "num_sources": 0,
    }


@pytest.mark.parametrize("initialization_failure", [True, False])
def test_retrieval_error_is_503_without_exposing_qdrant_details(client, monkeypatch, initialization_failure):
    private_error = 'Qdrant HTTP400 api-key=secret-value metadata.source_file raw content'

    def fail(*_args):
        raise RetrievalError(private_error)

    monkeypatch.setattr(
        api, "get_pipeline",
        fail if initialization_failure else lambda: SimpleNamespace(query=fail),
    )
    response = post(client)
    assert response.status_code == 503
    assert response.json() == {"detail": "Không thể truy vấn kho tài liệu. Vui lòng thử lại sau."}
    for sensitive in ("Qdrant", "secret-value", "metadata.source_file", "raw content"):
        assert sensitive not in response.text


def test_pipeline_exception_is_502_without_credentials_or_model_internals(client, monkeypatch):
    def fail():
        raise RuntimeError("AccessDeniedException credential=private-aws-token")

    monkeypatch.setattr(api, "get_pipeline", fail)
    response = post(client)
    assert response.status_code == 502
    assert response.json() == {"detail": "LLM không thể xử lý yêu cầu"}
    assert "private-aws-token" not in response.text
    assert "AccessDeniedException" not in response.text


def test_error_result_is_502_instead_of_successful_chat_or_raw_error(client, monkeypatch):
    monkeypatch.setattr(api, "get_pipeline", lambda: SimpleNamespace(query=lambda _: {
        "error": "Bedrock denied token=private-token",
        "answer": "raw provider response",
    }))
    response = post(client)
    assert response.status_code == 502
    assert response.json() == {"detail": "Dịch vụ AI không thể xử lý yêu cầu. Vui lòng thử lại sau."}
    assert "private-token" not in response.text
    assert "raw provider response" not in response.text


def test_success_preserves_chat_response_and_citation_schema(client, monkeypatch):
    result = {
        "question": QUESTION, "answer": "Nội dung được trích dẫn.",
        "sources": [{"document": "Tài liệu kiểm thử", "article": "25"}],
        "has_warning": True, "num_sources": 1,
    }
    monkeypatch.setattr(api, "get_pipeline", lambda: SimpleNamespace(query=lambda _: result))
    response = post(client)
    assert response.status_code == 200
    assert response.json() == result
