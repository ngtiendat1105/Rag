"""
Main Chat Interface - Giai đoạn 3: Giao diện CLI cho Hệ thống Trợ lý ảo Pháp lý
Module này cung cấp giao diện chat tương tác với hệ thống RAG.
"""
import os
import sys
import logging
import json
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum
import argparse

# Thêm thư mục hiện tại vào path để import local modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config_llm import LLMConfig, LLMProvider
from rag_pipeline import create_rag_pipeline, RAGPipeline

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ChatMode(Enum):
    """Các chế độ chat hỗ trợ."""
    INTERACTIVE = "interactive"
    BATCH = "batch"
    TEST = "test"
    EXPORT = "export"


class LegalChatBot:
    """
    Chatbot chính cho hệ thống trợ lý pháp lý.
    """
    
    def __init__(
        self,
        provider: LLMProvider = LLMProvider.OPENAI,
        model_name: Optional[str] = None,
        save_history: bool = True,
        history_file: str = "chat_history.json"
    ):
        """
        Khởi tạo chatbot.
        
        Args:
            provider: Loại LLM provider
            model_name: Tên model cụ thể
            save_history: Lưu lịch sử chat
            history_file: File lưu lịch sử
        """
        self.provider = provider
        self.model_name = model_name
        self.save_history = save_history
        self.history_file = history_file
        
        # Khởi tạo pipeline RAG
        print(f"🔄 Đang khởi tạo hệ thống với {provider.value}...")
        try:
            self.pipeline = create_rag_pipeline(
                provider=provider,
                model_name=model_name
            )
            print(f"✅ Hệ thống đã sẵn sàng với {provider.value}")
        except Exception as e:
            print(f"❌ Lỗi khi khởi tạo hệ thống: {e}")
            raise
        
        # Lịch sử chat
        self.chat_history: List[Dict[str, Any]] = []
        self._load_history()
        
    def _load_history(self):
        """Tải lịch sử chat từ file."""
        if self.save_history and os.path.exists(self.history_file):
            try:
                with open(self.history_file, 'r', encoding='utf-8') as f:
                    self.chat_history = json.load(f)
                logger.info(f"Đã tải {len(self.chat_history)} bản ghi từ lịch sử")
            except Exception as e:
                logger.warning(f"Không thể tải lịch sử: {e}")
    
    def _save_history(self):
        """Lưu lịch sử chat vào file."""
        if self.save_history:
            try:
                with open(self.history_file, 'w', encoding='utf-8') as f:
                    json.dump(self.chat_history, f, ensure_ascii=False, indent=2)
                logger.info(f"Đã lưu {len(self.chat_history)} bản ghi vào lịch sử")
            except Exception as e:
                logger.warning(f"Không thể lưu lịch sử: {e}")
    
    def _format_answer(self, result: Dict[str, Any]) -> str:
        """
        Format câu trả lời với styling và citation.
        
        Args:
            result: Kết quả từ pipeline
            
        Returns:
            String đã format
        """
        answer = result.get("answer", "")
        sources = result.get("sources", [])
        has_warning = result.get("has_warning", False)
        
        # Format output
        output_lines = []
        
        # Thêm warning nếu có
        if has_warning:
            warning_msg = "⚠️  CẢNH BÁO: Câu trả lời có chứa tham chiếu [ĐỐI CHIẾU] hoặc thông tin chưa được xác minh đầy đủ. Vui lòng tham khảo văn bản gốc để xác nhận."
            output_lines.append(f"\n\033[93m{warning_msg}\033[0m\n")
        
        # Câu trả lời chính
        output_lines.append(f"\n\033[1mTrả lời:\033[0m")
        output_lines.append(f"{answer}\n")
        
        # Nguồn tham khảo
        if sources:
            output_lines.append(f"\n\033[1m📚 Nguồn tham khảo ({len(sources)}):\033[0m")
            
            verified_sources = [s for s in sources if s.get("is_verified", True)]
            unverified_sources = [s for s in sources if not s.get("is_verified", True)]
            
            if verified_sources:
                output_lines.append("\n\033[92m✓ Nguồn đã xác minh:\033[0m")
                for i, src in enumerate(verified_sources, 1):
                    article_info = f"Điều {src['article']}" if src['article'] != "N/A" else ""
                    clause_info = f", Khoản {src['clause']}" if src['clause'] != "N/A" else ""
                    output_lines.append(f"  {i}. {src['document']} {article_info}{clause_info}")
            
            if unverified_sources:
                output_lines.append("\n\033[93m⚠ Nguồn chưa xác minh:\033[0m")
                for i, src in enumerate(unverified_sources, 1):
                    article_info = f"Điều {src['article']}" if src['article'] != "N/A" else ""
                    clause_info = f", Khoản {src['clause']}" if src['clause'] != "N/A" else ""
                    output_lines.append(f"  {i}. {src['document']} {article_info}{clause_info} \033[93m(cần đối chiếu)\033[0m")
        
        return "\n".join(output_lines)
    
    def ask(self, question: str) -> Dict[str, Any]:
        """
        Gửi câu hỏi đến hệ thống.
        
        Args:
            question: Câu hỏi cần trả lời
            
        Returns:
            Kết quả từ pipeline
        """
        logger.info(f"Đang xử lý câu hỏi: {question}")
        
        try:
            # Gọi pipeline
            result = self.pipeline.query(question)
            
            # Thêm vào lịch sử
            history_entry = {
                "timestamp": datetime.now().isoformat(),
                "question": question,
                "answer": result.get("answer", ""),
                "sources": result.get("sources", []),
                "has_warning": result.get("has_warning", False),
                "provider": self.provider.value,
                "model": self.model_name or "default"
            }
            self.chat_history.append(history_entry)
            
            # Lưu lịch sử
            if self.save_history:
                self._save_history()
            
            return result
            
        except Exception as e:
            logger.error(f"Lỗi khi xử lý câu hỏi: {e}")
            error_result = {
                "question": question,
                "answer": f"Xin lỗi, có lỗi xảy ra khi xử lý câu hỏi: {str(e)}",
                "sources": [],
                "has_warning": False,
                "error": str(e)
            }
            return error_result
    
    def interactive_chat(self):
        """
        Chế độ chat tương tác.
        """
        print("\n" + "="*60)
        print("🤖  TRỢ LÝ ẢO PHÁP LÝ - CHUYÊN GIA PHÁP CHẾ NHÂN SỰ")
        print("="*60)
        print("Hệ thống sẵn sàng trả lời các câu hỏi về pháp luật lao động, bảo hiểm.")
        print("Lệnh đặc biệt:")
        print("  /help    - Hiển thị trợ giúp")
        print("  /history - Xem lịch sử chat")
        print("  /clear   - Xóa lịch sử")
        print("  /export  - Xuất lịch sử ra file")
        print("  /quit    - Thoát chương trình")
        print("="*60)
        
        while True:
            try:
                question = input("\n\033[94m👤 Bạn:\033[0m ").strip()
                
                # Xử lý lệnh đặc biệt
                if not question:
                    continue
                elif question.lower() == "/quit":
                    print("👋 Tạm biệt!")
                    break
                elif question.lower() == "/help":
                    self._show_help()
                    continue
                elif question.lower() == "/history":
                    self._show_history()
                    continue
                elif question.lower() == "/clear":
                    self._clear_history()
                    continue
                elif question.lower() == "/export":
                    self._export_history()
                    continue
                
                # Xử lý câu hỏi
                print("\n\033[90mĐang tìm kiếm và phân tích...\033[0m")
                result = self.ask(question)
                
                # Hiển thị kết quả
                formatted_answer = self._format_answer(result)
                print(formatted_answer)
                
            except KeyboardInterrupt:
                print("\n\n👋 Đã dừng chương trình.")
                break
            except Exception as e:
                print(f"\n❌ Lỗi: {e}")
    
    def batch_process(self, questions_file: str, output_file: Optional[str] = None):
        """
        Xử lý batch từ file.
        
        Args:
            questions_file: File chứa danh sách câu hỏi
            output_file: File kết quả (mặc định: batch_results.json)
        """
        if not os.path.exists(questions_file):
            print(f"❌ File không tồn tại: {questions_file}")
            return
        
        try:
            # Đọc câu hỏi từ file
            with open(questions_file, 'r', encoding='utf-8') as f:
                questions = [line.strip() for line in f if line.strip()]
            
            if not questions:
                print("❌ File không chứa câu hỏi hợp lệ")
                return
            
            print(f"📄 Đang xử lý {len(questions)} câu hỏi từ {questions_file}")
            
            results = []
            for i, question in enumerate(questions, 1):
                print(f"\n[{i}/{len(questions)}] Đang xử lý: {question[:50]}...")
                result = self.ask(question)
                results.append(result)
            
            # Lưu kết quả
            output_file = output_file or "batch_results.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, ensure_ascii=False, indent=2)
            
            print(f"\n✅ Đã xử lý xong {len(results)} câu hỏi")
            print(f"📁 Kết quả được lưu tại: {output_file}")
            
        except Exception as e:
            print(f"❌ Lỗi khi xử lý batch: {e}")
    
    def _show_help(self):
        """Hiển thị trợ giúp."""
        help_text = """
        \033[1mLỆNH ĐẶC BIỆT:\033[0m
        /help    - Hiển thị trợ giúp này
        /history - Xem lịch sử chat gần đây
        /clear   - Xóa toàn bộ lịch sử
        /export  - Xuất lịch sử ra file JSON
        /quit    - Thoát chương trình
        
        \033[1mCÁC LOẠI CÂU HỎI HỖ TRỢ:\033[0m
        • Quy định về nghỉ phép, làm thêm giờ
        • Chế độ bảo hiểm xã hội, y tế
        • Hợp đồng lao động và chấm dứt hợp đồng
        • Tiền lương, phụ cấp, trợ cấp
        • An toàn lao động và bảo hộ lao động
        
        \033[1mLƯU Ý:\033[0m
        • Hệ thống chỉ trả lời dựa trên ngữ cảnh pháp lý có sẵn
        • Trích dẫn nguồn sẽ hiển thị sau mỗi câu trả lời
        • Cảnh báo [ĐỐI CHIẾU] sẽ hiển thị khi cần thiết
        """
        print(help_text)
    
    def _show_history(self):
        """Hiển thị lịch sử chat."""
        if not self.chat_history:
            print("📭 Không có lịch sử chat.")
            return
        
        print(f"\n📚 Lịch sử chat ({len(self.chat_history)} bản ghi):")
        for i, entry in enumerate(self.chat_history[-10:], 1):  # 10 bản ghi gần nhất
            timestamp = entry.get("timestamp", "")[:16].replace("T", " ")
            question = entry.get("question", "")[:50]
            if len(question) > 50:
                question = question[:47] + "..."
            print(f"  {i}. [{timestamp}] {question}")
        
        print(f"\nXem chi tiết trong file: {self.history_file}")
    
    def _clear_history(self):
        """Xóa lịch sử chat."""
        confirm = input("Bạn có chắc muốn xóa toàn bộ lịch sử? (yes/no): ")
        if confirm.lower() == "yes":
            self.chat_history = []
            self._save_history()
            print("✅ Đã xóa toàn bộ lịch sử chat.")
        else:
            print("❌ Hủy xóa lịch sử.")
    
    def _export_history(self):
        """Xuất lịch sử ra file."""
        if not self.chat_history:
            print("📭 Không có dữ liệu để xuất.")
            return
        
        export_file = input("Nhập tên file export (mặc định: chat_export.json): ") or "chat_export.json"
        
        try:
            with open(export_file, 'w', encoding='utf-8') as f:
                json.dump(self.chat_history, f, ensure_ascii=False, indent=2)
            print(f"✅ Đã xuất {len(self.chat_history)} bản ghi ra {export_file}")
        except Exception as e:
            print(f"❌ Lỗi khi xuất file: {e}")


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Trợ lý ảo pháp lý - Hệ thống RAG cho văn bản pháp luật Việt Nam",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ví dụ sử dụng:
  %(prog)s                          # Chế độ chat tương tác
  %(prog)s --provider openai        # Dùng OpenAI GPT
  %(prog)s --provider gemini        # Dùng Google Gemini
  %(prog)s --provider ollama        # Dùng Ollama local
  %(prog)s --provider huggingface   # Dùng HuggingFace
  %(prog)s --batch questions.txt    # Xử lý batch từ file
  %(prog)s --test                   # Chạy test câu hỏi mẫu
        """
    )
    
    parser.add_argument(
        "--provider", "-p",
        type=str,
        choices=[p.value for p in LLMProvider],
        default="openai",
        help="LLM provider (mặc định: openai)"
    )
    
    parser.add_argument(
        "--model", "-m",
        type=str,
        help="Tên model cụ thể (ví dụ: gpt-4-turbo, gemini-1.5-pro)"
    )
    
    parser.add_argument(
        "--batch", "-b",
        type=str,
        help="File chứa danh sách câu hỏi để xử lý batch"
    )
    
    parser.add_argument(
        "--output", "-o",
        type=str,
        help="File output cho kết quả batch"
    )
    
    parser.add_argument(
        "--test",
        action="store_true",
        help="Chạy test với câu hỏi mẫu"
    )
    
    parser.add_argument(
        "--no-history",
        action="store_true",
        help="Không lưu lịch sử chat"
    )

    parser.add_argument(
        "--sync",
        action="store_true",
        help="Đọc lại Markdown và re-index Qdrant trước khi mở chatbot"
    )
    
    parser.add_argument(
        "--history-file",
        type=str,
        default="chat_history.json",
        help="File lưu lịch sử chat (mặc định: chat_history.json)"
    )
    
    return parser.parse_args()


def run_test_questions():
    """Chạy test với câu hỏi mẫu."""
    test_questions = [
        "Người lao động được nghỉ phép năm bao nhiêu ngày?",
        "Mức đóng bảo hiểm xã hội bắt buộc là bao nhiêu phần trăm?",
        "Điều kiện để được hưởng chế độ ốm đau là gì?",
        "Thời gian thử việc tối đa là bao lâu?",
        "Người lao động làm thêm giờ được trả lương như thế nào?"
    ]
    
    print("🧪 Đang chạy test với câu hỏi mẫu...")
    
    try:
        chatbot = LegalChatBot(save_history=False)
        
        for i, question in enumerate(test_questions, 1):
            print(f"\n{'='*60}")
            print(f"Test {i}: {question}")
            print(f"{'='*60}")
            
            result = chatbot.ask(question)
            formatted = chatbot._format_answer(result)
            print(formatted)
        
        print(f"\n✅ Hoàn thành {len(test_questions)} test câu hỏi")
        
    except Exception as e:
        print(f"❌ Lỗi khi chạy test: {e}")
        import traceback
        traceback.print_exc()


def main():
    """Hàm main."""
    args = parse_arguments()
    
    # Convert provider string to enum
    try:
        provider = LLMProvider(args.provider.lower())
    except ValueError:
        print(f"❌ Provider không hợp lệ: {args.provider}")
        print(f"   Chọn từ: {[p.value for p in LLMProvider]}")
        return
    
    try:
        if args.sync:
            from sync_documents import build_knowledge_base, rebuild_index

            print("🔄 Đang đồng bộ các file Markdown mới...")
            count, errors = build_knowledge_base()
            if errors:
                raise RuntimeError("Không thể đồng bộ: " + "; ".join(errors))
            rebuild_index()
            print(f"✅ Đã đồng bộ {count} chunks.")

        # Tạo chatbot
        chatbot = LegalChatBot(
            provider=provider,
            model_name=args.model,
            save_history=not args.no_history,
            history_file=args.history_file
        )
        
        # Chạy mode phù hợp
        if args.test:
            run_test_questions()
        elif args.batch:
            chatbot.batch_process(args.batch, args.output)
        else:
            chatbot.interactive_chat()
            
    except KeyboardInterrupt:
        print("\n\n👋 Đã dừng chương trình.")
    except Exception as e:
        print(f"\n❌ Lỗi chương trình: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()