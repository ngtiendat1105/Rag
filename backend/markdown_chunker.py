"""Structure-aware chunking for Vietnamese legal Markdown documents.

The chunker treats an article and its clauses as the primary legal units.
Chunk size is a target, not a hard truncation limit: a clause is never cut
just to satisfy a character limit.
"""

import re
from typing import Any, Dict, List, Optional

from config import MAX_CHUNK_SIZE


HEADING_RE = re.compile(r"^(#{1,6})[ \t]+(.+?)\s*$")
ARTICLE_RE = re.compile(
    r"^(?:Điều|ĐIỀU)\s+([0-9]+[A-Za-zÀ-ỹ]?)\s*[.:–-]?\s*(.*)$",
    re.IGNORECASE,
)
CLAUSE_RE = re.compile(
    r"^(?:\*\*)?\s*(?:Khoản|KHOẢN)\s*([0-9]+)\s*(?:\*\*)?\s*[:.)-]?\s*(.*)$",
    re.IGNORECASE,
)
POINT_RE = re.compile(
    r"^(?:[*+-]\s*)?(?:Điểm|ĐIỂM)\s+([a-zđ])\s*[:.)-]?\s*(.*)$",
    re.IGNORECASE,
)
NUMBERED_CLAUSE_RE = re.compile(r"^([0-9]+)[.)]\s+(.+)$")
DATE_RE = re.compile(r"\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b")
FRONTMATTER_RE = re.compile(
    r"^\s*\\?---\s*\n(.*?)\n\\?---\s*\n?",
    re.DOTALL,
)


