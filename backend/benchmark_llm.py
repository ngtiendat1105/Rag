"""Benchmark local Ollama models on the same legal RAG test set.

Examples:
    python backend/benchmark_llm.py
    python backend/benchmark_llm.py --models llama3.2:latest llama3.1:latest --pull

The script measures generation quality with deterministic lexical proxies and
Ollama timings. It does not send data to an external service.
"""

import argparse
import json
import os
import re
import subprocess
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

DEFAULT_MODELS = [
    "llama3.2:latest",
    "llama3.1:latest",
    "mistral:latest",
    "qwen2.5:7b",
    "vistral:7b",
]
FALLBACK = "Hiện tại chưa đủ căn cứ pháp lý trong dữ liệu hệ thống để trả lời câu hỏi này"
DISCLAIMER = "Lưu ý: Thông tin do AI tổng hợp chỉ mang tính chất tham khảo."
STOPWORDS = {"là", "của", "và", "có", "cho", "theo", "trong", "những", "nào", "được", "phải", "về"}


def _request(base_url: str, path: str, payload: Optional[Dict[str, Any]] = None) -> Any:
    data = None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        f"{base_url.rstrip('/')}{path}",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST" if data is not None else "GET",
    )
    with urllib.request.urlopen(request, timeout=180) as response:
        return json.loads(response.read().decode("utf-8"))


def installed_models(base_url: str) -> Dict[str, str]:
    data = _request(base_url, "/api/tags")
    return {item.get("name", ""): item.get("digest", "") for item in data.get("models", [])}


def pull_model(model: str) -> None:
    subprocess.run(["ollama", "pull", model], check=True)


def ollama_process_stats(base_url: str) -> Dict[str, Optional[int]]:
    try:
        data = _request(base_url, "/api/ps")
    except (urllib.error.URLError, TimeoutError):
        return {"ram_bytes": None, "vram_bytes": None}
    processes = data.get("models", [])
    return {
        "ram_bytes": sum(item.get("size", 0) or 0 for item in processes),
        "vram_bytes": sum(item.get("size_vram", 0) or 0 for item in processes),
    }


def retrieve_context(question: str, top_k: int) -> List[Dict[str, Any]]:
    """Load the existing retriever only once and reuse it for all models."""
    global _retriever
    if "_retriever" not in globals():
        import sys
        sys.path.insert(0, str(Path(__file__).parent))
        from dotenv import load_dotenv
        load_dotenv(Path(__file__).parents[1] / ".env.local", override=True)
        from retriever_service import LegalRetrieverService
        _retriever = LegalRetrieverService()
    return [
        {"content": doc.page_content, "metadata": doc.metadata}
        for doc in _retriever.retrieve_documents(question, k=top_k)
    ]


def build_prompt(question: str, documents: List[Dict[str, Any]]) -> str:
    context = "\n\n".join(
        f"[{i}] {doc['metadata'].get('title', doc['metadata'].get('document_name', ''))} "
        f"Điều {doc['metadata'].get('article_number', '')}\n{doc['content']}"
        for i, doc in enumerate(documents, 1)
    )
    return f"""Bạn là trợ lý tra cứu pháp lý. Chỉ dùng TÀI LIỆU dưới đây.
Nếu tài liệu không đủ, trả lời đúng: "{FALLBACK}".
Không suy đoán, không bịa số liệu/danh sách/Điều/Khoản. Mỗi khẳng định phải có
nguồn [Tên văn bản - Điều - Khoản]. Không lặp ý. Cuối câu trả lời thêm:
{DISCLAIMER}

CÂU HỎI: {question}

TÀI LIỆU:
{context}

TRẢ LỜI:"""


