import json
from pathlib import Path

import numpy as np
import pytest
from fastapi.testclient import TestClient
from langchain_core.runnables import RunnableLambda

import embedder as embedder_module
import vector_db_manager as vdb_module
import api as api_module
from markdown_chunker import MarkdownChunker
from rag_pipeline import RAGPipeline
from evaluate_rag import evaluate_results
from metadata_utils import normalize_metadata
from sync_documents import build_knowledge_base
from config import get_input_files
from query_understanding import understand_query
from document_loader import load_document


def test_chunker_returns_expected_chunk_schema():
    markdown_content = """
### Điều 1. Phạm vi điều chỉnh
**Khoản 1:** Nội dung thứ nhất.
> Ghi chú đối chiếu
> Dòng tiếp theo

### Điều 2. Đối tượng áp dụng
**Khoản 1:** Nội dung thứ hai.
""".strip()

    base_metadata = {"doc_id": "DOC-001", "title": "Văn bản test", "is_verified": True}
    chunker = MarkdownChunker()

    chunks = chunker.create_chunks_with_metadata(markdown_content, base_metadata)

    assert len(chunks) == 2
    for chunk in chunks:
        assert "article_title" in chunk
        assert "content" in chunk
        assert "metadata" in chunk
        assert "analysis" in chunk
        assert "is_valid" in chunk
        assert chunk["article_title"].startswith("### Điều")
        assert isinstance(chunk["metadata"], dict)
        assert chunk["metadata"]["doc_id"] == "DOC-001"


def test_chunker_accepts_generic_level_three_headings():
    content = """
### 1.1. Phạm vi điều chỉnh
Nội dung phạm vi.

### 2.1. Hợp đồng điện tử
Nội dung hợp đồng.
""".strip()

    chunks = MarkdownChunker().create_chunks_with_metadata(content, {"doc_id": "DOC-002"})

    assert len(chunks) == 2
    assert chunks[0]["article_title"] == "### 1.1. Phạm vi điều chỉnh"
    assert chunks[1]["article_title"] == "### 2.1. Hợp đồng điện tử"


def test_chunker_keeps_content_under_chapter_heading():
    content = """
### 4.3. Tranh chấp
Nội dung chương bốn.

## CHƯƠNG 5. CHECKLIST RÀ SOÁT HỢP ĐỒNG THƯƠNG MẠI
- [ ] Kiểm tra thẩm quyền ký.
""".strip()

    chunks = MarkdownChunker().create_chunks_with_metadata(content, {"doc_id": "DOC-003"})

    assert any(
        chunk["article_title"] == "## CHƯƠNG 5. CHECKLIST RÀ SOÁT HỢP ĐỒNG THƯƠNG MẠI"
        and "Kiểm tra thẩm quyền ký" in chunk["content"]
        for chunk in chunks
    )


def test_commercial_law_checklist_is_indexable():
    source = Path(__file__).resolve().parents[2] / "data_documents" / "06_Luat_Thuong_mai_2005.md"
    metadata, content = load_document(source)
    chunks = MarkdownChunker().create_chunks_with_metadata(content, metadata)

    assert any(
        "CHECKLIST RÀ SOÁT HỢP ĐỒNG THƯƠNG MẠI" in chunk["article_title"]
        and "Mức phạt vi phạm" in chunk["content"]
        for chunk in chunks
    )


def test_sync_documents_rebuilds_jsonl_from_markdown(tmp_path, monkeypatch):
    source = tmp_path / "11_test.md"
    source.write_text(
        "---\n"
        "doc_id: TEST-11\n"
        "title: Tài liệu test\n"
        "---\n\n"
        "### 1.1. Phạm vi\nNội dung test.\n",
        encoding="utf-8",
    )
    output = tmp_path / "processed.jsonl"
    monkeypatch.setattr("sync_documents.OUTPUT_FILE", output)

    count, errors = build_knowledge_base([source])

    assert count == 1
    assert errors == []
    record = json.loads(output.read_text(encoding="utf-8").splitlines()[0])
    assert record["metadata"]["doc_id"] == "TEST-11"
    assert record["article_title"] == "### 1.1. Phạm vi"


def test_input_files_exclude_project_documentation():
    files = get_input_files()
    names = {path.name for path in files}

    assert "11_Luat_Giao_dich_dien_tu_2023.md" in names
    assert all(path.parent.name == "data_documents" for path in files)
    assert "README_PHASE2.md" not in names
    assert "TESTING_COMPLETE.md" not in names


