"""
config_llm.py - Cấu hình LLM cho hệ thống RAG pháp lý
Chứa tham số LLM, model selection, và cấu hình retrieval
"""

import os
from typing import Any
from pathlib import Path
from typing import Optional, Dict, Any
from enum import Enum

class LLMProvider(Enum):
    """Các nhà cung cấp LLM được hỗ trợ"""
    OPENAI = "openai"
    GOOGLE_GEMINI = "google_gemini"
    OLLAMA = "ollama"
    HUGGINGFACE = "huggingface"


class LLMConfig:
    """
    Class cấu hình LLM cho hệ thống RAG pháp lý
    """
    
    def __init__(self, provider: Optional[LLMProvider] = None, model_name: Optional[str] = None):
        """
        Khởi tạo cấu hình LLM
        
        Args:
            provider: Loại LLM provider (mặc định: DEFAULT_PROVIDER)
            model_name: Tên model cụ thể (mặc định: model của provider)
        """
        self.provider = provider or self.DEFAULT_PROVIDER
        self.model_name = model_name or self._get_default_model_name(self.provider)
        self.temperature = self.TEMPERATURE
        self.max_tokens = self.MAX_TOKENS
        self.top_k = self.TOP_K
    
    def _get_default_model_name(self, provider: LLMProvider) -> str:
        """Lấy tên model mặc định cho provider."""
        if provider == LLMProvider.OPENAI:
            return self.OPENAI_MODEL
        elif provider == LLMProvider.GOOGLE_GEMINI:
            return self.GEMINI_MODEL
        elif provider == LLMProvider.OLLAMA:
            return self.OLLAMA_MODEL
        elif provider == LLMProvider.HUGGINGFACE:
            return self.HUGGINGFACE_MODEL
        else:
            return "unknown"
    
    def get_llm(self):
        """Lấy LLM instance dựa trên cấu hình."""
        # HuggingFace models not supported in current setup
        # from langchain_huggingface import ChatHuggingFace
        
        if self.provider == LLMProvider.OPENAI:
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                model=self.model_name,
                temperature=self.temperature,
                max_tokens=self.max_tokens,
                api_key=self.OPENAI_API_KEY,
                timeout=self.REQUEST_TIMEOUT_SECONDS,
                max_retries=self.MAX_RETRIES,
            )
        elif self.provider == LLMProvider.GOOGLE_GEMINI:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(
                model=self.model_name,
                temperature=self.temperature,
                max_output_tokens=self.max_tokens,
                google_api_key=self.GOOGLE_API_KEY,
                timeout=self.REQUEST_TIMEOUT_SECONDS,
                max_retries=self.MAX_RETRIES,
            )
        elif self.provider == LLMProvider.OLLAMA:
            from langchain_ollama import ChatOllama
            return ChatOllama(
                model=self.model_name,
                temperature=self.temperature,
                base_url=self.OLLAMA_BASE_URL,
                num_ctx=int(os.getenv("OLLAMA_NUM_CTX", "4096")),
                num_predict=self.max_tokens,
                keep_alive=os.getenv("OLLAMA_KEEP_ALIVE", "30m"),
            )
        elif self.provider == LLMProvider.HUGGINGFACE:
            raise NotImplementedError("HuggingFace models are currently not supported. Please use OpenAI, Google Gemini, or Ollama instead.")
            # return ChatHuggingFace.from_model_id(
            #     model_id=self.model_name,
            #     task="text-generation",
            #     device=self.HUGGINGFACE_DEVICE
            # )
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")
    
    # ============ CẤU HÌNH CHUNG ============
    
    # Số lượng chunk tối đa cần lấy cho mỗi query
    TOP_K = int(os.getenv("RAG_TOP_K", "3"))
    
    # Temperature cho LLM (0 = chính xác nhất, phù hợp cho pháp lý)
    TEMPERATURE = 0.0
    
    # Max tokens cho response (đủ dài để trả lời chi tiết)
    MAX_TOKENS = int(os.getenv("RAG_MAX_OUTPUT_TOKENS", "700"))
    REQUEST_TIMEOUT_SECONDS = float(os.getenv("LLM_REQUEST_TIMEOUT_SECONDS", "120"))
    MAX_RETRIES = int(os.getenv("LLM_MAX_RETRIES", "2"))
    
    # ============ CẤU HÌNH PROVIDER MẶC ĐỊNH ============
    
    # Provider mặc định (có thể thay đổi bằng biến môi trường)
    DEFAULT_PROVIDER = LLMProvider.OPENAI
    
    # ============ CẤU HÌNH OPENAI ============
    
    # Model OpenAI (GPT-4 hoặc GPT-3.5)
    OPENAI_MODEL = "gpt-3.5-turbo"  # Hoặc "gpt-4-turbo-preview"
    
    # API key OpenAI (lấy từ biến môi trường)
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    
    # ============ CẤU HÌNH GOOGLE GEMINI ============
    
    # Model Gemini (các model tốt cho tiếng Việt)
    GEMINI_MODEL = "gemini-1.5-pro"  # Hoặc "gemini-1.5-flash"
    
    # API key Google AI (lấy từ biến môi trường)
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
    
    # ============ CẤU HÌNH OLLAMA ============
    
    # Model Ollama local (các model hỗ trợ tiếng Việt)
    OLLAMA_MODEL = "llama3.2:3b"  # Hoặc "mistral", "qwen2.5"
    
    # Base URL Ollama (mặc định localhost:11434)
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    
    # ============ CẤU HÌNH HUGGINGFACE ============
    
    # Model HuggingFace (chạy local với CPU/GPU)
    HUGGINGFACE_MODEL = "meta-llama/Llama-3.2-3B-Instruct"
    
    # Device for inference (cuda, cpu, mps)
    HUGGINGFACE_DEVICE = "cpu"
    
    # ============ CẤU HÌNH RETRIEVAL ============
    
    # Ngưỡng similarity tối thiểu cho retrieval
    SIMILARITY_THRESHOLD = 0.3
    
    # Có sử dụng metadata filtering không
    USE_METADATA_FILTERING = False
    
    # Bộ lọc metadata mặc định (từ Giai đoạn 2)
    DEFAULT_METADATA_FILTER = {
        "is_verified": True,
        "weight": 1.0
    }
    
    # ============ CẤU HÌNH WARNING ============
    
    # Có hiển thị cảnh báo [ĐỐI CHIẾU] không
    ENABLE_VERIFICATION_WARNING = True
    
    # Template cảnh báo cho content chưa kiểm chứng
    UNVERIFIED_WARNING_TEMPLATE = """\n\n⚠️ **LƯU Ý**: Câu trả lời này được trích xuất từ các quy định có gắn thẻ [ĐỐI CHIẾU] (chưa được pháp chế rà soát bản gốc). Vui lòng kiểm tra lại văn bản pháp quy trước khi áp dụng vào thực tế."""
    
    # ============ TIỆN ÍCH ============
    
    def get_provider_config(self, provider: Optional[LLMProvider] = None) -> Dict[str, Any]:
        """
        Lấy cấu hình cho provider cụ thể
        
        Args:
            provider: LLMProvider (mặc định là provider hiện tại)
            
        Returns:
            Dict chứa cấu hình provider
        """
        if provider is None:
            provider = self.provider
        
        config = {
            "provider": provider,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "top_k": self.top_k,
            "model": self.model_name,
        }
        
        if provider == LLMProvider.OPENAI:
            config.update({
                "model": cls.OPENAI_MODEL,
                "api_key": cls.OPENAI_API_KEY,
                "requires_api_key": bool(cls.OPENAI_API_KEY)
            })
        
        elif provider == LLMProvider.GOOGLE_GEMINI:
            config.update({
                "model": cls.GEMINI_MODEL,
                "api_key": cls.GOOGLE_API_KEY,
                "requires_api_key": bool(cls.GOOGLE_API_KEY)
            })
        
        elif provider == LLMProvider.OLLAMA:
            config.update({
                "model": cls.OLLAMA_MODEL,
                "base_url": cls.OLLAMA_BASE_URL,
                "requires_api_key": False
            })
        
        elif provider == LLMProvider.HUGGINGFACE:
            config.update({
                "model": cls.HUGGINGFACE_MODEL,
                "device": cls.HUGGINGFACE_DEVICE,
                "requires_api_key": False
            })
        
        return config
    
    @classmethod
    def check_api_keys(cls) -> Dict[str, bool]:
        """
        Kiểm tra API keys cho các providers
        
        Returns:
            Dict với trạng thái API key của từng provider
        """
        status = {}
        
        # Check OpenAI
        status["openai"] = bool(cls.OPENAI_API_KEY)
        
        # Check Google Gemini
        status["google_gemini"] = bool(cls.GOOGLE_API_KEY)
        
        # Check Ollama (kiểm tra kết nối)
        status["ollama"] = True  # Mặc định true, sẽ check runtime
        
        # Check HuggingFace
        status["huggingface"] = True  # Không cần API key
        
        return status
    
    @classmethod
    def get_available_providers(cls) -> list:
        """
        Lấy danh sách providers có sẵn (có API key)
        
        Returns:
            List các LLMProvider có sẵn
        """
        available = []
        api_status = cls.check_api_keys()
        
        # Kiểm tra từng provider
        for provider in LLMProvider:
            provider_name = provider.value
            
            if provider == LLMProvider.OPENAI and api_status["openai"]:
                available.append(provider)
            elif provider == LLMProvider.GOOGLE_GEMINI and api_status["google_gemini"]:
                available.append(provider)
            elif provider == LLMProvider.OLLAMA and api_status["ollama"]:
                available.append(provider)
            elif provider == LLMProvider.HUGGINGFACE and api_status["huggingface"]:
                available.append(provider)
        
        return available
    
    @classmethod
    def print_config_summary(cls):
        """In tóm tắt cấu hình LLM"""
        print("=" * 70)
        print("🤖 CẤU HÌNH LLM CHO HỆ THỐNG RAG PHÁP LÝ")
        print("=" * 70)
        
        print(f"📊 Cấu hình chung:")
        print(f"  - TOP_K: {cls.TOP_K} chunks")
        print(f"  - Temperature: {cls.TEMPERATURE} (chính xác cao)")
        print(f"  - Max tokens: {cls.MAX_TOKENS}")
        print(f"  - Similarity threshold: {cls.SIMILARITY_THRESHOLD}")
        
        print(f"\n🔧 Provider mặc định: {cls.DEFAULT_PROVIDER.value}")
        
        print(f"\n🔑 Trạng thái API keys:")
        api_status = cls.check_api_keys()
        for provider, has_key in api_status.items():
            status = "✅ CÓ" if has_key else "❌ KHÔNG"
            print(f"  - {provider}: {status}")
        
        print(f"\n🚀 Providers có sẵn:")
        available = cls.get_available_providers()
        if available:
            for provider in available:
                print(f"  - {provider.value}")
        else:
            print("  ⚠️ Không có provider nào có sẵn")
            print("  💡 Cài đặt API key hoặc sử dụng local model (Ollama)")
        
        print(f"\n⚠️ Cảnh báo [ĐỐI CHIẾU]: {'BẬT' if cls.ENABLE_VERIFICATION_WARNING else 'TẮT'}")
        print(f"   Bộ lọc metadata: {'BẬT' if cls.USE_METADATA_FILTERING else 'TẮT'}")
        
        print("=" * 70)
    
    @classmethod
    def validate_config(cls) -> bool:
        """
        Validate cấu hình hệ thống
        
        Returns:
            True nếu config hợp lệ, False nếu không
        """
        errors = []
        
        # Kiểm tra providers có sẵn
        available = cls.get_available_providers()
        if not available:
            errors.append("Không có LLM provider nào có sẵn")
        
        # Kiểm tra temperature hợp lệ
        if not 0.0 <= cls.TEMPERATURE <= 2.0:
            errors.append(f"Temperature không hợp lệ: {cls.TEMPERATURE} (phải từ 0.0 đến 2.0)")
        
        # Kiểm tra TOP_K hợp lệ
        if cls.TOP_K <= 0:
            errors.append(f"TOP_K không hợp lệ: {cls.TOP_K} (phải > 0)")
        
        if errors:
            print("❌ Lỗi cấu hình:")
            for error in errors:
                print(f"  - {error}")
            return False
        
        return True


# ============ TEST CONFIG ============

if __name__ == "__main__":
    # In tóm tắt cấu hình
    LLMConfig.print_config_summary()
    
    # Validate config
    is_valid = LLMConfig.validate_config()
    
    if is_valid:
        print("\n✅ Cấu hình LLM hợp lệ")
        
        # Test lấy config cho provider
        print(f"\n🧪 Test config cho {LLMConfig.DEFAULT_PROVIDER.value}:")
        config_obj = LLMConfig()
        config = config_obj.get_provider_config()
        for key, value in config.items():
            if key != "api_key":  # Không hiển thị API key
                print(f"  - {key}: {value}")
    else:
        print("\n❌ Cần sửa cấu hình LLM trước khi chạy hệ thống")
