import argparse
import json
from pathlib import Path
from typing import Any, Dict, Iterable, List


def reciprocal_rank(results: List[Dict[str, Any]], expected_doc_id: str, expected_article: str) -> float:
    for index, result in enumerate(results, 1):
        metadata = result.get("metadata", {})
        if (
            metadata.get("doc_id") == expected_doc_id
            and str(metadata.get("article_number", metadata.get("article", ""))) == expected_article
        ):
            return 1.0 / index
    return 0.0


def evaluate_results(
    cases: Iterable[Dict[str, Any]],
    search_fn,
    top_k: int = 5,
) -> Dict[str, float]:
    cases = list(cases)
    recall_hits = 0
    mrr_total = 0.0
    citation_hits = 0

    for case in cases:
        response = search_fn(case["question"], top_k)
        results = response.get("results", [])[:top_k]
        expected_doc_id = case["expected_doc_id"]
        expected_article = str(case["expected_article"])
        hit = any(
            result.get("metadata", {}).get("doc_id") == expected_doc_id
            and str(
                result.get("metadata", {}).get(
                    "article_number",
                    result.get("metadata", {}).get("article", ""),
                )
            ) == expected_article
            for result in results
        )
        recall_hits += int(hit)
        mrr_total += reciprocal_rank(results, expected_doc_id, expected_article)

        citation = case.get("expected_citation", {})
        citation_hits += int(
            any(
                result.get("metadata", {}).get("title") == citation.get("document")
                and str(
                    result.get("metadata", {}).get(
                        "article_number",
                        result.get("metadata", {}).get("article", ""),
                    )
                ) == str(citation.get("article"))
                for result in results
            )
        )

    count = len(cases) or 1
    return {
        f"recall_at_{top_k}": recall_hits / count,
        "mrr": mrr_total / count,
        "citation_accuracy": citation_hits / count,
        "cases": float(len(cases)),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate RAG retrieval metrics")
    parser.add_argument("--dataset", default="evaluation_dataset.json")
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
