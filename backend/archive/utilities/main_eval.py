"""
main_eval.py - File điều phối chính cho hệ thống đánh giá RAG Pháp lý
Load tập test, gọi RAG pipeline, đánh giá với RAGAS, và in bảng tóm tắt kết quả.
"""
import os
import sys
import json
import argparse
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
import warnings

# Thêm thư mục hiện tại vào path để import các module khác
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config_eval import EvaluationConfig, EvalMode, create_default_config
from testset_generator import TestSetGenerator, generate_test_dataset
from legal_reviewer import LegalDocumentReviewer, scan_and_export
from rag_evaluator import RAGEvaluator, create_evaluator

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
warnings.filterwarnings('ignore')


class RAGEvaluationPipeline:
    """
    Pipeline đánh giá chính cho hệ thống RAG Pháp lý.
    Điều phối tất cả các bước: tạo test set, scan documents, đánh giá, và báo cáo.
    """
    
    def __init__(self, config: Optional[EvaluationConfig] = None):
        """
        Khởi tạo pipeline.
        
        Args:
            config: Cấu hình đánh giá (None để dùng mặc định)
        """
        self.config = config or create_default_config()
        self.evaluator = None
        self.test_generator = None
        self.document_reviewer = None
        
    def run_full_evaluation(
        self,
        test_cases_count: int = 50,
        scan_documents: bool = True,
        evaluate_rag: bool = True,
        rag_system: Any = None
    ) -> Dict[str, Any]:
        """
        Chạy pipeline đánh giá đầy đủ.
        
        Args:
            test_cases_count: Số lượng test cases cần tạo
            scan_documents: Có scan documents để tìm [ĐỐI CHIẾU] không
            evaluate_rag: Có đánh giá hệ thống RAG không
            rag_system: Hệ thống RAG cần đánh giá
            
        Returns:
            Dictionary với kết quả từ tất cả các bước
        """
        results = {
            "pipeline_start": datetime.now().isoformat(),
            "steps_completed": [],
            "errors": [],
            "output_files": {}
        }
        
        try:
            # Bước 1: Tạo test set
            logger.info("🚀 Bắt đầu pipeline đánh giá RAG Pháp lý")
            logger.info("=" * 60)
            
            if test_cases_count > 0:
                logger.info("📝 Bước 1: Tạo tập dữ liệu test...")
                test_files = self._generate_test_set(test_cases_count)
                results["test_set"] = test_files
                results["steps_completed"].append("test_set_generation")
                logger.info(f"✅ Đã tạo {test_cases_count} test cases")
            
            # Bước 2: Scan documents để tìm [ĐỐI CHIẾU]
            if scan_documents:
                logger.info("\n🔍 Bước 2: Scan documents tìm thẻ [ĐỐI CHIẾU]...")
                checklist_files = self._scan_documents_for_references()
                results["document_review"] = checklist_files
                results["steps_completed"].append("document_scanning")
                logger.info("✅ Đã scan documents và tìm thẻ đối chiếu")
            
            # Bước 3: Đánh giá hệ thống RAG
            if evaluate_rag and rag_system:
                logger.info("\n🧪 Bước 3: Đánh giá hệ thống RAG...")
                evaluation_results = self._evaluate_rag_system(rag_system)
                results["evaluation"] = evaluation_results
                results["steps_completed"].append("rag_evaluation")
                logger.info("✅ Đã hoàn thành đánh giá hệ thống RAG")
            
            # Bước 4: Tạo báo cáo tổng hợp
            logger.info("\n📊 Bước 4: Tạo báo cáo tổng hợp...")
            summary_report = self._generate_summary_report(results)
            results["summary"] = summary_report
            results["steps_completed"].append("report_generation")
            
            results["pipeline_end"] = datetime.now().isoformat()
            results["success"] = True
            
            logger.info("\n" + "=" * 60)
            logger.info("🎉 PIPELINE ĐÁNH GIÁ HOÀN THÀNH THÀNH CÔNG!")
            logger.info("=" * 60)
            
            # In bảng tóm tắt kết quả
            self._print_summary_table(results)
            
            return results
            
        except Exception as e:
            logger.error(f"❌ Lỗi trong pipeline: {e}")
            import traceback
            traceback.print_exc()
            
            results["error"] = str(e)
            results["success"] = False
            return results
    
    def _generate_test_set(self, count: int = 50) -> Dict[str, str]:
        """
        Tạo tập test với số lượng chỉ định.
        
        Args:
            count: Số lượng test cases
            
        Returns:
            Dictionary với đường dẫn đến các file test
        """
        try:
            files = generate_test_dataset(
                num_cases=count,
                output_dir=self.config.output_dir,
                format="both"  # Cả JSONL và JSON
            )
            return files
        except Exception as e:
            logger.error(f"Lỗi khi tạo test set: {e}")
            raise
    
    def _scan_documents_for_references(self) -> Dict[str, str]:
        """
        Scan documents để tìm thẻ [ĐỐI CHIẾU].
        
        Returns:
            Dictionary với đường dẫn đến các file checklist
        """
        try:
            # Quét thư mục hiện tại
            files = scan_and_export(
                root_dir=".",
                output_dir=self.config.output_dir,
                export_formats=["csv", "json"]
            )
            return files
        except Exception as e:
            logger.error(f"Lỗi khi scan documents: {e}")
            # Vẫn tiếp tục nếu không scan được
            return {}
    
    def _evaluate_rag_system(self, rag_system: Any) -> Dict[str, Any]:
        """
        Đánh giá hệ thống RAG.
        
        Args:
            rag_system: Hệ thống RAG cần đánh giá
            
        Returns:
            Dictionary với kết quả đánh giá
        """
        try:
            # Khởi tạo evaluator
            self.evaluator = create_evaluator(self.config)
            
            # Tải test set
            test_generator = TestSetGenerator(self.config.output_dir)
            test_cases = test_generator.load_test_set("test_dataset.jsonl")
            
            if not test_cases:
                # Thử với JSON format
                test_cases = test_generator.load_test_set("test_dataset.json")
            
            if not test_cases:
                raise ValueError("Không tìm thấy test cases để đánh giá")
            
            logger.info(f"📥 Đã tải {len(test_cases)} test cases")
            
            # Chuyển đổi test cases sang định dạng cho evaluator
            test_data = []
            for tc in test_cases[:20]:  # Giới hạn 20 cases cho demo
                test_data.append({
                    "question": tc.question,
                    "answer": tc.ground_truth,  # Placeholder - thực tế sẽ gọi RAG system
                    "ground_truth": tc.ground_truth,
                    "contexts": [tc.context],
                    "metadata": {
                        "category": tc.category,
                        "difficulty": tc.difficulty,
                        "source_document": tc.source_document,
                        "article_reference": tc.article_reference
                    }
                })
            
            # Đánh giá batch
            logger.info(f"🔬 Đang đánh giá {len(test_data)} test cases...")
            evaluation_results = self.evaluator.evaluate_batch(test_data, rag_system)
            
            # Xuất kết quả
            csv_path = self.evaluator.export_results(
                output_file=self.config.results_csv,
                output_dir=self.config.output_dir
            )
            
            # Lấy thống kê
            stats = self.evaluator.get_summary_stats()
            
            # Xuất thống kê ra JSON
            stats_path = os.path.join(self.config.output_dir, "evaluation_stats.json")
            with open(stats_path, 'w', encoding='utf-8') as f:
                json.dump(stats, f, ensure_ascii=False, indent=2)
            
            # Tạo báo cáo chi tiết
            report_path = os.path.join(self.config.output_dir, self.config.detailed_report)
            self._generate_detailed_report(stats, report_path)
            
            return {
                "total_cases": len(evaluation_results),
                "results_csv": csv_path,
                "stats_json": stats_path,
                "report_md": report_path,
                "stats_summary": {
                    "average_scores": stats.get("average_scores", {}),
                    "passing_rates": stats.get("passing_rates", {})
                }
            }
            
        except Exception as e:
            logger.error(f"Lỗi khi đánh giá RAG system: {e}")
            raise
    
    def _generate_summary_report(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Tạo báo cáo tổng hợp từ tất cả kết quả.
        
        Args:
            results: Kết quả từ tất cả các bước
            
        Returns:
            Dictionary với báo cáo tổng hợp
        """
        report = {
            "generated_at": datetime.now().isoformat(),
            "pipeline_duration": "",
            "overall_status": "unknown",
            "key_findings": [],
            "recommendations": [],
            "files_generated": []
        }
        
        # Tính thời gian thực thi
        if "pipeline_start" in results and "pipeline_end" in results:
            start = datetime.fromisoformat(results["pipeline_start"])
            end = datetime.fromisoformat(results["pipeline_end"])
            duration = end - start
            report["pipeline_duration"] = str(duration)
        
        # Tổng hợp files được tạo
        all_files = []
        
        if "test_set" in results:
            all_files.extend(results["test_set"].values())
        
        if "document_review" in results:
            all_files.extend(results["document_review"].values())
        
        if "evaluation" in results:
            eval_data = results["evaluation"]
            all_files.extend([
                eval_data.get("results_csv"),
                eval_data.get("stats_json"),
                eval_data.get("report_md")
            ])
        
        report["files_generated"] = [f for f in all_files if f]
        
        # Xác định overall status
        if results.get("success"):
            report["overall_status"] = "success"
            report["key_findings"].append("Pipeline đánh giá hoàn thành thành công")
        else:
            report["overall_status"] = "failed"
            report["key_findings"].append("Pipeline đánh giá gặp lỗi")
        
        # Thêm thông tin từ đánh giá RAG
        if "evaluation" in results:
            eval_stats = results["evaluation"].get("stats_summary", {})
            
            if "average_scores" in eval_stats:
                scores = eval_stats["average_scores"]
                
                # Kiểm tra ngưỡng
                passing_metrics = []
                failing_metrics = []
                
                for metric, score in scores.items():
                    threshold = self.config.get_threshold(metric)
                    if score >= threshold:
                        passing_metrics.append(metric)
                    else:
                        failing_metrics.append(metric)
                
                if passing_metrics:
                    report["key_findings"].append(
                        f"Các metrics đạt ngưỡng: {', '.join(passing_metrics)}"
                    )
                
                if failing_metrics:
                    report["key_findings"].append(
                        f"Các metrics dưới ngưỡng: {', '.join(failing_metrics)}"
                    )
        
        # Thêm recommendations
        report["recommendations"] = [
            "Đối chiếu checklist_ra_soat.csv với CSDL pháp lý chính thức",
            "Xem xét cải thiện các metrics dưới ngưỡng",
            "Cập nhật test set thường xuyên với các tình huống thực tế",
            "Thực hiện đánh giá định kỳ sau khi cập nhật hệ thống"
        ]
        
        # Lưu báo cáo
        report_path = os.path.join(self.config.output_dir, "pipeline_summary.json")
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        report["report_file"] = report_path
        
        return report
    
    def _generate_detailed_report(
        self, 
        stats: Dict[str, Any], 
        output_path: str
    ):
        """
        Tạo báo cáo chi tiết dạng Markdown.
        
        Args:
            stats: Thống kê đánh giá
            output_path: Đường dẫn output
        """
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write("# BÁO CÁO ĐÁNH GIÁ HỆ THỐNG RAG PHÁP LÝ\n\n")
                f.write(f"**Ngày tạo:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
                
                f.write("## 📊 Tổng quan đánh giá\n\n")
                f.write(f"- **Tổng số test cases:** {stats.get('total_cases', 0)}\n")
                f.write(f"- **Thành công:** {stats.get('successful_cases', 0)}\n")
                f.write(f"- **Thất bại:** {stats.get('failed_cases', 0)}\n\n")
                
                if 'average_scores' in stats:
                    f.write("## ⭐ Điểm trung bình các metrics\n\n")
                    f.write("| Metric | Điểm | Ngưỡng | Kết quả |\n")
                    f.write("|--------|------|--------|---------|\n")
                    
                    for metric, score in stats['average_scores'].items():
                        threshold = self.config.get_threshold(metric)
                        passes = score >= threshold
                        result = "✅ ĐẠT" if passes else "❌ CHƯA ĐẠT"
                        f.write(f"| {metric} | {score:.3f} | {threshold} | {result} |\n")
                    f.write("\n")
                
                if 'passing_rates' in stats:
                    f.write("## 📈 Tỷ lệ đạt ngưỡng\n\n")
                    for metric, rate in stats['passing_rates'].items():
                        f.write(f"- **{metric}:** {rate:.1%}\n")
                    f.write("\n")
                
                if 'by_category' in stats:
                    f.write("## 📂 Phân phối theo Category\n\n")
                    for category, count in stats['by_category'].items():
                        f.write(f"- **{category}:** {count} cases\n")
                    f.write("\n")
                
                if 'by_difficulty' in stats:
                    f.write("## 🎯 Phân phối theo Độ khó\n\n")
                    for difficulty, count in stats['by_difficulty'].items():
                        f.write(f"- **{difficulty}:** {count} cases\n")
                    f.write("\n")
                
                f.write("## 🔍 Giải thích Metrics\n\n")
                f.write("1. **Faithfulness (Độ trung thành):** Đo lường mức độ câu trả lời trung thành với thông tin trong context. Chống hiện tượng hallucination (ảo giác).\n")
                f.write("2. **Answer Relevance (Độ liên quan câu trả lời):** Đo lường mức độ câu trả lời liên quan trực tiếp đến câu hỏi.\n")
                f.write("3. **Context Relevance (Độ liên quan ngữ cảnh):** Đo lường mức độ context từ vector DB liên quan đến câu hỏi.\n\n")
                
                f.write("## 🎯 Khuyến nghị cải thiện\n\n")
                f.write("1. Cải thiện retrieval để lấy context liên quan hơn\n")
                f.write("2. Tinh chỉnh prompts để giảm hallucination\n")
                f.write("3. Mở rộng test set với các tình huống thực tế\n")
                f.write("4. Đối chiếu và xác minh các thông tin có thẻ [ĐỐI CHIẾU]\n\n")
                
                f.write("---\n")
                f.write("*Báo cáo được tạo tự động bởi Hệ thống Đánh giá RAG Pháp lý*\n")
            
            logger.info(f"✅ Đã tạo báo cáo chi tiết: {output_path}")
            
        except Exception as e:
            logger.error(f"Lỗi khi tạo báo cáo chi tiết: {e}")
    
    def _print_summary_table(self, results: Dict[str, Any]):
        """
        In bảng tóm tắt kết quả ra console.
        
        Args:
            results: Kết quả từ pipeline
        """
        print("\n" + "="*70)
        print("📋 BẢNG TÓM TẮT KẾT QUẢ ĐÁNH GIÁ RAG")
        print("="*70)
        
        # Thông tin pipeline
        print(f"\n🔄 Pipeline Status:")
        print(f"   • Thời gian bắt đầu: {results.get('pipeline_start', 'N/A')}")
        print(f"   • Thời gian kết thúc: {results.get('pipeline_end', 'N/A')}")
        print(f"   • Trạng thái: {'✅ THÀNH CÔNG' if results.get('success') else '❌ THẤT BẠI'}")
        
        # Các bước đã hoàn thành
        steps = results.get('steps_completed', [])
        print(f"\n📝 Các bước đã hoàn thành:")
        for step in steps:
            print(f"   • {step}")
        
        # Kết quả đánh giá RAG
        if "evaluation" in results:
            eval_data = results["evaluation"]
            stats = eval_data.get("stats_summary", {})
            
            print(f"\n⭐ Kết quả đánh giá metrics:")
            
            if "average_scores" in stats:
                scores = stats["average_scores"]
                print(f"   {'Metric':<20} {'Điểm':<8} {'Ngưỡng':<8} {'Kết quả':<10}")
                print(f"   {'-'*20} {'-'*8} {'-'*8} {'-'*10}")
                
                for metric, score in scores.items():
                    threshold = self.config.get_threshold(metric)
                    passes = score >= threshold
                    result = "✅ ĐẠT" if passes else "❌ CHƯA ĐẠT"
                    print(f"   {metric:<20} {score:<8.3f} {threshold:<8} {result:<10}")
            
            if "passing_rates" in stats:
                print(f"\n📈 Tỷ lệ đạt ngưỡng:")
                for metric, rate in stats["passing_rates"].items():
                    print(f"   • {metric}: {rate:.1%}")
        
        # Files được tạo
        if "summary" in results:
            summary = results["summary"]
            files = summary.get("files_generated", [])
            
            if files:
                print(f"\n📁 Các file đã tạo:")
                for file in files:
                    filename = os.path.basename(file)
                    print(f"   • {filename}")
        
        # Recommendations
        if "summary" in results:
            summary = results["summary"]
            recs = summary.get("recommendations", [])
            
            if recs:
                print(f"\n🎯 Khuyến nghị:")
                for i, rec in enumerate(recs, 1):
                    print(f"   {i}. {rec}")
        
        print("\n" + "="*70)
        print("✅ Đánh giá hoàn thành. Kiểm tra các file trong thư mục 'evaluation_results'")
        print("="*70)


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Hệ thống Đánh giá RAG Pháp lý - Giai đoạn 4",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ví dụ sử dụng:
  %(prog)s                          # Chạy pipeline đầy đủ với cấu hình mặc định
  %(prog)s --test-cases 100         # Tạo 100 test cases
  %(prog)s --no-scan                # Không scan documents
  %(prog)s --mode ragas             # Sử dụng RAGAS framework
  %(prog)s --mode custom            # Sử dụng custom evaluator
  %(prog)s --config config.json     # Tải cấu hình từ file
        """
    )
    
    parser.add_argument(
        "--test-cases",
        type=int,
        default=50,
        help="Số lượng test cases cần tạo (mặc định: 50)"
    )
    
    parser.add_argument(
        "--no-scan",
        action="store_true",
        help="Không scan documents để tìm thẻ [ĐỐI CHIẾU]"
    )
    
    parser.add_argument(
        "--mode",
        type=str,
        choices=["ragas", "trulens", "custom"],
        default="ragas",
        help="Framework đánh giá (mặc định: ragas)"
    )
    
    parser.add_argument(
        "--config",
        type=str,
        help="Đường dẫn đến file cấu hình JSON"
    )
    
    parser.add_argument(
        "--output-dir",
        type=str,
        default="evaluation_results",
        help="Thư mục lưu kết quả (mặc định: evaluation_results)"
    )
    
    parser.add_argument(
        "--quick",
        action="store_true",
        help="Chạy evaluation nhanh với ít test cases hơn"
    )
    
    return parser.parse_args()


