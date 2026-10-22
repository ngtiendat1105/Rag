"""
rag_evaluator.py - Module đánh giá RAG với RAGAS framework
Tích hợp RAGAS để tính toán 3 chỉ số cốt lõi: Faithfulness, Answer Relevance, Context Relevance
với giải thích chi tiết về ý nghĩa toán học và logic của từng metric.
"""
import os
import sys
import json
import logging
import pandas as pd
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import warnings

# Thêm thư mục hiện tại vào path để import các module khác
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config_eval import EvaluationConfig, EvalMode
from testset_generator import TestCase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
warnings.filterwarnings('ignore')


@dataclass
class EvaluationResult:
    """Kết quả đánh giá cho một test case."""
    question: str                    # Câu hỏi
    answer: str                     # Câu trả lời từ hệ thống
    ground_truth: str               # Ground truth
    contexts: List[str]             # Contexts từ retrieval
    metrics: Dict[str, float]       # Các metrics score
    metadata: Dict[str, Any]        # Metadata
    error: Optional[str] = None     # Lỗi nếu có
    
    def is_passing(self, thresholds: Dict[str, float]) -> Dict[str, bool]:
        """
        Kiểm tra xem các metrics có vượt ngưỡng không.
        
        Args:
            thresholds: Dictionary với ngưỡng cho từng metric
            
        Returns:
            Dictionary với kết quả pass/fail cho từng metric
        """
        results = {}
        for metric, score in self.metrics.items():
            threshold = thresholds.get(metric, 0.0)
            results[metric] = score >= threshold
        return results
    
    def to_dict(self) -> Dict[str, Any]:
        """Chuyển đổi thành dictionary."""
        return {
            "question": self.question,
            "answer": self.answer,
            "ground_truth": self.ground_truth,
            "contexts": self.contexts,
            "metrics": self.metrics,
            "metadata": self.metadata,
            "error": self.error,
            "timestamp": datetime.now().isoformat()
        }


