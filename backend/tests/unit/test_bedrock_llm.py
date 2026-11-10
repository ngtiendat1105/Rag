from types import SimpleNamespace

import pytest
from langchain_core.prompt_values import StringPromptValue
from langchain_core.output_parsers import StrOutputParser

from bedrock_llm import create_bedrock_llm
from config_llm import LLMConfig, LLMProvider
from settings import Settings


def adapter(client):
    return create_bedrock_llm(
        model_id="us.amazon.nova-lite-v1:0", region_name="us-east-1",
        max_tokens=700, temperature=0.0, request_timeout=25, client=client,
    )


@pytest.mark.unit
def test_bedrock_settings_and_config_use_role_credentials():
    configured = Settings(_env_file=None, rag_llm_provider="bedrock")
    assert configured.rag_llm_provider.value == "bedrock"
    assert configured.rag_llm_model == "us.amazon.nova-lite-v1:0"
    config = LLMConfig(provider=LLMProvider.BEDROCK)
    details = config.get_provider_config()
    assert details["credential_source"] == "aws_default_chain"
    assert details["requires_api_key"] is False
    assert "api_key" not in details
    assert config.model_name == "us.amazon.nova-lite-v1:0"


@pytest.mark.unit
def test_converse_passes_model_and_inference_config_and_parses_only_text():
    captured = []

    def converse(**kwargs):
        captured.append(kwargs)
        return {"output": {"message": {"content": [
            {"text": "Quy định"}, {"reasoningContent": {"text": "internal"}},
            {"text": "pháp luật"},
        ]}}, "stopReason": "end_turn"}

    chain = adapter(SimpleNamespace(converse=converse)) | StrOutputParser()
    assert chain.invoke(StringPromptValue(text="Câu hỏi tiếng Việt")) == "Quy định\npháp luật"
    assert captured[0] == {
        "modelId": "us.amazon.nova-lite-v1:0",
        "messages": [{"role": "user", "content": [{"text": "Câu hỏi tiếng Việt"}]}],
        "inferenceConfig": {"maxTokens": 700, "temperature": 0.0},
    }


@pytest.mark.unit
@pytest.mark.parametrize("response", [
    {}, {"output": {"message": {"content": [{"text": " "}]}}},
    {"output": {"message": {"content": [{"toolUse": {}}]}}},
])
def test_empty_or_non_text_response_is_an_error(response):
    with pytest.raises(RuntimeError, match="không trả về"):
        adapter(SimpleNamespace(converse=lambda **_: response)).invoke("prompt")


@pytest.mark.unit
def test_filtered_response_is_not_reported_as_a_valid_answer():
    response = {"stopReason": "content_filtered", "output": {"message": {"content": [{"text": "blocked"}]}}}
    with pytest.raises(RuntimeError, match="đã chặn"):
        adapter(SimpleNamespace(converse=lambda **_: response)).invoke("prompt")


@pytest.mark.unit
def test_sdk_client_uses_region_bounded_timeout_and_default_credentials(monkeypatch):
    import boto3

    captured = {}

    def client(service, **kwargs):
        captured.update(service=service, **kwargs)
        return SimpleNamespace(converse=lambda **_: {})

    monkeypatch.setattr(boto3, "client", client)
    create_bedrock_llm(
        model_id="test-model", region_name="us-east-1", max_tokens=20,
        temperature=0, request_timeout=25,
    )
    assert captured["service"] == "bedrock-runtime"
    assert captured["region_name"] == "us-east-1"
    assert captured["config"].connect_timeout == 5
    assert captured["config"].read_timeout == 25
    assert captured["config"].retries["total_max_attempts"] == 1
    assert "aws_access_key_id" not in captured


@pytest.mark.unit
def test_model_access_error_is_preserved_for_server_logging():
    from botocore.exceptions import ClientError

    error = ClientError({"Error": {"Code": "AccessDeniedException", "Message": "Denied"}}, "Converse")

    def denied(**_kwargs):
        raise error

    with pytest.raises(ClientError) as result:
        adapter(SimpleNamespace(converse=denied)).invoke("prompt")
    assert result.value.response["Error"]["Code"] == "AccessDeniedException"
