from pathlib import Path

from document_loader import load_document
from markdown_chunker import create_markdown_chunker


def test_labor_law_article_keeps_its_legal_content():
    source = Path(__file__).resolve().parents[2] / "data_documents" / "01_Bo_luat_Lao_dong_2019.md"
    metadata, content = load_document(source)
    chunks = create_markdown_chunker().create_chunks_with_metadata(content, metadata)
    article = next(chunk for chunk in chunks if "Điều 25." in chunk["article_title"])

    assert "180 ngày" in article["content"]
    assert "60 ngày" in article["content"]
    assert "30 ngày" in article["content"]
    assert "06 ngày làm việc" in article["content"]


def test_health_endpoint_is_available_without_loading_the_model():
    from api import health_check

    assert health_check() == {"status": "ok", "service": "legalai-rag"}


def test_question_scope_distinguishes_legal_and_unrelated_topics():
    from query_understanding import is_supported_question

    assert is_supported_question("Thời gian thử việc tối đa là bao lâu?")
    assert is_supported_question("Tôi được nghỉ bao nhiêu ngày trong năm?")
    assert not is_supported_question("Thời tiết hôm nay như thế nào?")
    assert not is_supported_question("Hãy viết cho tôi một bài thơ về mùa thu")
