"""
config_eval.py - Cấu hình hệ thống đánh giá RAG Pháp lý Nhân sự
Module này chứa các cấu hình cho LLM-as-a-Judge, đường dẫn output, và ngưỡng điểm.
"""
import os
from typing import Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum


class EvalMode(Enum):
    """Các chế độ đánh giá hỗ trợ."""
    RAGAS = "ragas"           # Sử dụng RAGAS framework
    TRULENS = "trulens"       # Sử dụng TruLens framework
    CUSTOM = "custom"         # Sử dụng phương pháp tùy chỉnh


@dataclass
class JudgeLLMConfig:
    """
    Cấu hình cho mô hình LLM-as-a-Judge.
    Mô hình này sẽ đánh giá chất lượng câu trả lời.
    """
    provider: str = "openai"           # openai, google, anthropic, etc.
    model_name: str = "gpt-4o"         # Tên model cụ thể
    temperature: float = 0.0           # Nhiệt độ = 0 để đảm bảo tính nhất quán
    api_key_env_var: str = "OPENAI_API_KEY"  # Biến môi trường chứa API key
    timeout: int = 30                   # Timeout cho API call (giây)
    max_retries: int = 3               # Số lần retry tối đa


@dataclass
class EvaluationConfig:
    """
    Cấu hình chính cho hệ thống đánh giá RAG.
    """
    # ============ CẤU HÌNH CHẾ ĐỘ ============
    eval_mode: EvalMode = EvalMode.RAGAS
    enable_parallel_processing: bool = True
    batch_size: int = 5                 # Số lượng câu hỏi xử lý đồng thời
    
    # ============ CẤU HÌNH LLM-AS-A-JUDGE ============
    judge_llm: JudgeLLMConfig = JudgeLLMConfig()
    
    # ============ NGƯỠNG ĐIỂM ============
    # Các ngưỡng điểm tối thiểu để hệ thống được coi là đạt yêu cầu
    thresholds: Dict[str, float] = None
    
    # ============ ĐƯỜNG DẪN FILE ============
    output_dir: str = "evaluation_results"
    testset_file: str = "test_dataset.jsonl"
    results_csv: str = "evaluation_results.csv"
    results_json: str = "evaluation_results.json"
    detailed_report: str = "detailed_evaluation_report.md"
    checklist_file: str = "checklist_ra_soat.csv"
    
    # ============ CẤU HÌNH METRICS ============
    # Danh sách metrics sẽ được tính toán
    metrics_to_compute: list = None
    
    def __post_init__(self):
        """Khởi tạo giá trị mặc định sau khi dataclass được tạo."""
        if self.thresholds is None:
            self.thresholds = {
                "faithfulness": 0.85,      # Độ trung thành với tài liệu
                "answer_relevance": 0.80,  # Độ liên quan của câu trả lời
                "context_relevance": 0.75, # Độ liên quan của ngữ cảnh
                "overall_score": 0.80      # Điểm tổng thể
            }
        
        if self.metrics_to_compute is None:
            self.metrics_to_compute = [
                "faithfulness",
                "answer_relevance", 
                "context_relevance",
                "answer_correctness",
                "answer_similarity"
            ]
        
        # Tạo output directory nếu chưa tồn tại
        os.makedirs(self.output_dir, exist_ok=True)
    
    def get_output_path(self, filename: str) -> str:
        """
        Lấy đường dẫn đầy đủ cho file trong output directory.
        
        Args:
            filename: Tên file
            
        Returns:
            Đường dẫn đầy đủ
        """
        return os.path.join(self.output_dir, filename)
    
    def get_threshold(self, metric_name: str) -> float:
        """
        Lấy ngưỡng điểm cho một metric cụ thể.
        
        Args:
            metric_name: Tên metric
            
        Returns:
            Ngưỡng điểm (mặc định 0.0 nếu không tìm thấy)
        """
        return self.thresholds.get(metric_name, 0.0)
    
    def is_passing(self, metric_name: str, score: float) -> bool:
        """
        Kiểm tra xem một điểm số có vượt ngưỡng không.
        
        Args:
            metric_name: Tên metric
            score: Điểm số cần kiểm tra
            
        Returns:
            True nếu điểm >= ngưỡng, False nếu ngược lại
        """
        threshold = self.get_threshold(metric_name)
        return score >= threshold
    
    def get_judge_api_key(self) -> Optional[str]:
        """
        Lấy API key cho LLM-as-a-Judge từ biến môi trường.
        
        Returns:
            API key hoặc None nếu không tìm thấy
        """
        return os.environ.get(self.judge_llm.api_key_env_var)
    
    def validate_config(self) -> bool:
        """
        Kiểm tra tính hợp lệ của cấu hình.
        
        Returns:
            True nếu cấu hình hợp lệ, False nếu không
        """
        # Kiểm tra output directory có thể tạo không
        try:
            os.makedirs(self.output_dir, exist_ok=True)
        except Exception as e:
            print(f"❌ Không thể tạo output directory: {e}")
            return False
        
        # Kiểm tra ngưỡng điểm hợp lệ
        for metric, threshold in self.thresholds.items():
            if not 0.0 <= threshold <= 1.0:
                print(f"❌ Ngưỡng điểm cho {metric} không hợp lệ: {threshold}")
                return False
        
        # Kiểm tra API key nếu sử dụng LLM-as-a-Judge
        if self.eval_mode in [EvalMode.RAGAS, EvalMode.CUSTOM]:
            api_key = self.get_judge_api_key()
            if not api_key:
                print(f"⚠️  Cảnh báo: Không tìm thấy API key trong {self.judge_llm.api_key_env_var}")
                print("   Hệ thống có thể không hoạt động với các metrics cần LLM judge.")
        
        return True


