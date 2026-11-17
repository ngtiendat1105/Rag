from types import SimpleNamespace

import pytest
from langchain_core.runnables import RunnableLambda

from config_llm import LLMConfig, LLMProvider
from rag_pipeline import RAGPipeline
from retriever_service import LegalRetrieverService
from query_understanding import understand_query


@pytest.mark.unit
@pytest.mark.parametrize(
    ("provider", "expected_model"),
    [
        (LLMProvider.OPENAI, LLMConfig.OPENAI_MODEL),
        (LLMProvider.GOOGLE_GEMINI, LLMConfig.GEMINI_MODEL),
        (LLMProvider.OLLAMA, LLMConfig.OLLAMA_MODEL),
        (LLMProvider.HUGGINGFACE, LLMConfig.HUGGINGFACE_MODEL),
    ],
)
def test_provider_config_is_safe_and_provider_specific(provider, expected_model, capsys):
    config = LLMConfig(provider=provider)
    result = config.get_provider_config()

    assert result["provider"] is provider
    assert result["model"] == expected_model
    assert "api_key" not in capsys.readouterr().out


@pytest.mark.unit
def test_local_config_imports_without_name_error():
    from local_config import LocalLLMConfig

    assert LocalLLMConfig().provider is LLMProvider.HUGGINGFACE


@pytest.mark.unit
def test_bhxh_and_contract_aliases_target_source_documents():
    bhxh = understand_query("BHXH là gì?")
    contract = understand_query("Nội dung hợp đồng lao động là gì?")

    assert "02_Luat_Bao_hiem_xa_hoi_2024.md" in bhxh["source_file_hints"]
    assert "01_Bo_luat_Lao_dong_2019.md" in contract["source_file_hints"]


@pytest.mark.unit
def test_metadata_filter_is_forwarded_to_qdrant():
    service = object.__new__(LegalRetrieverService)
    service.stats = {"total_queries": 0, "total_documents_retrieved": 0, "avg_documents_per_query": 0.0}
    service.similarity_threshold = 0.3
    service.use_metadata_filtering = True
    service.reranker = None
    service.qdrant_client = SimpleNamespace()
    service.embedder = SimpleNamespace(embed_text=lambda _: __import__("numpy").zeros(3))
    service.qdrant_client.query_points = lambda **kwargs: SimpleNamespace(points=[])
    service._build_qdrant_filter = LegalRetrieverService._build_qdrant_filter.__get__(service)

    captured = []
    def query_points(**kwargs):
        captured.append(kwargs)
        return SimpleNamespace(points=[])
    service.qdrant_client.query_points = query_points

    service.retrieve_documents("quy định bảo hiểm", k=1)

    assert captured
    assert captured[0]["query_filter"].must
    keys = {condition.key for condition in captured[0]["query_filter"].must}
    assert {"metadata.is_verified", "metadata.weight"} <= keys


@pytest.mark.unit
def test_pipeline_preserves_citation_metadata_and_skips_llm_without_context():
    class Retriever:
        def retrieve_documents(self, *_args, **_kwargs):
            return [SimpleNamespace(
                page_content="Căn cứ test",
                metadata={
                    "document_name": "Luật test",
                    "article_number": "7",
                    "clause_number": "2",
                    "doc_id": "DOC-7",
                    "chunk_id": "chunk-7",
                    "effective_date": "2025-01-01",
                    "status": "Còn hiệu lực",
                    "is_verified": True,
                },
            )]

    class Config:
        def get_llm(self):
            return RunnableLambda(lambda _: "Câu trả lời")

    result = RAGPipeline(config=Config(), retriever_service=Retriever()).query("quy định test")
    source = result["sources"][0]
    assert source["document"] == "Luật test"
    assert source["article"] == "7"
    assert source["clause"] == "2"
    assert source["doc_id"] == "DOC-7"
    assert source["chunk_id"] == "chunk-7"
    assert source["effective_date"] == "2025-01-01"
    assert source["status"] == "Còn hiệu lực"


@pytest.mark.unit
def test_pipeline_does_not_call_llm_without_context():
    class Retriever:
        def retrieve_documents(self, *_args, **_kwargs):
            return []

    class Config:
        def get_llm(self):
            raise AssertionError("LLM must not be initialized for this test")

    pipeline = object.__new__(RAGPipeline)
    pipeline.config = Config()
    pipeline.retriever_service = Retriever()
    result = pipeline.query("quy định không có dữ liệu")

    assert result["sources"] == []
    assert result["num_sources"] == 0
    assert "không chứa thông tin" in result["answer"]


@pytest.mark.unit
def test_expired_document_metadata_is_preserved_without_implicit_filtering():
    class Retriever:
        def retrieve_documents(self, *_args, **_kwargs):
            return [SimpleNamespace(
                page_content="Tài liệu cũ",
                metadata={
                    "document_name": "Luật cũ",
                    "effective_date": "2020-01-01",
                    "status": "Hết hiệu lực",
                    "is_verified": True,
                },
            )]

    class Config:
        def get_llm(self):
            return RunnableLambda(lambda _: "Câu trả lời có căn cứ")

    result = RAGPipeline(config=Config(), retriever_service=Retriever()).query("quy định cũ")

    assert result["sources"][0]["effective_date"] == "2020-01-01"
    assert result["sources"][0]["status"] == "Hết hiệu lực"
    assert result["sources"][0]["is_verified"] is True


@pytest.mark.unit
def test_retry_retries_timeout_with_mocked_sleep(monkeypatch):
    calls = {"invoke": 0}
    sleeps = []

    class Config:
        MAX_RETRIES = 2

    pipeline = object.__new__(RAGPipeline)
    pipeline.config = Config()
    pipeline.rag_chain = RunnableLambda(
        lambda _: (_ for _ in ()).throw(TimeoutError("timeout"))
        if calls.__setitem__("invoke", calls["invoke"] + 1) or calls["invoke"] <= 3
        else "ok"
    )
    monkeypatch.setattr("rag_pipeline.time.sleep", sleeps.append)

    with pytest.raises(TimeoutError):
        pipeline._invoke_with_retry("prompt")
    assert calls["invoke"] == 3
    assert sleeps == [1, 2]
