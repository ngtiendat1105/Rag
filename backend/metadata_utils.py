from typing import Any, Dict


def normalize_metadata(
    metadata: Dict[str, Any],
    *,
    chunk_id: str = "",
    article_title: str = "",
) -> Dict[str, Any]:
    """Return one stable metadata schema for indexing, retrieval, and citations."""
    source = dict(metadata or {})
    normalized = {
        "doc_id": source.get("doc_id", ""),
        "title": source.get("title", source.get("document_name", "")),
        "document_name": source.get("document_name", source.get("title", "")),
        "article_number": source.get("article_number", source.get("article", "")),
        "article": source.get("article", source.get("article_number", "")),
        "clause_number": source.get("clause_number", source.get("clause", "")),
        "clause": source.get("clause", source.get("clause_number", "")),
        "effective_date": source.get("effective_date", ""),
        "issued_date": source.get("issued_date", ""),
        "last_verified": source.get("last_verified", ""),
        "status": source.get("status", ""),
        "domain": source.get("domain", ""),
        "is_verified": bool(source.get("is_verified", True)),
        "weight": float(source.get("weight", 1.0)),
        "source_url": source.get("source_url", ""),
        "article_title": source.get("article_title", article_title),
        "chunk_id": source.get("chunk_id", chunk_id),
    }
    for key, value in source.items():
        normalized.setdefault(key, value)
    return normalized
