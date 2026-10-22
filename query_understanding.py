"""Deterministic Vietnamese legal-query understanding helpers."""

import re
import unicodedata
from typing import Any, Dict, List


TERM_EXPANSIONS = {
    "cty": "công ty doanh nghiệp",
    "dn": "doanh nghiệp",
    "người lao động": "nhân viên người làm công",
    "người sử dụng lao động": "doanh nghiệp công ty người thuê lao động",
    "lương": "tiền lương thu nhập tiền công",
    "thưởng": "tiền thưởng phúc lợi",
    "nghỉ phép": "nghỉ hằng năm nghỉ phép năm",
    "sa thải": "kỷ luật lao động chấm dứt hợp đồng",
    "hợp đồng điện tử": "giao dịch điện tử thông điệp dữ liệu",
    "chữ ký số": "chữ ký điện tử xác thực điện tử",
    "bảo mật": "an toàn thông tin bảo vệ dữ liệu",
    "kpi": "đánh giá hiệu suất chỉ số hiệu quả công việc",
    "bhxh": "bảo hiểm xã hội",
    "bhyt": "bảo hiểm y tế",
    "bhtn": "bảo hiểm thất nghiệp",
}

INTENT_EXPANSIONS = {
    "điều kiện": "yêu cầu tiêu chí trường hợp được hưởng",
    "quyền": "quyền lợi được phép",
    "nghĩa vụ": "trách nhiệm phải thực hiện",
    "mức": "tỷ lệ số tiền",
    "thời hạn": "thời gian bao lâu",
    "quy trình": "trình tự các bước thủ tục",
    "xử lý": "biện pháp kỷ luật giải quyết",
    "quy định": "nội dung điều khoản áp dụng",
}

DOCUMENT_ALIASES = {
    "luật doanh nghiệp": "Luật Doanh nghiệp 2020",
    "luật thương mại": "Luật Thương mại 2005",
    "giao dịch điện tử": "Luật Giao dịch điện tử 2023",
    "hợp đồng điện tử": "Luật Giao dịch điện tử 2023",
    "nội quy": "Nội quy Công ty",
    "quy chế lương": "Quy chế Lương Thưởng Phụ cấp",
    "kpi": "Quy trình Đánh giá KPI",
    "bảo mật thông tin": "Quy chế Bảo mật thông tin",
}

DOCUMENT_SOURCE_FILES = {
    "Luật Doanh nghiệp 2020": "05_Luat_Doanh_nghiep_2020.md",
    "Luật Thương mại 2005": "06_Luat_Thuong_mai_2005.md",
    "Luật Giao dịch điện tử 2023": "11_Luat_Giao_dich_dien_tu_2023.md",
    "Nội quy Công ty": "07_Noi_quy_cong_ty.md",
    "Quy chế Lương Thưởng Phụ cấp": "08_Quy_che_luong_thuong.md",
    "Quy trình Đánh giá KPI": "10_Quy_trinh_danh_gia_KPI.md",
    "Quy chế Bảo mật thông tin": "09_Quy_che_bao_mat_thong_tin.md",
}


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", unicodedata.normalize("NFC", text or "").strip().lower())


def fold_text(text: str) -> str:
    decomposed = unicodedata.normalize("NFD", text)
    return "".join(
        char for char in decomposed
        if unicodedata.category(char) != "Mn"
    ).replace("đ", "d")


def understand_query(query: str) -> Dict[str, Any]:
    """Extract legal structure and produce retrieval-friendly query variants."""
    original = re.sub(r"\s+", " ", (query or "").strip())
    normalized = _normalize(original)
    folded = fold_text(normalized)
    variants: List[str] = [original] if original else []

    expansions: List[str] = []
    for term, expansion in TERM_EXPANSIONS.items():
        if fold_text(term) in folded:
            expansions.append(expansion)
    for term, expansion in INTENT_EXPANSIONS.items():
        if fold_text(term) in folded:
            expansions.append(expansion)

    document_hints = [
        canonical
        for alias, canonical in DOCUMENT_ALIASES.items()
        if fold_text(alias) in folded
    ]
    article_match = re.search(r"\bdieu\s*(\d+[a-z]?(?:\s*[-–]\s*\d+)?)", folded)
    clause_match = re.search(r"\bkhoan\s*(\d+)", folded)

    if expansions or document_hints:
        variants.append(f"{original} {' '.join(expansions)} {' '.join(document_hints)}".strip())
    if document_hints:
        variants.append(f"{' '.join(document_hints)} {original}".strip())

    unique_variants = list(dict.fromkeys(v for v in variants if v))
    return {
        "original_query": original,
        "normalized_query": normalized,
        "query_variants": unique_variants,
        "document_hints": document_hints,
        "source_file_hints": [
            DOCUMENT_SOURCE_FILES[hint]
            for hint in document_hints
            if hint in DOCUMENT_SOURCE_FILES
        ],
        "article_number": article_match.group(1) if article_match else "",
        "clause_number": clause_match.group(1) if clause_match else "",
        "expansions": expansions,
    }