def test_query_understanding_expands_legal_terms_and_extracts_structure():
    analysis = understand_query(
        "Cty phải làm gì khi nhân viên hỏi về hợp đồng điện tử ở Điều 14 Khoản 1?"
    )

    assert analysis["article_number"] == "14"
    assert analysis["clause_number"] == "1"
    assert "Luật Giao dịch điện tử 2023" in analysis["document_hints"]
    assert "11_Luat_Giao_dich_dien_tu_2023.md" in analysis["source_file_hints"]
    assert len(analysis["query_variants"]) >= 2
    assert any("giao dịch điện tử" in variant for variant in analysis["query_variants"])


def test_query_understanding_handles_unaccented_user_input():
    analysis = understand_query("cty hoi ve hop dong dien tu dieu 14 khoan 1")

    assert analysis["article_number"] == "14"
    assert analysis["clause_number"] == "1"
    assert "Luật Giao dịch điện tử 2023" in analysis["document_hints"]


def test_document_loader_reads_plain_markdown(tmp_path):
    source = tmp_path / "contract.md"
    source.write_text("# Hợp đồng\nNội dung thử nghiệm.", encoding="utf-8")

    metadata, content = load_document(source)

    assert metadata["document_type"] == "markdown"
    assert "Nội dung thử nghiệm" in content


def test_document_loader_rejects_unsupported_format(tmp_path):
    source = tmp_path / "contract.exe"
    source.write_bytes(b"not a document")

    with pytest.raises(ValueError, match="chưa được hỗ trợ"):
        load_document(source)


def test_metadata_is_normalized_for_citations():
    metadata = normalize_metadata(
        {"document_name": "Luật test", "article": "7", "weight": 1}
    )

    assert metadata["title"] == "Luật test"
    assert metadata["document_name"] == "Luật test"
    assert metadata["article_number"] == "7"
    assert metadata["article"] == "7"
    assert metadata["weight"] == 1.0


def test_evaluation_metrics_include_recall_mrr_and_citation_accuracy():
    cases = [{
        "question": "q",
        "expected_doc_id": "doc-1",
        "expected_article": "7",
        "expected_citation": {"document": "Luật test", "article": "7"},
    }]

    metrics = evaluate_results(
        cases,
        lambda _question, _top_k: {
            "results": [{
                "metadata": {
                    "doc_id": "doc-1",
                    "article_number": "7",
                    "title": "Luật test",
                }
            }]
        },
        top_k=1,
    )

    assert metrics["recall_at_1"] == 1.0
    assert metrics["mrr"] == 1.0
    assert metrics["citation_accuracy"] == 1.0


def test_embedder_returns_expected_dimensions(monkeypatch):
    expected_dim = 5

    class FakeSentenceTransformer:
        def __init__(self, *args, **kwargs):
            pass

        def encode(self, texts, convert_to_numpy=True, **kwargs):
            if isinstance(texts, list):
                return np.ones((len(texts), expected_dim), dtype=np.float32)
            return np.ones(expected_dim, dtype=np.float32)

    monkeypatch.setattr(embedder_module, "SENTENCE_TRANSFORMERS_AVAILABLE", True)
    monkeypatch.setattr(embedder_module, "SentenceTransformer", FakeSentenceTransformer)

    model = embedder_module.VietnameseEmbedder(model_name="fake-model", device="cpu")
    single = model.embed_text("test")
    batch = model.embed_batch(["a", "b", "c"])

    assert single.shape == (expected_dim,)
    assert batch.shape == (3, expected_dim)
    assert model.get_embedding_dimension() == expected_dim
    assert model.validate_embeddings(batch, expected_count=3)


@pytest.mark.skipif(not vdb_module.QDRANT_AVAILABLE, reason="qdrant-client chưa được cài đặt")
def test_vector_db_upsert_and_similarity_search(monkeypatch, tmp_path):
    monkeypatch.setattr(vdb_module, "VECTOR_DB_DIR", tmp_path / "vector_db")
    monkeypatch.setattr(vdb_module, "VERBOSE_LOGGING", False)

    manager = vdb_module.VectorDBManager(collection_name="pytest_similarity_collection", local_mode=True)
    manager.create_collection(vector_size=3, recreate=True)

    vectors = np.array(
        [
            [1.0, 0.0, 0.0],
            [0.0, 1.0, 0.0],
            [0.8, 0.2, 0.0],
        ],
        dtype=np.float32,
    )
    payloads = [
        {"content": "document A", "metadata": {"doc_id": "A"}},
        {"content": "document B", "metadata": {"doc_id": "B"}},
        {"content": "document C", "metadata": {"doc_id": "C"}},
    ]
    ids = [101, 102, 103]

    upserted = manager.upsert_vectors(vectors=vectors, payloads=payloads, ids=ids)
    results = manager.search_vectors(query_vector=np.array([1.0, 0.0, 0.0], dtype=np.float32), limit=2)

    assert upserted == 3
    assert len(results) == 2
    assert results[0]["metadata"]["doc_id"] == "A"
    assert results[0]["score"] >= results[1]["score"]

    manager.delete_collection()


