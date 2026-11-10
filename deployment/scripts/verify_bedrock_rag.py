"""Run real RAG smoke checks without writing API keys or responses to disk.

Default: local pipeline. --lambda-function NAME: direct Lambda invocation.
--api-url URL: API Gateway request (cold-start timeout is reported explicitly).
Each legal query must return sources; an off-topic query must return none.
"""
import argparse
import json
import os
from pathlib import Path
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))

from dotenv import load_dotenv

QUESTIONS = ["Chế độ bảo hiểm xã hội", "Thời gian thử việc tối đa là bao lâu?", "Nấu phở như thế nào?"]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    target = parser.add_mutually_exclusive_group()
    target.add_argument("--lambda-function")
    target.add_argument("--api-url")
    parser.add_argument("--qualifier", default="$LATEST")
    args = parser.parse_args()
    load_dotenv(ROOT / ".env.local")
    pipeline = None
    if args.lambda_function:
        import boto3
        from botocore.config import Config
        client = boto3.client("lambda", region_name="us-east-1", config=Config(
            read_timeout=160, connect_timeout=10,
            retries={"mode": "standard", "total_max_attempts": 1},
        ))
    elif not args.api_url:
        from api import get_pipeline
        pipeline = get_pipeline()

    for index, question in enumerate(QUESTIONS):
        started = time.monotonic()
        if args.lambda_function:
            event = {
                "version": "2.0", "routeKey": "POST /api/chat",
                "rawPath": "/api/chat", "rawQueryString": "",
                "headers": {"content-type": "application/json", "x-api-key": os.environ["LEGALAI_API_KEY"]},
                "requestContext": {"http": {"method": "POST", "path": "/api/chat", "sourceIp": "127.0.0.1", "userAgent": "legalai-smoke-test"}},
                "body": json.dumps({"question": question}, ensure_ascii=False), "isBase64Encoded": False,
            }
            response = client.invoke(FunctionName=args.lambda_function, Qualifier=args.qualifier,
                                     Payload=json.dumps(event, ensure_ascii=False).encode("utf-8"))
            result = json.loads(response["Payload"].read())
            if response.get("FunctionError"):
                raise RuntimeError(f"Lambda failed: {result.get('errorType')}: {result.get('errorMessage')}")
            data = json.loads(result["body"])
            if result["statusCode"] != 200:
                raise RuntimeError(f"Lambda HTTP {result['statusCode']}: {data}")
        elif args.api_url:
            import httpx
            response = httpx.post(args.api_url.rstrip("/") + "/api/chat",
                json={"question": question}, headers={"X-API-Key": os.environ["LEGALAI_API_KEY"]}, timeout=150)
            response.raise_for_status()
            data = response.json()
        else:
            data = pipeline.query(question)
        if data.get("error") or not data.get("answer"):
            raise RuntimeError(f"Invalid RAG response: {data.get('error', 'empty answer')}")
        if index < 2 and data.get("num_sources", 0) < 1:
            raise RuntimeError("Legal smoke test returned no sources")
        if index == 2 and data.get("num_sources") != 0:
            raise RuntimeError("Off-topic smoke test must not retrieve sources")
        print(json.dumps({"check": index + 1, "seconds": round(time.monotonic() - started, 2),
            "sources": data["num_sources"], "answer_chars": len(data["answer"]), "status": "passed"}), flush=True)


if __name__ == "__main__":
    main()