class MarkdownChunker:
    """Split Markdown while preserving legal hierarchy and parent headings."""

    def __init__(
        self,
        *,
        max_chunk_size: int = MAX_CHUNK_SIZE,
        overlap_ratio: float = 0.15,
        priority_internal: int = 2,
        priority_legal: int = 1,
    ):
        if max_chunk_size <= 0:
            raise ValueError("max_chunk_size must be positive")
        if not 0 <= overlap_ratio <= 0.5:
            raise ValueError("overlap_ratio must be between 0 and 0.5")
        self.max_chunk_size = max_chunk_size
        self.overlap_ratio = overlap_ratio
        self.priority_internal = priority_internal
        self.priority_legal = priority_legal

    def split_into_articles(self, markdown_content: str) -> List[Dict[str, Any]]:
        """Parse articles and retain the heading hierarchy above each article."""
        lines = markdown_content.replace("\r\n", "\n").splitlines()
        articles: List[Dict[str, Any]] = []
        parents: List[str] = []
        current: Optional[Dict[str, Any]] = None

        def flush() -> None:
            nonlocal current
            if current is not None and "\n".join(current["content"]).strip():
                current["content"] = "\n".join(current["content"]).strip()
                current["context_headings"] = list(current["context_headings"])
                current["raw_text"] = (
                    f"{current['article_title']}\n{current['content']}"
                )
                articles.append(current)
            current = None

        for line in lines:
            heading = HEADING_RE.match(line.strip())
            heading_text = heading.group(2).strip() if heading else ""
            article_match = ARTICLE_RE.match(heading_text) if heading else None

            if (
                heading
                and not article_match
                and len(heading.group(1)) in (2, 3)
                and (current is None or len(heading.group(1)) in (2, 3))
            ):
                flush()
                current = {
                    "article_title": line.strip(),
                    "article_number": "",
                    "article_name": heading_text,
                    "content": [],
                    "context_headings": list(parents),
                }
                continue

            if heading and not article_match:
                level = len(heading.group(1))
                parents = parents[: level - 1]
                parents.append(line.strip())
                if current is not None:
                    current["content"].append(line)
                continue

            if article_match:
                flush()
                number, name = article_match.groups()
                title = line.strip()
                current = {
                    "article_title": title,
                    "article_number": number,
                    "article_name": name.strip(),
                    "content": [],
                    "context_headings": list(parents),
                }
                continue

            if current is not None:
                current["content"].append(line)

        flush()
        return articles

    def _split_units(self, content: str) -> List[str]:
        """Return complete clause/point units, never truncating their text."""
        lines = content.splitlines()
        starts: List[int] = []
        for index, line in enumerate(lines):
            stripped = line.strip()
            if CLAUSE_RE.match(stripped) or NUMBERED_CLAUSE_RE.match(stripped):
                starts.append(index)

        if not starts:
            return [content.strip()] if content.strip() else []

        units: List[str] = []
        for index, start in enumerate(starts):
            end = starts[index + 1] if index + 1 < len(starts) else len(lines)
            unit = "\n".join(lines[start:end]).strip()
            if unit:
                units.append(unit)
        return units

    def _group_units(self, units: List[str]) -> List[str]:
        """Group whole clauses near the target size with semantic overlap."""
        if not units:
            return []
        groups: List[str] = []
        current: List[str] = []
        current_size = 0
        for unit in units:
            unit_size = len(unit)
            if current and current_size + unit_size + 2 > self.max_chunk_size:
                groups.append("\n\n".join(current))
                overlap_size = max(1, int(self.max_chunk_size * self.overlap_ratio))
                carry: List[str] = []
                carried = 0
                for previous in reversed(current):
                    if carry and carried + len(previous) + 2 > overlap_size:
                        break
                    carry.insert(0, previous)
                    carried += len(previous) + 2
                current = carry
                current_size = sum(len(item) + 2 for item in current)
            current.append(unit)
            current_size += unit_size + 2
        if current:
            groups.append("\n\n".join(current))
        return groups

    def _context_prefix(self, headings: List[str], article_title: str) -> str:
        context = headings + [article_title]
        return "Ngữ cảnh: " + " -> ".join(context)

    def _document_fields(self, base: Dict[str, Any]) -> Dict[str, Any]:
        title = base.get("document_title") or base.get("title") or base.get(
            "document_name", ""
        )
        document_type = base.get("type") or base.get("document_type") or "Khác"
        status = str(base.get("status", "")).strip().lower()
        is_active = base.get("is_active")
        if is_active is None:
            is_active = not any(
                marker in status for marker in ("hết hiệu lực", "bãi bỏ", "đã hết")
            )
        effective_date = str(base.get("effective_date", "") or "")
        date_match = DATE_RE.search(effective_date)
        if date_match:
            effective_date = (
                f"{date_match.group(1)}-{int(date_match.group(2)):02d}-"
                f"{int(date_match.group(3)):02d}"
            )
        priority = base.get("priority")
        if priority is None:
            priority = (
                self.priority_internal
                if any(word in str(document_type).lower() for word in ("nội bộ", "quy định", "quy chế"))
                else self.priority_legal
            )
        return {
            **base,
            "document_title": title,
            "document_type": document_type,
            "effective_date": effective_date,
            "is_active": bool(is_active),
            "priority": int(priority),
        }

    def _strip_frontmatter(
        self, markdown_content: str, base_metadata: Dict[str, Any]
    ) -> tuple[str, Dict[str, Any]]:
        match = FRONTMATTER_RE.match(markdown_content)
        if not match:
            return markdown_content, dict(base_metadata)
        parsed: Dict[str, Any] = {}
        try:
            import yaml
            from yaml import YAMLError

            parsed = dict(yaml.safe_load(match.group(1)) or {})
        except (ImportError, TypeError, ValueError, YAMLError):
            for line in match.group(1).splitlines():
                key, separator, value = line.partition(":")
                if separator:
                    normalized_key = key.strip().replace("\\_", "_")
                    parsed[normalized_key] = value.strip().strip("\"'")
        merged = {**parsed, **base_metadata}
        return markdown_content[match.end():], merged

    def create_chunks_with_metadata(
        self, markdown_content: str, base_metadata: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        chunks: List[Dict[str, Any]] = []
        markdown_content, parsed_metadata = self._strip_frontmatter(
            markdown_content, base_metadata
        )
        inferred_metadata = dict(parsed_metadata)
        if not inferred_metadata.get("document_title"):
            title_match = re.search(r"^#(?!#)\s+(.+?)\s*$", markdown_content, re.MULTILINE)
            if title_match:
                inferred_metadata["document_title"] = title_match.group(1).strip()
        document_fields = self._document_fields(inferred_metadata)

        for article in self.split_into_articles(markdown_content):
            units = self._split_units(article["content"])
            grouped = self._group_units(units) if units else [article["content"]]
            if not grouped:
                continue
            for part_index, body in enumerate(grouped, 1):
                prefix = self._context_prefix(
                    article["context_headings"], article["article_title"]
                )
                content = f"{prefix}\n{body}".strip()
                clause_match = next(
                    (
                        CLAUSE_RE.match(line.strip())
                        for line in body.splitlines()
                        if CLAUSE_RE.match(line.strip())
                    ),
                    None,
                )
                clause_number = clause_match.group(1) if clause_match else ""
                metadata = {
                    **document_fields,
                    "article_title": article["article_title"],
                    "article_number": article["article_number"],
                    "article_section": article["article_title"],
                    "clause_number": clause_number,
                    "chunk_part": part_index,
                }
                chunk = {
                    "article_title": article["article_title"],
                    "content": content,
                    "raw_text": content,
                    "metadata": metadata,
                }
                chunk["analysis"] = self.analyze_chunk_structure(chunk)
                chunk["is_valid"] = self.validate_chunk_integrity(chunk)
                chunks.append(chunk)
        return chunks

    def validate_chunk_integrity(self, chunk: Dict[str, Any]) -> bool:
        title = chunk.get("article_title", "")
        content = chunk.get("content", "")
        return bool(title and content.strip() and not self._has_truncated_boundary(content))

    def _has_truncated_boundary(self, content: str) -> bool:
        """Detect an incomplete Markdown list/blockquote at the chunk end."""
        lines = [line.strip() for line in content.splitlines() if line.strip()]
        if not lines:
            return True
        return False

    def analyze_chunk_structure(self, chunk: Dict[str, Any]) -> Dict[str, Any]:
        content = chunk.get("content", "")
        lines = content.splitlines()
        return {
            "line_count": len(lines),
            "khoan_count": sum(bool(CLAUSE_RE.match(line.strip())) for line in lines),
            "diem_count": sum(bool(POINT_RE.match(line.strip())) for line in lines),
            "blockquote_lines": sum(line.strip().startswith(">") for line in lines),
            "char_count": len(content),
            "word_count": len(content.split()),
            "has_blockquote": any(line.strip().startswith(">") for line in lines),
        }


def create_markdown_chunker() -> MarkdownChunker:
    return MarkdownChunker()
