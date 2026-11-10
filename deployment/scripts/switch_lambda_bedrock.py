"""Deploy a tested image and Bedrock settings while preserving other Lambda env.

Does not write credentials to disk or print them. Uses RevisionId to reject
concurrent updates. Existing published versions remain available for rollback.
"""
import argparse
import json

import boto3
from botocore.config import Config


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image-uri", required=True)
    parser.add_argument("--function", default="legalai-rag")
    parser.add_argument("--region", default="us-east-1")
    args = parser.parse_args()
    client = boto3.client("lambda", region_name=args.region, config=Config(
        retries={"mode": "standard", "total_max_attempts": 1}, read_timeout=90,
    ))
    previous = client.get_function(FunctionName=args.function)
    original_env = previous["Configuration"].get("Environment", {}).get("Variables", {})
    variables = {**original_env, "RAG_LLM_PROVIDER": "bedrock",
        "RAG_LLM_MODEL": "us.amazon.nova-lite-v1:0", "BEDROCK_REGION": args.region,
        "LLM_REQUEST_TIMEOUT_SECONDS": "18", "LLM_MAX_RETRIES": "0"}
    variables.pop("GOOGLE_API_KEY", None)
    client.update_function_code(FunctionName=args.function, ImageUri=args.image_uri,
        RevisionId=previous["Configuration"]["RevisionId"], Publish=False)
    client.get_waiter("function_updated_v2").wait(FunctionName=args.function)
    config = client.get_function_configuration(FunctionName=args.function)
    if config.get("Environment", {}).get("Variables", {}) != original_env:
        raise RuntimeError("Lambda environment changed during deployment; refusing to overwrite it")
    client.update_function_configuration(FunctionName=args.function,
        RevisionId=config["RevisionId"], Environment={"Variables": variables})
    client.get_waiter("function_updated_v2").wait(FunctionName=args.function)
    config = client.get_function_configuration(FunctionName=args.function)
    version = client.publish_version(FunctionName=args.function,
        RevisionId=config["RevisionId"], CodeSha256=config["CodeSha256"])
    print(json.dumps({"function": args.function, "version": version["Version"],
        "provider": "bedrock", "model": variables["RAG_LLM_MODEL"],
        "previous_image": previous["Code"]["ResolvedImageUri"],
        "code_sha": version["CodeSha256"]}))


if __name__ == "__main__":
    main()