def test_rag_pipeline_e2e_with_mocked_llm_and_retriever():
    class FakeDoc:
        def __init__(self, page_content, metadata):
            self.page_content = page_content
            self.metadata = metadata

    class FakeRetriever:
        def __init__(self):
            self.calls = []

        def retrieve_documents(self, query, k=3, filter_conditions=None):
            self.calls.append((query, k))
            return [
                FakeDoc(
                    "Nội dung luật về hợp đồng lao động.",
                    {
                        "document_name": "Bộ luật Lao động",
                        "article": "13",
                        "clause": "1",
                        "chunk_id": "chunk-13-1",
                        "article_number": "13",
                        "title": "Bộ luật Lao động",
                        "is_verified": True,
                    },
                ),
                FakeDoc(
                    "Nội dung có [ĐỐI CHIẾU] cần rà soát.",
                    {
                        "document_name": "Nghị định hướng dẫn",
                        "article": "2",
                        "clause": "3",
                        "chunk_id": "chunk-2-3",
                        "article_number": "2",
                        "title": "Nghị định hướng dẫn",
                        "is_verified": False,
                    },
                ),
            ]

    class FakeConfig:
        def get_llm(self):
            return RunnableLambda(lambda prompt_text: "Đây là câu trả lời mock từ LLM.")

    retriever = FakeRetriever()
    pipeline = RAGPipeline(config=FakeConfig(), retriever_service=retriever)

    result = pipeline.query("Hợp đồng lao động gồm nội dung gì?")

    assert "mock" in result["answer"].lower()
    assert result["num_sources"] == 2
    assert result["has_warning"] is True
    assert len(retriever.calls) == 1
    assert result["sources"][0]["document"] == "Bộ luật Lao động"
    assert result["sources"][0]["article"] == "13"


def test_rag_pipeline_returns_no_context_message_without_documents():
    class EmptyRetriever:
        def retrieve_documents(self, query, k=3, filter_conditions=None):
            return []

    class UnusedConfig:
        def get_llm(self):
            return RunnableLambda(
                lambda _: (_ for _ in ()).throw(
                    AssertionError("LLM không được gọi khi không có tài liệu")
                )
            )

    pipeline = RAGPipeline(config=UnusedConfig(), retriever_service=EmptyRetriever())
    result = pipeline.query("câu hỏi không có dữ liệu")

    assert result["num_sources"] == 0
    assert "không chứa thông tin" in result["answer"]


def test_rag_pipeline_handles_llm_timeout_error():
    class FakeRetriever:
        def retrieve_documents(self, query, k=3, filter_conditions=None):
            return [type("Doc", (), {"page_content": "context", "metadata": {}})()]

    class TimeoutConfig:
        def get_llm(self):
            def _raise_timeout(_):
                raise TimeoutError("LLM timeout")

            return RunnableLambda(_raise_timeout)

    pipeline = RAGPipeline(config=TimeoutConfig(), retriever_service=FakeRetriever())
    result = pipeline.query("hợp đồng lao động timeout")

    assert "Lỗi hệ thống" in result["answer"]
    assert "LLM timeout" in result["answer"]
    assert result["sources"] == []


def test_api_requires_api_key(monkeypatch):
    monkeypatch.setenv("LEGALAI_API_KEY", "test-secret")
    client = TestClient(api_module.app)

    response = client.post("/api/chat", json={"question": "test"})

    assert response.status_code == 401


def test_api_authenticates_and_rate_limits(monkeypatch):
    monkeypatch.setenv("LEGALAI_API_KEY", "test-secret")
    monkeypatch.setattr(api_module, "RATE_LIMIT", 1)
    monkeypatch.setattr(api_module, "RATE_WINDOW_SECONDS", 60)
    api_module._requests.clear()

    class FakePipeline:
        def query(self, question):
            return {
                "question": question,
                "answer": "mock answer",
                "sources": [],
                "has_warning": False,
                "num_sources": 0,
            }

    api_module.get_pipeline.cache_clear()
    api_module.get_pipeline = lambda: FakePipeline()
    client = TestClient(api_module.app)
    headers = {"X-API-Key": "test-secret"}

    first = client.post("/api/chat", json={"question": "test"}, headers=headers)
    second = client.post("/api/chat", json={"question": "test"}, headers=headers)

    assert first.status_code == 200
    assert second.status_code == 429