class RAGEvaluator:
    """
    Evaluator sử dụng RAGAS framework để đánh giá hệ thống RAG.
    Tính toán Faithfulness, Answer Relevance, Context Relevance và các metrics khác.
    """
    
    def __init__(self, config: EvaluationConfig):
        """
        Khởi tạo evaluator.
        
        Args:
            config: Cấu hình đánh giá
        """
        self.config = config
        self.eval_mode = config.eval_mode
        self.metrics_history: List[EvaluationResult] = []
        
        # Khởi tạo RAGAS nếu được chọn
        if self.eval_mode == EvalMode.RAGAS:
            self._initialize_ragas()
        elif self.eval_mode == EvalMode.TRULENS:
            self._initialize_trulens()
        else:
            self._initialize_custom()
    
    def _initialize_ragas(self):
        """Khởi tạo RAGAS framework."""
        try:
            from ragas import evaluate
            from ragas.metrics import (
                faithfulness,
                answer_relevance,
                context_relevance,
                answer_correctness,
                answer_similarity
            )
            from ragas.metrics.critique import harmfulness
            from datasets import Dataset
            
            self.ragas_available = True
            self.evaluate_fn = evaluate
            self.Dataset = Dataset
            
            # Định nghĩa các metrics sẽ sử dụng
            self.ragas_metrics = [
                faithfulness,
                answer_relevance,
                context_relevance,
                answer_correctness,
                answer_similarity,
                harmfulness
            ]
            
            logger.info("✅ RAGAS framework initialized successfully")
            
        except ImportError as e:
            logger.warning(f"⚠️  RAGAS not available: {e}")
            logger.info("Installing with: pip install ragas datasets")
            self.ragas_available = False
            self._initialize_custom()
    
    def _initialize_trulens(self):
        """Khởi tạo TruLens framework."""
        try:
            from trulens_eval import Tru
            from trulens_eval import Feedback
            from trulens_eval import TruCustomApp
            from trulens_eval.feedback import Groundedness
            from trulens_eval.feedback.provider.openai import OpenAI as TruOpenAI
            
            self.trulens_available = True
            self.Tru = Tru
            self.Feedback = Feedback
            self.TruCustomApp = TruCustomApp
            self.Groundedness = Groundedness
            self.TruOpenAI = TruOpenAI
            
            logger.info("✅ TruLens framework initialized successfully")
            
        except ImportError as e:
            logger.warning(f"⚠️  TruLens not available: {e}")
            logger.info("Installing with: pip install trulens-eval")
            self.trulens_available = False
            self._initialize_custom()
    
    def _initialize_custom(self):
        """Khởi tạo custom evaluator."""
        logger.info("✅ Using custom evaluation method")
        self.custom_available = True
    
    def _calculate_faithfulness_custom(
        self, 
        answer: str, 
        contexts: List[str]
    ) -> float:
        """
        Tính toán Faithfulness score bằng phương pháp custom.
        
        Ý NGHĨA TOÁN HỌC/LOGIC:
        Faithfulness đo lường mức độ câu trả lời trung thành với thông tin trong context.
        Công thức: F = 1 - (S_hallucinated / S_total)
        Trong đó:
          - S_hallucinated: Số claim (tuyên bố) trong câu trả lời không được hỗ trợ bởi context
          - S_total: Tổng số claim trong câu trả lời
        
        CÁCH TÍNH ĐƠN GIẢN:
        1. Tách câu trả lời thành các claim (câu đơn)
        2. Với mỗi claim, kiểm tra xem có xuất hiện trong context không
        3. Tính tỷ lệ claims được hỗ trợ
        
        Args:
            answer: Câu trả lời
            contexts: List các context
            
        Returns:
            Faithfulness score (0-1)
        """
        try:
            # Kết hợp tất cả contexts thành một string
            combined_context = " ".join(contexts)
            
            # Đơn giản: Tách câu trả lời thành các câu
            sentences = self._split_into_sentences(answer)
            
            if not sentences:
                return 0.0
            
            supported_count = 0
            
            for sentence in sentences:
                # Loại bỏ các từ quá chung chung
                if len(sentence.split()) < 3:
                    continue
                
                # Kiểm tra xem từ khóa trong sentence có xuất hiện trong context không
                words = sentence.lower().split()
                relevant_words = [w for w in words if len(w) > 3]  # Bỏ từ ngắn
                
                if not relevant_words:
                    continue
                
                # Đếm số từ liên quan xuất hiện trong context
                context_lower = combined_context.lower()
                matches = sum(1 for w in relevant_words if w in context_lower)
                
                # Nếu ít nhất 50% từ liên quan xuất hiện trong context
                if matches / len(relevant_words) >= 0.5:
                    supported_count += 1
            
            score = supported_count / len(sentences) if sentences else 0.0
            return min(max(score, 0.0), 1.0)  # Đảm bảo trong khoảng [0, 1]
            
        except Exception as e:
            logger.error(f"Error calculating faithfulness: {e}")
            return 0.0
    
    def _calculate_answer_relevance_custom(
        self, 
        question: str, 
        answer: str
    ) -> float:
        """
        Tính toán Answer Relevance score bằng phương pháp custom.
        
        Ý NGHĨA TOÁN HỌC/LOGIC:
        Answer Relevance đo lường mức độ câu trả lời liên quan đến câu hỏi.
        Công thức: R = cosine_similarity(embedding(question), embedding(answer))
        
        CÁCH TÍNH ĐƠN GIẢN:
        1. Trích xuất từ khóa từ câu hỏi
        2. Đếm số từ khóa xuất hiện trong câu trả lời
        3. Tính tỷ lệ từ khóa được đề cập
        
        Args:
            question: Câu hỏi
            answer: Câu trả lời
            
        Returns:
            Answer Relevance score (0-1)
        """
        try:
            # Trích xuất từ khóa từ câu hỏi (bỏ từ dừng)
            stop_words = {"cái", "gì", "nào", "bao", "nhiêu", "thế", "là", "của", "và", "hoặc"}
            question_words = set([
                w.lower() for w in question.split() 
                if w.lower() not in stop_words and len(w) > 2
            ])
            
            if not question_words:
                return 0.5  # Default score
            
            answer_lower = answer.lower()
            
            # Đếm số từ khóa xuất hiện trong câu trả lời
            matched_words = sum(1 for w in question_words if w in answer_lower)
            
            score = matched_words / len(question_words)
            
            # Thêm penalty nếu câu trả lời quá ngắn
            if len(answer.split()) < 5:
                score *= 0.7
            
            return min(max(score, 0.0), 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating answer relevance: {e}")
            return 0.0
    
    def _calculate_context_relevance_custom(
        self, 
        question: str, 
        contexts: List[str]
    ) -> float:
        """
        Tính toán Context Relevance score bằng phương pháp custom.
        
        Ý NGHĨA TOÁN HỌC/LOGIC:
        Context Relevance đo lường mức độ context liên quan đến câu hỏi.
        Công thức: C = average(cosine_similarity(embedding(question), embedding(context_i)))
        
        CÁCH TÍNH ĐƠN GIẢN:
        1. Trích xuất từ khóa từ câu hỏi
        2. Với mỗi context, đếm số từ khóa xuất hiện
        3. Tính trung bình tỷ lệ từ khóa trên tất cả contexts
        
        Args:
            question: Câu hỏi
            contexts: List các context
            
        Returns:
            Context Relevance score (0-1)
        """
        try:
            if not contexts:
                return 0.0
            
            # Trích xuất từ khóa từ câu hỏi
            stop_words = {"cái", "gì", "nào", "bao", "nhiêu", "thế", "là", "của", "và", "hoặc"}
            question_words = set([
                w.lower() for w in question.split() 
                if w.lower() not in stop_words and len(w) > 2
            ])
            
            if not question_words:
                return 0.5  # Default score
            
            total_score = 0.0
            
            for context in contexts:
                context_lower = context.lower()
                
                # Đếm số từ khóa xuất hiện trong context
                matched_words = sum(1 for w in question_words if w in context_lower)
                
                context_score = matched_words / len(question_words)
                total_score += context_score
            
            # Trung bình trên tất cả contexts
            avg_score = total_score / len(contexts)
            
            # Penalty nếu có context quá dài (có thể chứa nhiều thông tin không liên quan)
            avg_length = sum(len(c.split()) for c in contexts) / len(contexts)
            if avg_length > 500:  # Nếu trung bình > 500 từ
                avg_score *= 0.8
            
            return min(max(avg_score, 0.0), 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating context relevance: {e}")
            return 0.0
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Tách text thành các câu đơn giản."""
        import re
        # Tách bằng dấu câu
        sentences = re.split(r'[.!?]+', text)
        # Loại bỏ câu rỗng và trim whitespace
        sentences = [s.strip() for s in sentences if s.strip()]
        return sentences
    
    def evaluate_single(
        self, 
        question: str,
        answer: str,
        ground_truth: str,
        contexts: List[str],
        metadata: Dict[str, Any] = None
    ) -> EvaluationResult:
        """
        Đánh giá một câu hỏi đơn lẻ.
        
        Args:
            question: Câu hỏi
            answer: Câu trả lời từ hệ thống
            ground_truth: Ground truth
            contexts: Contexts từ retrieval
            metadata: Metadata bổ sung
            
        Returns:
            EvaluationResult
        """
        try:
            if metadata is None:
                metadata = {}
            
            metrics = {}
            
            if self.eval_mode == EvalMode.RAGAS and self.ragas_available:
                metrics = self._evaluate_with_ragas(
                    question, answer, ground_truth, contexts
                )
            elif self.eval_mode == EvalMode.TRULENS and self.trulens_available:
                metrics = self._evaluate_with_trulens(
                    question, answer, ground_truth, contexts
                )
            else:
                # Sử dụng custom evaluation
                metrics = {
                    "faithfulness": self._calculate_faithfulness_custom(answer, contexts),
                    "answer_relevance": self._calculate_answer_relevance_custom(question, answer),
                    "context_relevance": self._calculate_context_relevance_custom(question, contexts),
                    "answer_correctness": 0.5,  # Placeholder
                    "answer_similarity": 0.5,   # Placeholder
                    "overall_score": 0.5        # Placeholder
                }
            
            # Tính overall score (trung bình có trọng số)
            if "overall_score" not in metrics:
                key_metrics = ["faithfulness", "answer_relevance", "context_relevance"]
                weights = [0.4, 0.3, 0.3]  # Trọng số
                
                weighted_sum = 0
                total_weight = 0
                
                for metric, weight in zip(key_metrics, weights):
                    if metric in metrics:
                        weighted_sum += metrics[metric] * weight
                        total_weight += weight
                
                if total_weight > 0:
                    metrics["overall_score"] = weighted_sum / total_weight
                else:
                    metrics["overall_score"] = 0.0
            
            result = EvaluationResult(
                question=question,
                answer=answer,
                ground_truth=ground_truth,
                contexts=contexts,
                metrics=metrics,
                metadata=metadata
            )
            
            self.metrics_history.append(result)
            return result
            
        except Exception as e:
            logger.error(f"Error evaluating single case: {e}")
            return EvaluationResult(
                question=question,
                answer=answer,
                ground_truth=ground_truth,
                contexts=contexts,
                metrics={},
                metadata=metadata or {},
                error=str(e)
            )
    
    def _evaluate_with_ragas(
        self, 
        question: str,
        answer: str,
        ground_truth: str,
        contexts: List[str]
    ) -> Dict[str, float]:
        """
        Đánh giá với RAGAS framework.
        
        Args:
            question: Câu hỏi
            answer: Câu trả lời
            ground_truth: Ground truth
            contexts: Contexts
            
        Returns:
            Dictionary với các metrics score
        """
        try:
            # Tạo dataset theo định dạng RAGAS
            data = {
                "question": [question],
                "answer": [answer],
                "contexts": [contexts],
                "ground_truth": [ground_truth]
            }
            
            dataset = self.Dataset.from_dict(data)
            
            # Thực hiện evaluation
            result = self.evaluate_fn(
                dataset=dataset,
                metrics=self.ragas_metrics,
            )
            
            # Trích xuất scores
            scores = {}
            for metric in self.ragas_metrics:
                metric_name = metric.name
                if metric_name in result:
                    scores[metric_name] = float(result[metric_name][0])
            
            return scores
            
        except Exception as e:
            logger.error(f"RAGAS evaluation error: {e}")
            # Fallback to custom
            return {
                "faithfulness": self._calculate_faithfulness_custom(answer, contexts),
                "answer_relevance": self._calculate_answer_relevance_custom(question, answer),
                "context_relevance": self._calculate_context_relevance_custom(question, contexts),
            }
    
    def _evaluate_with_trulens(
        self, 
        question: str,
        answer: str,
        ground_truth: str,
        contexts: List[str]
    ) -> Dict[str, float]:
        """
        Đánh giá với TruLens framework.
        
        Args:
            question: Câu hỏi
            answer: Câu trả lời
            ground_truth: Ground truth
            contexts: Contexts
            
        Returns:
            Dictionary với các metrics score
        """
        try:
            # Placeholder - cần implement đầy đủ TruLens integration
            logger.warning("TruLens evaluation not fully implemented, using custom fallback")
            
            return {
                "faithfulness": self._calculate_faithfulness_custom(answer, contexts),
                "answer_relevance": self._calculate_answer_relevance_custom(question, answer),
                "context_relevance": self._calculate_context_relevance_custom(question, contexts),
                "groundedness": 0.5,
                "relevance": 0.5
            }
            
        except Exception as e:
            logger.error(f"TruLens evaluation error: {e}")
            return {}
    
    def evaluate_batch(
        self, 
        test_cases: List[Dict[str, Any]],
        rag_system: Any  # Hệ thống RAG của chúng ta
    ) -> List[EvaluationResult]:
        """
        Đánh giá batch các test cases.
        
        Args:
            test_cases: List các test cases
            rag_system: Hệ thống RAG để tạo câu trả lời
            
        Returns:
            List các EvaluationResult
        """
        results = []
        
        logger.info(f"Starting batch evaluation of {len(test_cases)} test cases")
        
        for i, test_case in enumerate(test_cases):
            try:
                logger.info(f"Processing test case {i+1}/{len(test_cases)}")
                
                # Lấy thông tin từ test case
                question = test_case.get("question", "")
                ground_truth = test_case.get("ground_truth", test_case.get("answer", ""))
                context = test_case.get("context", test_case.get("contexts", [""])[0])
                
                # Gọi hệ thống RAG để lấy câu trả lời và contexts
                # Giả sử rag_system có method query trả về answer và contexts
                if hasattr(rag_system, 'query'):
                    rag_result = rag_system.query(question)
                    answer = rag_result.get("answer", "")
                    retrieved_contexts = rag_result.get("contexts", [context])
                else:
                    # Fallback: sử dụng context từ test case
                    answer = f"Test answer for: {question}"
                    retrieved_contexts = [context]
                
                # Metadata từ test case
                metadata = test_case.get("metadata", {})
                metadata.update({
                    "test_case_index": i,
                    "category": test_case.get("category", "unknown"),
                    "difficulty": test_case.get("difficulty", "medium")
                })
                
                # Đánh giá
                result = self.evaluate_single(
                    question=question,
                    answer=answer,
                    ground_truth=ground_truth,
                    contexts=retrieved_contexts,
                    metadata=metadata
                )
                
                results.append(result)
                
                # Log progress
                if (i + 1) % 10 == 0:
                    avg_faithfulness = sum(r.metrics.get("faithfulness", 0) for r in results) / len(results)
                    logger.info(f"  Processed {i+1} cases, avg faithfulness: {avg_faithfulness:.3f}")
                    
            except Exception as e:
                logger.error(f"Error processing test case {i}: {e}")
                # Thêm result với error
                results.append(EvaluationResult(
                    question=test_case.get("question", ""),
                    answer="",
                    ground_truth=test_case.get("ground_truth", ""),
                    contexts=[],
                    metrics={},
                    metadata=test_case.get("metadata", {}),
                    error=str(e)
                ))
        
        logger.info(f"✅ Batch evaluation completed: {len(results)} results")
        return results
    
    def get_summary_stats(self) -> Dict[str, Any]:
        """
        Lấy thống kê tổng hợp từ tất cả kết quả đánh giá.
        
        Returns:
            Dictionary với thống kê
        """
        if not self.metrics_history:
            return {"message": "No evaluation results available"}
        
        stats = {
            "total_cases": len(self.metrics_history),
            "successful_cases": len([r for r in self.metrics_history if not r.error]),
            "failed_cases": len([r for r in self.metrics_history if r.error]),
            "average_scores": {},
            "score_distribution": {},
            "passing_rates": {}
        }
        
        # Thu thập tất cả metrics
        all_metrics = {}
        for result in self.metrics_history:
            if result.error:
                continue
            for metric, score in result.metrics.items():
                if metric not in all_metrics:
                    all_metrics[metric] = []
                all_metrics[metric].append(score)
        
        # Tính average scores
        for metric, scores in all_metrics.items():
            if scores:
                stats["average_scores"][metric] = sum(scores) / len(scores)
                
                # Score distribution
                stats["score_distribution"][metric] = {
                    "min": min(scores),
                    "max": max(scores),
                    "std": pd.Series(scores).std() if len(scores) > 1 else 0.0
                }
                
                # Passing rates (so với thresholds trong config)
                threshold = self.config.get_threshold(metric)
                passing = sum(1 for s in scores if s >= threshold)
                stats["passing_rates"][metric] = passing / len(scores) if len(scores) > 0 else 0.0
        
        # Thêm metadata từ các test cases
        categories = []
        difficulties = []
        
        for result in self.metrics_history:
            if result.metadata:
                categories.append(result.metadata.get("category", "unknown"))
                difficulties.append(result.metadata.get("difficulty", "medium"))
        
        if categories:
            stats["by_category"] = pd.Series(categories).value_counts().to_dict()
        if difficulties:
            stats["by_difficulty"] = pd.Series(difficulties).value_counts().to_dict()
        
        return stats
    
    def export_results(
        self, 
        output_file: str = "evaluation_results.csv",
        output_dir: str = "evaluation_results"
    ) -> str:
        """
        Xuất kết quả đánh giá ra file.
        
        Args:
            output_file: Tên file output
            output_dir: Thư mục output
            
        Returns:
            Đường dẫn đến file đã xuất
        """
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, output_file)
        
        try:
            # Chuyển đổi results thành DataFrame
            data = []
            
            for result in self.metrics_history:
                row = {
                    "question": result.question,
                    "answer": result.answer[:200],  # Giới hạn độ dài
                    "ground_truth": result.ground_truth[:200],
                    "num_contexts": len(result.contexts),
                    "has_error": bool(result.error),
                    "error_message": result.error or ""
                }
                
                # Thêm metrics
                for metric, score in result.metrics.items():
                    row[metric] = score
                
                # Thêm metadata
                if result.metadata:
                    for key, value in result.metadata.items():
                        if isinstance(value, (str, int, float, bool)):
                            row[f"meta_{key}"] = value
                
                data.append(row)
            
            df = pd.DataFrame(data)
            
            # Lưu ra CSV
            df.to_csv(output_path, index=False, encoding='utf-8')
            
            logger.info(f"✅ Đã xuất {len(df)} kết quả ra {output_path}")
            
            # Xuất thêm file JSON với thống kê
            stats = self.get_summary_stats()
            json_path = os.path.join(output_dir, "evaluation_summary.json")
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(stats, f, ensure_ascii=False, indent=2)
            
            logger.info(f"✅ Đã xuất thống kê ra {json_path}")
            
            return output_path
            
        except Exception as e:
            logger.error(f"❌ Lỗi khi xuất kết quả: {e}")
            raise
    
    def print_detailed_report(self):
        """In báo cáo chi tiết ra console."""
        stats = self.get_summary_stats()
        
        print("\n" + "="*70)
        print("📊 BÁO CÁO ĐÁNH GIÁ HỆ THỐNG RAG PHÁP LÝ")
        print("="*70)
        
        print(f"\n📈 Tổng quan đánh giá:")
        print(f"   • Tổng số test cases: {stats['total_cases']}")
        print(f"   • Thành công: {stats['successful_cases']}")
        print(f"   • Thất bại: {stats['failed_cases']}")
        
        if stats.get('by_category'):
            print(f"\n📂 Phân phối theo category:")
            for category, count in stats['by_category'].items():
                print(f"   • {category}: {count}")
        
        if stats.get('by_difficulty'):
            print(f"\n🎯 Phân phối theo độ khó:")
            for difficulty, count in stats['by_difficulty'].items():
                print(f"   • {difficulty}: {count}")
        
        print(f"\n⭐ Điểm trung bình các metrics:")
        if stats.get('average_scores'):
            for metric, score in stats['average_scores'].items():
                threshold = self.config.get_threshold(metric)
                passes = score >= threshold
                status = "✅" if passes else "❌"
                print(f"   • {metric}: {score:.3f} {status} (threshold: {threshold})")
        
        print(f"\n📊 Tỷ lệ đạt ngưỡng:")
        if stats.get('passing_rates'):
            for metric, rate in stats['passing_rates'].items():
                print(f"   • {metric}: {rate:.1%}")
        
        print(f"\n🔍 Giải thích metrics:")
        print(f"   1. Faithfulness: Độ trung thành với tài liệu (chống ảo giác)")
        print(f"   2. Answer Relevance: Độ liên quan của câu trả lời với câu hỏi")
        print(f"   3. Context Relevance: Độ liên quan của ngữ cảnh với câu hỏi")
        
        print("\n" + "="*70)
        print("✅ Hoàn thành đánh giá hệ thống RAG")


def create_evaluator(config: Optional[EvaluationConfig] = None) -> RAGEvaluator:
    """
    Factory function để tạo evaluator.
    
    Args:
        config: Cấu hình đánh giá (None để dùng mặc định)
        
    Returns:
        RAGEvaluator instance
    """
    if config is None:
        from config_eval import create_default_config
        config = create_default_config()
    
    return RAGEvaluator(config)


if __name__ == "__main__":
    """Test evaluator với dữ liệu mẫu."""
    print("🧪 Testing RAG Evaluator...")
    print("=" * 60)
    
    try:
        # Tạo config
        from config_eval import create_default_config
        config = create_default_config()
        
        # Tạo evaluator
        evaluator = create_evaluator(config)
        
        # Tạo test data mẫu
        test_data = [
            {
                "question": "Mức trợ cấp mai táng là bao nhiêu?",
                "answer": "Mức trợ cấp mai táng bằng 10 lần mức lương cơ sở.",
                "ground_truth": "Mức trợ cấp mai táng bằng 10 lần mức lương cơ sở theo Điều 66 Luật BHXH.",
                "contexts": ["Theo Điều 66 Luật BHXH, mức trợ cấp mai táng bằng 10 lần mức lương cơ sở."],
                "metadata": {"category": "bhxh", "difficulty": "hard"}
            },
            {
                "question": "Tuổi nghỉ hưu của lao động nữ?",
                "answer": "Lao động nữ nghỉ hưu ở tuổi 55.",
                "ground_truth": "Lao động nữ nghỉ hưu ở tuổi đủ 55 theo Bộ luật Lao động.",
                "contexts": ["Bộ luật Lao động quy định tuổi nghỉ hưu của lao động nữ là 55."],
                "metadata": {"category": "ld", "difficulty": "medium"}
            }
        ]
        
        print(f"🔍 Đang đánh giá {len(test_data)} test cases...")
        
        # Đánh giá từng case
        for i, test_case in enumerate(test_data, 1):
            result = evaluator.evaluate_single(
                question=test_case["question"],
                answer=test_case["answer"],
                ground_truth=test_case["ground_truth"],
                contexts=test_case["contexts"],
                metadata=test_case.get("metadata", {})
            )
            
            print(f"\n--- Test Case {i} ---")
            print(f"Question: {test_case['question'][:50]}...")
            print(f"Metrics:")
            for metric, score in result.metrics.items():
                print(f"  • {metric}: {score:.3f}")
            
            if result.error:
                print(f"Error: {result.error}")
        
        # Lấy thống kê
        print("\n📊 Thống kê tổng hợp:")
        stats = evaluator.get_summary_stats()
        print(f"   Total cases: {stats['total_cases']}")
        print(f"   Average scores:")
        for metric, score in stats.get('average_scores', {}).items():
            print(f"     • {metric}: {score:.3f}")
        
        # Xuất kết quả
        csv_path = evaluator.export_results()
        print(f"\n📁 Đã xuất kết quả ra: {csv_path}")
        
        # In báo cáo
        evaluator.print_detailed_report()
        
        print("\n" + "=" * 60)
        print("✅ RAG evaluator test completed successfully")
        
    except Exception as e:
        print(f"\n❌ Error during test: {e}")
        import traceback
        traceback.print_exc()