def create_default_config() -> EvaluationConfig:
    """
    Tạo cấu hình mặc định cho hệ thống đánh giá.
    
    Returns:
        EvaluationConfig với các giá trị mặc định
    """
    return EvaluationConfig()


def create_ragas_config() -> EvaluationConfig:
    """
    Tạo cấu hình tối ưu cho RAGAS framework.
    
    Returns:
        EvaluationConfig cho RAGAS
    """
    return EvaluationConfig(
        eval_mode=EvalMode.RAGAS,
        judge_llm=JudgeLLMConfig(
            provider="openai",
            model_name="gpt-4o",
            temperature=0.0
        ),
        thresholds={
            "faithfulness": 0.85,
            "answer_relevance": 0.80,
            "context_relevance": 0.75,
            "answer_correctness": 0.80,
            "overall_score": 0.80
        }
    )


def create_trulens_config() -> EvaluationConfig:
    """
    Tạo cấu hình tối ưu cho TruLens framework.
    
    Returns:
        EvaluationConfig cho TruLens
    """
    return EvaluationConfig(
        eval_mode=EvalMode.TRULENS,
        thresholds={
            "faithfulness": 0.80,
            "answer_relevance": 0.75,
            "context_relevance": 0.70,
            "overall_score": 0.75
        }
    )


def load_config_from_file(filepath: str) -> Optional[EvaluationConfig]:
    """
    Tải cấu hình từ file JSON.
    
    Args:
        filepath: Đường dẫn đến file cấu hình
        
    Returns:
        EvaluationConfig hoặc None nếu có lỗi
    """
    import json
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            config_data = json.load(f)
        
        # Chuyển đổi từ dict sang EvaluationConfig
        if 'judge_llm' in config_data:
            config_data['judge_llm'] = JudgeLLMConfig(**config_data['judge_llm'])
        
        if 'eval_mode' in config_data:
            config_data['eval_mode'] = EvalMode(config_data['eval_mode'])
        
        return EvaluationConfig(**config_data)
        
    except Exception as e:
        print(f"❌ Lỗi khi tải cấu hình từ file: {e}")
        return None


if __name__ == "__main__":
    """Test cấu hình mặc định."""
    print("🧪 Testing Evaluation Configuration...")
    print("=" * 60)
    
    config = create_default_config()
    
    print(f"✅ Evaluation mode: {config.eval_mode.value}")
    print(f"✅ Judge LLM: {config.judge_llm.provider} - {config.judge_llm.model_name}")
    print(f"✅ Temperature: {config.judge_llm.temperature}")
    print(f"✅ Output directory: {config.output_dir}")
    
    print("\n📊 Thresholds:")
    for metric, threshold in config.thresholds.items():
        print(f"  - {metric}: {threshold}")
    
    print("\n📈 Metrics to compute:")
    for metric in config.metrics_to_compute:
        print(f"  - {metric}")
    
    # Test validation
    is_valid = config.validate_config()
    print(f"\n🔍 Config validation: {'✅ PASSED' if is_valid else '❌ FAILED'}")
    
    # Test threshold checking
    test_score = 0.85
    print(f"\n🧪 Threshold test (score={test_score}):")
    for metric in ["faithfulness", "answer_relevance", "context_relevance"]:
        passes = config.is_passing(metric, test_score)
        threshold = config.get_threshold(metric)
        status = "✅ PASSES" if passes else "❌ FAILS"
        print(f"  - {metric}: {status} (threshold={threshold})")
    
    print("\n" + "=" * 60)
    print("✅ Configuration test completed successfully")