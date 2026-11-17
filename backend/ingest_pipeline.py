"""Guarded document ingestion for the legal RAG staging index.

The command validates source files before chunking. It intentionally does not
write to production Qdrant: the generated JSONL and report are inputs to a
separate staging/index approval job.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import unicodedata
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Iterable

from document_loader import SUPPORTED_DOCUMENT_EXTENSIONS, load_document
from markdown_chunker import create_markdown_chunker


REQUIRED_METADATA = (
    "document_title",
    "effective_date",
    "document_type",
    "is_active",
)
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
MOJIBAKE_RE = re.compile(r"(?:Ã[\x80-\xbf]|â€|ï»¿|�)")
ALLOWED_EXTENSIONS = SUPPORTED_DOCUMENT_EXTENSIONS & {
    ".md", ".markdown", ".docx", ".pdf"
}


@dataclass
class IngestionResult:
    source: str
    status: str = "pending"
    content_hash: str | None = None
    chunks: int = 0
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def sha256_bytes(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def _metadata_value(metadata: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        value = metadata.get(key)
        if value not in (None, ""):
            return value
    return None


def normalize_ingestion_metadata(
    metadata: dict[str, Any], source: Path
) -> dict[str, Any]:
    result = {
        str(key).replace("\\_", "_"): value
        for key, value in metadata.items()
    }
    result["document_title"] = _metadata_value(
        metadata, "document_title", "title", "document_name"
    )
    result["effective_date"] = _metadata_value(metadata, "effective_date")
    result["document_type"] = _metadata_value(
        metadata, "document_type", "type"
    )
    active = _metadata_value(result, "is_active")
    if active is None:
        status = str(_metadata_value(result, "status") or "").strip().lower()
        if status:
            active = status not in {"hết hiệu lực", "bãi bỏ", "inactive", "expired"}
    if isinstance(active, str):
        lowered = active.strip().lower()
        if lowered in {"true", "1", "yes", "active", "còn hiệu lực"}:
            active = True
        elif lowered in {"false", "0", "no", "inactive", "hết hiệu lực"}:
            active = False
    result["is_active"] = active
    result["source_file"] = source.name
    return result


def validate_metadata(metadata: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for key in REQUIRED_METADATA:
        if metadata.get(key) in (None, ""):
            errors.append(f"Thiếu metadata bắt buộc: {key}")
    date_value = metadata.get("effective_date")
    if date_value and (
        not isinstance(date_value, str) or not DATE_RE.fullmatch(date_value)
    ):
        errors.append("effective_date phải có định dạng YYYY-MM-DD")
    if metadata.get("is_active") not in (True, False):
        errors.append("is_active phải là boolean true/false")
    return errors


def inspect_text_quality(text: str) -> list[str]:
    warnings: list[str] = []
    if not text.strip():
        return ["Nội dung rỗng sau khi đọc/OCR"]
    if "\ufffd" in text:
        warnings.append("Có ký tự thay thế Unicode (U+FFFD), nghi lỗi OCR/font")
    if MOJIBAKE_RE.search(text):
        warnings.append("Có mẫu mojibake, cần kiểm tra lỗi mã hóa/OCR")
    control_count = sum(
        1 for char in text if unicodedata.category(char) == "Cc" and char not in "\n\r\t"
    )
    if control_count:
        warnings.append(f"Có {control_count} ký tự điều khiển trong nội dung")
    non_whitespace = [char for char in text if not char.isspace()]
    if non_whitespace:
        replacement_ratio = text.count("\ufffd") / len(non_whitespace)
        if replacement_ratio > 0.005:
            warnings.append("Tỷ lệ ký tự lỗi vượt ngưỡng 0.5%")
    return warnings


def ingest_files(
    files: Iterable[Path],
    output_path: Path,
    report_path: Path,
    *,
    reject_ocr_warnings: bool = False,
) -> list[IngestionResult]:
    seen_hashes: dict[str, str] = {}
    chunker = create_markdown_chunker()
    records: list[dict[str, Any]] = []
    results: list[IngestionResult] = []

    for path in sorted(files, key=lambda item: item.name.lower()):
        result = IngestionResult(source=str(path))
        results.append(result)
        if not path.is_file():
            result.status = "rejected"
            result.errors.append("Không phải file")
            continue
        if path.suffix.lower() not in ALLOWED_EXTENSIONS:
            result.status = "rejected"
            result.errors.append(f"Định dạng không được phép: {path.suffix}")
            continue
        try:
            result.content_hash = sha256_bytes(path)
            duplicate = seen_hashes.get(result.content_hash)
            if duplicate:
                result.status = "duplicate"
                result.errors.append(f"Trùng nội dung với {duplicate}")
                continue
            seen_hashes[result.content_hash] = path.name
            raw_metadata, content = load_document(path)
            metadata = normalize_ingestion_metadata(raw_metadata, path)
            result.errors.extend(validate_metadata(metadata))
            result.warnings.extend(inspect_text_quality(content))
            if reject_ocr_warnings and result.warnings:
                result.errors.append("Chặn tài liệu do cảnh báo chất lượng/OCR")
            if result.errors:
                result.status = "rejected"
                continue

            chunks = chunker.create_chunks_with_metadata(content, metadata)
            if not chunks:
                result.status = "rejected"
                result.errors.append("Không tạo được chunk")
                continue
            for index, chunk in enumerate(chunks, start=1):
                chunk_metadata = {
                    **metadata,
                    **chunk["metadata"],
                    "source_sha256": result.content_hash,
                    "ingestion_status": "staged",
                }
                records.append(
                    {
                        "chunk_id": f"{path.stem}_{index}",
                        "content": f"{chunk['article_title']}\n{chunk['content']}",
                        "metadata": chunk_metadata,
                        "analysis": chunk["analysis"],
                    }
                )
            result.status = "staged"
            result.chunks = len(chunks)
        except Exception as exc:
            result.status = "rejected"
            result.errors.append(str(exc))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="\n") as handle:
        for record in records:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(
        json.dumps(
            {
                "status": "staging_only",
                "total_files": len(results),
                "staged_files": sum(item.status == "staged" for item in results),
                "rejected_files": sum(item.status == "rejected" for item in results),
                "duplicate_files": sum(item.status == "duplicate" for item in results),
                "results": [asdict(item) for item in results],
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate and stage legal documents")
    parser.add_argument("input", type=Path, help="File or directory to ingest")
    parser.add_argument("--output", type=Path, default=Path("processed_output/staging.jsonl"))
    parser.add_argument("--report", type=Path, default=Path("processed_output/ingestion_report.json"))
    parser.add_argument("--reject-ocr-warnings", action="store_true")
    args = parser.parse_args()
    files = [args.input] if args.input.is_file() else list(args.input.rglob("*"))
    results = ingest_files(
        files,
        args.output,
        args.report,
        reject_ocr_warnings=args.reject_ocr_warnings,
    )
    print(json.dumps(
        {
            "staged": sum(item.status == "staged" for item in results),
            "rejected": sum(item.status == "rejected" for item in results),
            "duplicate": sum(item.status == "duplicate" for item in results),
            "output": str(args.output),
            "report": str(args.report),
        },
        ensure_ascii=False,
    ))
    if any(item.status == "rejected" for item in results):
        raise SystemExit(2)


if __name__ == "__main__":
    main()
