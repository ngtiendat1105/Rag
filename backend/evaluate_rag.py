"""Deterministic RAG evaluation with optional answer judging.

The default evaluator does not call an external LLM. Faithfulness and
unsupported-claim metrics are conservative lexical proxies; pass an
``answer_fn`` that returns ``answer`` and ``context`` to evaluate generation.
"""

import argparse
import json
import re
from pathlib import Path
from typing import Any, Callable, Dict, Iterable, List

INSUFFICIENT_EVIDENCE = (
    "Hiện tại chưa đủ căn cứ pháp lý trong dữ liệu hệ thống để trả lời câu hỏi này"
)
DISCLAIMER = "Lưu ý: Thông tin do AI tổng hợp chỉ mang tính chất tham khảo."
STOPWORDS = {
    "là", "của", "và", "có", "cho", "theo", "trong", "những", "nào",
    "được", "phải", "với", "một", "các", "điều", "khoản", "về",
}


def _text(value: Any) -> str:
    return str(value or "").lower()


def _article(metadata: Dict[str, Any]) -> str:
    return str(metadata.get("article_number", metadata.get("article", "")))


def _citation_matches(metadata: Dict[str, Any], citation: Dict[str, Any]) -> bool:
    document = _text(citation.get("document"))
    title = _text(metadata.get("title", metadata.get("document_name")))
    return (
        (not document or document in title or title in document)
        and (not citation.get("article") or _article(metadata) == str(citation["article"]))
        and (
            not citation.get("clause")
            or str(metadata.get("clause_number", metadata.get("clause", "")))
            == str(citation["clause"])
        )
    )


def reciprocal_rank(results: List[Dict[str, Any]], expected_doc_id: str, expected_article: str) -> float:
    for index, result in enumerate(results, 1):
        metadata = result.get("metadata", {})
        if metadata.get("doc_id") == expected_doc_id and _article(metadata) == expected_article:
            return 1.0 / index
    return 0.0


def _claims(answer: str) -> List[str]:
    without_citations = re.sub(r"\[[^\]\n]{3,}\]", "", answer)
    return [
        part.strip()
        for part in re.split(r"[.!?]\s+|\n+", without_citations)
        if len(part.strip()) >= 8
    ]


def _claim_supported(claim: str, context: str) -> bool:
    terms = {
        term for term in re.findall(r"\w+", _text(claim))
        if len(term) > 3 and term not in STOPWORDS
    }
    context_terms = set(re.findall(r"\w+", _text(context)))
    return bool(terms) and len(terms & context_terms) / len(terms) >= 0.45


def _citation_tokens(answer: str) -> List[str]:
    return re.findall(r"\[[^\]\n]{3,}\]", answer)


def evaluate_results(
    cases: Iterable[Dict[str, Any]],
    search_fn: Callable[[str, int], Dict[str, Any]],
    top_k: int = 5,
    answer_fn: Callable[[Dict[str, Any], List[Dict[str, Any]]], Dict[str, Any]] | None = None,
) -> Dict[str, float]:
    cases = list(cases)
    recall_hits = 0
    recall_total = 0
    mrr_total = 0.0
    citation_hits = 0
    faithfulness_scores: List[float] = []
    relevance_scores: List[float] = []
    unsupported_scores: List[float] = []
    refusal_hits = 0

    for case in cases:
        response = search_fn(case["question"], top_k) or {}
        results = response.get("results", [])[:top_k]
        expected = (
            case["relevant_documents"]
            if "relevant_documents" in case
            else [{
                "doc_id": case.get("expected_doc_id", ""),
                "article": str(case.get("expected_article", "")),
            }]
        )
        found = sum(
            any(
                result.get("metadata", {}).get("doc_id") == item.get("doc_id")
                and (not item.get("article") or _article(result.get("metadata", {})) == str(item["article"]))
                for result in results
            )
            for item in expected
        )
        recall_hits += found
        recall_total += len(expected)
        if expected:
            first = expected[0]
            mrr_total += reciprocal_rank(results, first.get("doc_id", ""), str(first.get("article", "")))

        expected_citations = case.get("expected_citations") or (
            [case["expected_citation"]] if case.get("expected_citation") else []
        )
        citation_hits += int(
            bool(expected_citations)
            and all(any(_citation_matches(r.get("metadata", {}), c) for r in results) for c in expected_citations)
        )

        if answer_fn:
            generated = answer_fn(case, results) or {}
            answer = str(generated.get("answer", ""))
            context = str(generated.get("context", "")) or "\n".join(
                str(r.get("content", r.get("page_content", ""))) for r in results
            )
            claims = _claims(answer)
            supported = sum(_claim_supported(claim, context) for claim in claims)
            faithfulness_scores.append(supported / len(claims) if claims else 0.0)
            relevance_terms = {
                t for t in re.findall(r"\w+", _text(case["question"]))
                if len(t) > 3 and t not in STOPWORDS
            }
            answer_terms = set(re.findall(r"\w+", _text(answer)))
            relevance_scores.append(
                len(relevance_terms & answer_terms) / len(relevance_terms)
                if relevance_terms else 0.0
            )
            unsupported_scores.append(
                1.0 - (supported / len(claims) if claims else 0.0)
            )
            if case.get("expect_refusal"):
                refusal_hits += int(INSUFFICIENT_EVIDENCE in answer)

    count = len(cases) or 1
    return {
        "retrieval_recall": recall_hits / recall_total if recall_total else 0.0,
        f"recall_at_{top_k}": recall_hits / count,
        "mrr": mrr_total / count,
        "citation_accuracy": citation_hits / count,
        "answer_faithfulness": sum(faithfulness_scores) / len(faithfulness_scores) if faithfulness_scores else 0.0,
        "answer_relevance": sum(relevance_scores) / len(relevance_scores) if relevance_scores else 0.0,
        "unsupported_claim_rate": sum(unsupported_scores) / len(unsupported_scores) if unsupported_scores else 0.0,
        "refusal_accuracy": refusal_hits / sum(bool(c.get("expect_refusal")) for c in cases) if any(c.get("expect_refusal") for c in cases) else 0.0,
        "cases": float(len(cases)),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate retrieval and generation guardrails")
    default_dataset = Path(__file__).parent / "evaluation" / "evaluation_dataset.json"
    parser.add_argument("--dataset", default=str(default_dataset))
    parser.add_argument("--top-k", type=int, default=5)
    args = parser.parse_args()
    from retriever_demo import create_legal_retriever
    dataset = json.loads(Path(args.dataset).read_text(encoding="utf-8"))
    retriever = create_legal_retriever()
    metrics = evaluate_results(
        dataset,
        lambda question, k: retriever.search_legal_context(question, limit=k),
        top_k=args.top_k,
    )
    print(json.dumps(metrics, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