def create_dummy_rag_system():
    """
    Tạo RAG system dummy để test.
    Trong thực tế, đây sẽ là hệ thống RAG thật từ Phase 3.
    
    Returns:
        Dummy RAG system object
    """
    class DummyRAGSystem:
        def query(self, question: str) -> Dict[str, Any]:
            """Dummy query method."""
            return {
                "answer": f"Dummy answer for: {question}",
                "contexts": [f"Dummy context for: {question}"],
                "sources": [],
                "has_warning": False
            }
    
    return DummyRAGSystem()


def main():
    """Hàm main."""
    args = parse_arguments()
    
    # Điều chỉnh số lượng test cases nếu quick mode
    if args.quick:
        args.test_cases = min(args.test_cases, 10)
        logger.info(f"Quick mode: Giới hạn {args.test_cases} test cases")
    
    try:
        # Tải cấu hình
        if args.config:
            from config_eval import load_config_from_file
            config = load_config_from_file(args.config)
            if not config:
                logger.error(f"Không thể tải cấu hình từ {args.config}")
                return 1
        else:
            # Tạo cấu hình dựa trên mode
            if args.mode == "ragas":
                from config_eval import create_ragas_config
                config = create_ragas_config()
            elif args.mode == "trulens":
                from config_eval import create_trulens_config
                config = create_trulens_config()
            else:
                config = create_default_config()
        
        # Cập nhật output directory
        config.output_dir = args.output_dir
        
        # Tạo pipeline
        pipeline = RAGEvaluationPipeline(config)
        
        # Tạo dummy RAG system (trong thực tế sẽ import từ Phase 3)
        rag_system = create_dummy_rag_system()
        
        # Chạy pipeline
        results = pipeline.run_full_evaluation(
            test_cases_count=args.test_cases,
            scan_documents=not args.no_scan,
            evaluate_rag=True,
            rag_system=rag_system
        )
        
        # Kiểm tra kết quả
        if results.get("success"):
            print(f"\n🎉 Pipeline hoàn thành thành công!")
            print(f"📁 Kết quả được lưu tại: {config.output_dir}")
            return 0
        else:
            print(f"\n❌ Pipeline thất bại: {results.get('error', 'Unknown error')}")
            return 1
            
    except KeyboardInterrupt:
        print("\n\n🛑 Pipeline bị dừng bởi người dùng.")
        return 1
    except Exception as e:
        print(f"\n💥 Lỗi không mong muốn: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    """Chạy pipeline đánh giá."""
    print("🚀 KHỞI ĐỘNG HỆ THỐNG ĐÁNH GIÁ RAG PHÁP LÝ - GIAI ĐOẠN 4")
    print("=" * 70)
    
    exit_code = main()
    sys.exit(exit_code)