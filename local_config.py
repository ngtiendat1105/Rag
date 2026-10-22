"""
local_config.py - Cấu hình cho chạy local không cần API keys
Cấu hình này sử dụng HuggingFace local model và disable các tính năng cần API
"""

import os
from pathlib import Path
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
        """Kiểm tra API keys - luôn trả về True cho local"""
        return {
            "openai": True,  # Giả lập
            "google_gemini": True,  # Giả lập
            "huggingface": True,  # Local không cần API key
            "ollama": True  # Local không cần API key
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
            try:
                from langchain_huggingface import HuggingFacePipeline
                from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, pipeline
                
                print("🔄 Đang tải HuggingFace local model...")
                
                # Model nhẹ hơn cho local testing
                model_id = "google/flan-t5-base"  # Thậm chí nhẹ hơn
                tokenizer = AutoTokenizer.from_pretrained(model_id)
                model = AutoModelForSeq2SeqLM.from_pretrained(model_id)
                
                # Tạo pipeline
                pipe = pipeline(
                    "text2text-generation",
                    model=model,
                    tokenizer=tokenizer,
                    max_length=512,
                    temperature=self.temperature
                )
                
                llm = HuggingFacePipeline(pipeline=pipe)
                print(f"✅ HuggingFace local model đã tải: {model_id}")
                return llm
                
            except ImportError:
                print("⚠️  Không tìm thấy langchain_huggingface. Sử dụng fallback...")
                return super().get_llm()
        
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
    print("   - Sử dụng HuggingFace local model")
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