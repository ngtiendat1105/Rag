"""Build the JSONL knowledge base from Markdown files and optionally re-index Qdrant."""

import argparse
import json
import logging
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict, Iterable, List

from config import OUTPUT_FILE, get_input_files
from document_loader import load_document
from markdown_chunker import create_markdown_chunker
from metadata_utils import normalize_metadata

logger = logging.getLogger("sync_documents")


def _document_metadata(path: Path, metadata: Dict[str, Any]) -> Dict[str, Any]:
    fallback_title = path.stem.replace("_", " ")
    normalized = normalize_metadata(
        {
            **metadata,
            "title": metadata.get("title", fallback_title),
            "document_name": metadata.get("document_name", metadata.get("title", fallback_title)),
            "domain": metadata.get("domain", "Pháp luật và quy định nội bộ"),
            "status": metadata.get("status", "Tham khảo nội bộ"),
            "is_verified": metadata.get("is_verified", False),
            "weight": metadata.get("weight", 0.5),
        },
        chunk_id=path.stem,
    )
    normalized["source_file"] = path.name
    return normalized


def build_knowledge_base(input_files: Iterable[Path] | None = None) -> tuple[int, List[str]]:
    """Parse Markdown files and atomically rebuild the JSONL knowledge base."""
    files = list(input_files or get_input_files())
    chunker = create_markdown_chunker()
    records: List[Dict[str, Any]] = []
    errors: List[str] = []

    for path in files:
        try:
            metadata, content = load_document(path)
            base_metadata = _document_metadata(path, metadata)
            chunks = chunker.create_chunks_with_metadata(content, base_metadata)
            for index, chunk in enumerate(chunks, 1):
                article_title = chunk["article_title"]
                chunk_id = f"{path.stem}_{index}"
                record_metadata = normalize_metadata(
                    {**base_metadata, **chunk["metadata"]},
                    chunk_id=chunk_id,
                    article_title=article_title,
                )
                records.append(
                    {
                        "chunk_id": chunk_id,
                        "article_title": article_title,
                        "content": f"{article_title}\n{chunk['content']}",
                        "metadata": record_metadata,
                        "analysis": chunk["analysis"],
                    }
                )
            logger.info("%s (%s): %d chunks", path.name, metadata.get("document_type", "document"), len(chunks))
        except Exception as exc:
            message = f"{path.name}: {exc}"
            errors.append(message)
            logger.exception("Cannot process %s", path)

    if not records:
        raise RuntimeError("Không tạo được chunk nào từ các tài liệu đầu vào.")

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    temporary_file = OUTPUT_FILE.with_suffix(".jsonl.tmp")
    with temporary_file.open("w", encoding="utf-8", newline="\n") as handle:
        for record in records:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")
    os.replace(temporary_file, OUTPUT_FILE)
    logger.info("Knowledge base updated: %d chunks -> %s", len(records), OUTPUT_FILE)
    return len(records), errors


def rebuild_index() -> None:
    """Recreate embeddings and Qdrant collection from the rebuilt JSONL."""
    command = [sys.executable, str(Path(__file__).with_name("main_phase2.py"))]
    subprocess.run(command, check=True)


def _snapshot(files: Iterable[Path]) -> Dict[str, int]:
    return {str(path): path.stat().st_mtime_ns for path in files if path.exists()}


def watch_documents(interval: float = 3.0, reindex: bool = True) -> None:
    """Watch supported documents and synchronize after a write settles."""
    previous = _snapshot(get_input_files())
    logger.info("Đang theo dõi %d tài liệu. Nhấn Ctrl+C để dừng.", len(previous))
    try:
        while True:
            time.sleep(interval)
            current_files = get_input_files()
            current = _snapshot(current_files)
            if current == previous:
                continue
            # Wait until a copy/upload has finished before reading it.
            time.sleep(max(1.0, interval))
            settled_files = _snapshot(get_input_files())
            if settled_files != current:
                continue
            try:
                count, errors = build_knowledge_base(current_files)
                if errors:
                    logger.warning("Có %d file lỗi: %s", len(errors), errors)
                if reindex and not errors:
                    rebuild_index()
                previous = _snapshot(get_input_files())
                logger.info("Đồng bộ hoàn tất: %d chunks.", count)
            except Exception:
                logger.exception("Đồng bộ thất bại; sẽ thử lại ở lần thay đổi tiếp theo.")
    except KeyboardInterrupt:
        logger.info("Đã dừng theo dõi tài liệu.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Đồng bộ tài liệu vào knowledge base và Qdrant")
    parser.add_argument("--watch", action="store_true", help="Theo dõi file mới/thay đổi và tự đồng bộ")
    parser.add_argument("--no-reindex", action="store_true", help="Chỉ tạo JSONL, không chạy lại Qdrant")
    parser.add_argument("--interval", type=float, default=3.0, help="Chu kỳ kiểm tra file, tính bằng giây")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
    if args.watch:
        watch_documents(args.interval, reindex=not args.no_reindex)
        return
    count, errors = build_knowledge_base()
    if errors:
        raise RuntimeError("Một số file không xử lý được: " + "; ".join(errors))
    if not args.no_reindex:
        rebuild_index()
    print(f"Đã đồng bộ {count} chunks.")


if __name__ == "__main__":
    main()
