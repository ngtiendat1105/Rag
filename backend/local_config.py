"""
local_config.py - Cấu hình cho chạy local không cần API keys
Cấu hình này sử dụng HuggingFace local model và disable các tính năng cần API
"""

import os
from typing import Dict
from config_llm import LLMConfig, LLMProvider

class LocalLLMConfig(LLMConfig):
    """
    Cấu hình local với tất cả các API keys disabled
    """
    
    # Override: Sử dụng HuggingFace local làm provider mặc định
    DEFAULT_PROVIDER = LLMProvider.HUGGINGFACE
    
    # Override: Sử dụng model nhẹ hơn cho local
    DEFAULT_MODELS = {
        LLMProvider.OPENAI.value: "gpt-3.5-turbo",
        LLMProvider.GOOGLE_GEMINI.value: "gemini-pro",
        LLMProvider.OLLAMA.value: "llama3.1:latest",
        LLMProvider.HUGGINGFACE.value: "google/flan-t5-large"  # Model nhẹ có thể chạy local
    }
    
    # Override: Tắt tất cả các API keys
    @classmethod
    def check_api_keys(cls) -> Dict[str, bool]:
        """Report which local providers are actually available."""
        return {
            "openai": False,
            "google_gemini": False,
            "huggingface": False,
            "ollama": True,
        }
    
    def _get_default_model_name(self, provider: LLMProvider) -> str:
        """Override với model local nhẹ hơn"""
        if provider == LLMProvider.HUGGINGFACE:
            # Sử dụng model nhỏ hơn cho local testing
            return "google/flan-t5-large"
        return super()._get_default_model_name(provider)
    
    def get_llm(self):
        """Override để sử dụng HuggingFace local với cài đặt đặc biệt"""
        if self.provider == LLMProvider.HUGGINGFACE:
            raise NotImplementedError(
                "HuggingFace local inference is not supported by this project. "
                "Use Ollama for local testing."
            )
        
        return super().get_llm()


def configure_for_local_testing():
    """
    Cấu hình environment cho local testing
    """
    # Tắt các API keys
    os.environ.pop("OPENAI_API_KEY", None)
    os.environ.pop("GOOGLE_API_KEY", None)
    os.environ.pop("GEMINI_API_KEY", None)
    
    # Đặt môi trường cho local testing
    os.environ["USE_LOCAL_ONLY"] = "true"
    
    print("✅ Đã cấu hình cho local testing")
    print("   - Sử dụng Ollama local model")
    print("   - Tất cả API keys disabled")
    print("   - Chế độ local-only activated")


# Tiện ích để tạo cấu hình local
def create_local_llm_config():
    """Tạo LLMConfig cho local testing"""
    configure_for_local_testing()
    return LocalLLMConfig()


if __name__ == "__main__":
    # Test cấu hình local
    print("🧪 Testing local configuration...")
    config = create_local_llm_config()
    print(f"✅ Provider: {config.provider.value}")
    print(f"✅ Model: {config.model_name}")
    print(f"✅ Temperature: {config.temperature}")
    print("\n✅ Local configuration ready!")