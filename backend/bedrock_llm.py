"""Small Bedrock Converse adapter compatible with the existing LCEL chain."""

from typing import Any

from langchain_core.runnables import RunnableLambda


def create_bedrock_llm(
    *,
    model_id: str,
    region_name: str,
    max_tokens: int,
    temperature: float,
    request_timeout: float,
    client: Any = None,
) -> RunnableLambda:
    """Use the AWS default credential chain (Lambda execution role in production).

    Retry is owned by RAGPipeline; disabling SDK retries avoids multiplying the
    HTTP timeout by two separate retry loops. Creating a client does not invoke
    the model, so pipeline setup does not incur generation requests.
    """
    if client is None:
        import boto3
        from botocore.config import Config

        client = boto3.client(
            "bedrock-runtime",
            region_name=region_name,
            config=Config(
                connect_timeout=min(5.0, request_timeout),
                read_timeout=request_timeout,
                retries={"mode": "standard", "total_max_attempts": 1},
            ),
        )

    def invoke(prompt: Any) -> str:
        prompt_text = prompt if isinstance(prompt, str) else prompt.to_string()
        if not prompt_text.strip():
            raise ValueError("Bedrock prompt must not be empty")
        response = client.converse(
            modelId=model_id,
            messages=[{"role": "user", "content": [{"text": prompt_text}]}],
            inferenceConfig={"maxTokens": max_tokens, "temperature": temperature},
        )
        stop_reason = response.get("stopReason")
        if stop_reason in {"guardrail_intervened", "content_filtered"}:
            raise RuntimeError("Amazon Bedrock đã chặn nội dung phản hồi")
        blocks = response.get("output", {}).get("message", {}).get("content", [])
        answer = "\n".join(
            block["text"] for block in blocks
            if isinstance(block, dict) and isinstance(block.get("text"), str)
        ).strip()
        if not answer:
            raise RuntimeError("Amazon Bedrock không trả về nội dung văn bản")
        return answer

    return RunnableLambda(invoke)