def generate(base_url: str, model: str, prompt: str, max_tokens: int) -> Dict[str, Any]:
    started = time.perf_counter()
    first_token_at: Optional[float] = None
    request = urllib.request.Request(
        f"{base_url.rstrip('/')}/api/generate",
        data=json.dumps({
            "model": model,
            "prompt": prompt,
            "stream": True,
            "options": {"temperature": 0, "num_predict": max_tokens},
        }, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    chunks: List[str] = []
    eval_count = 0
    eval_duration = 0
    with urllib.request.urlopen(request, timeout=300) as response:
        for line in response:
            item = json.loads(line.decode("utf-8"))
            if item.get("response") and first_token_at is None:
                first_token_at = time.perf_counter()
            chunks.append(item.get("response", ""))
            eval_count = item.get("eval_count", eval_count)
            eval_duration = item.get("eval_duration", eval_duration)
            if item.get("done"):
                break
    finished = time.perf_counter()
    duration = max(finished - started, 0.000001)
    return {
        "answer": "".join(chunks).strip(),
        "ttft_ms": round(((first_token_at or finished) - started) * 1000, 2),
        "total_latency_ms": round(duration * 1000, 2),
        "tokens_per_second": round(eval_count / (eval_duration / 1_000_000), 2) if eval_duration else round(eval_count / duration, 2),
        "eval_count": eval_count,
    }


def score_answer(case: Dict[str, Any], answer: str, context: str) -> Dict[str, float]:
    claims = [
        part.strip() for part in re.split(r"[.!?]\s+|\n+", re.sub(r"\[[^\]\n]+\]", "", answer))
        if len(part.strip()) >= 8
    ]
    context_terms = set(re.findall(r"\w+", context.lower()))
    supported = [
        bool(set(re.findall(r"\w+", claim.lower())) - STOPWORDS)
        and len((set(re.findall(r"\w+", claim.lower())) - STOPWORDS) & context_terms)
        / len(set(re.findall(r"\w+", claim.lower())) - STOPWORDS) >= 0.45
        for claim in claims
    ]
    question_terms = {
        term for term in re.findall(r"\w+", case["question"].lower())
        if len(term) > 3 and term not in STOPWORDS
    }
    answer_terms = set(re.findall(r"\w+", answer.lower()))
    expected = case.get("expected_citations", [])
    citation_text = answer.lower()
    citations = sum(
        int(str(item.get("document", "")).lower() in citation_text
            and (not item.get("article") or f"điều {item['article']}" in citation_text))
        for item in expected
    )
    refused = int(not expected and FALLBACK in answer)
    return {
        "answer_faithfulness": round(sum(supported) / len(supported), 4) if supported else (1.0 if refused else 0.0),
        "answer_relevance": round(len(question_terms & answer_terms) / len(question_terms), 4) if question_terms else 0.0,
        "citation_accuracy": round(citations / len(expected), 4) if expected else float(refused),
        "unsupported_claim_rate": round(1 - sum(supported) / len(supported), 4) if supported else (0.0 if refused else 1.0),
    }


def markdown_report(result: Dict[str, Any]) -> str:
    lines = ["# Local Ollama LLM Benchmark", "", f"Generated: `{result['generated_at']}`", ""]
    lines.append("| Model | Cases | Faithfulness | Relevance | Citation | Unsupported | TTFT ms | TPS | RAM MB | VRAM MB |")
    lines.append("|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|")
    for item in result["models"]:
        lines.append("| {model} | {cases} | {answer_faithfulness:.3f} | {answer_relevance:.3f} | {citation_accuracy:.3f} | {unsupported_claim_rate:.3f} | {ttft_ms:.0f} | {tokens_per_second:.2f} | {ram_mb} | {vram_mb} |".format(**item))
    lines += ["", "Metrics are local lexical proxies; review failed answers manually before production."]
    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description="Benchmark Ollama LLMs for Vietnamese legal RAG")
    parser.add_argument("--models", nargs="+", default=DEFAULT_MODELS)
    parser.add_argument("--dataset", default=str(Path(__file__).parent / "evaluation" / "evaluation_dataset.json"))
    parser.add_argument("--ollama-url", default=os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434"))
    parser.add_argument("--top-k", type=int, default=3)
    parser.add_argument("--max-tokens", type=int, default=700)
    parser.add_argument("--pull", action="store_true", help="Pull missing models before benchmarking")
    parser.add_argument("--output", default="llm_benchmark_results.json")
    parser.add_argument("--report", default="llm_benchmark_report.md")
    args = parser.parse_args()
    cases = json.loads(Path(args.dataset).read_text(encoding="utf-8"))
    available = installed_models(args.ollama_url)
    results: Dict[str, Any] = {"generated_at": datetime.now(timezone.utc).isoformat(), "models": [], "skipped": []}
    for model in args.models:
        if model not in available:
            if args.pull:
                pull_model(model)
                available = installed_models(args.ollama_url)
            if model not in available:
                results["skipped"].append({"model": model, "reason": "not installed; use --pull"})
                continue
        model_rows = []
        for case in cases:
            documents = retrieve_context(case["question"], args.top_k)
            context = "\n".join(doc["content"] for doc in documents)
            before = ollama_process_stats(args.ollama_url)
            generated = generate(args.ollama_url, model, build_prompt(case["question"], documents), args.max_tokens)
            after = ollama_process_stats(args.ollama_url)
            scores = score_answer(case, generated["answer"], context)
            model_rows.append({**generated, **scores, "question": case["question"], "ram_bytes": after["ram_bytes"] or before["ram_bytes"], "vram_bytes": after["vram_bytes"] or before["vram_bytes"]})
        numeric = [row for row in model_rows]
        aggregate = {"model": model, "cases": len(numeric), **{key: round(sum(row[key] for row in numeric) / len(numeric), 4) for key in ("answer_faithfulness", "answer_relevance", "citation_accuracy", "unsupported_claim_rate", "ttft_ms", "tokens_per_second")}, "ram_mb": round(max((row["ram_bytes"] or 0) for row in numeric) / 1_000_000, 1) if numeric else 0, "vram_mb": round(max((row["vram_bytes"] or 0) for row in numeric) / 1_000_000, 1) if numeric else 0, "cases_detail": numeric}
        results["models"].append(aggregate)
    Path(args.output).write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    Path(args.report).write_text(markdown_report(results), encoding="utf-8")
    print(json.dumps({k: results[k] for k in ("models", "skipped")}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
