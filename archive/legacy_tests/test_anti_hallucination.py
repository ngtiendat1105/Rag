"""
test_anti_hallucination.py - Test Anti-Hallucination capability
Kiểm tra xem LLM có tự bịa thông tin hay không
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from config_llm import LLMConfig, LLMProvider
from rag_pipeline import create_rag_pipeline
import time

# Định nghĩa test cases
TEST_CASES = [
    {
        "category": "✅ CÓ TRONG DB - Phải trả lời đúng",
        "questions": [
            {
                "question": "Hợp đồng lao động phải có những nội dung chủ yếu nào?",
                "expected": "should_answer",
                "reason": "Điều 21 Bộ luật Lao động có trong DB"
            },
            {
                "question": "Thời gian thử việc tối đa là bao lâu?",
                "expected": "should_answer", 
                "reason": "Điều 25 có trong DB"
            },
            {
                "question": "Người tham gia bảo hiểm xã hội bắt buộc gồm ai?",
                "expected": "should_answer",
                "reason": "Luật BHXH có trong DB"
            }
        ]
    },
    {
        "category": "❌ KHÔNG CÓ TRONG DB - Phải nói không có",
        "questions": [
            {
                "question": "Thuế thu nhập cá nhân năm 2026 là bao nhiêu?",
                "expected": "should_refuse",
                "reason": "Không có thông tin về thuế TNCN"
            },
            {
                "question": "Quy định về hóa đơn điện tử như thế nào?",
                "expected": "should_refuse",
                "reason": "Không có thông tin về hóa đơn"
            },
            {
                "question": "Mức phạt vi phạm giao thông là bao nhiêu?",
                "expected": "should_refuse",
                "reason": "Không liên quan đến HR/lao động"
            }
        ]
    },
    {
        "category": "🎯 TRICKY - Câu hỏi gây nhầm lẫn",
        "questions": [
            {
                "question": "Lương tối thiểu vùng 1 năm 2027 là bao nhiêu?",
                "expected": "should_refuse",
                "reason": "Năm 2027 chưa có, không được bịa"
            },
            {
                "question": "Theo Nghị định 999/2026, quy định gì về OT?",
                "expected": "should_refuse",
                "reason": "Nghị định 999 không tồn tại"
            },
            {
                "question": "Elon Musk có được hưởng BHXH Việt Nam không?",
                "expected": "should_refuse",
                "reason": "Câu hỏi vô lý, không có trong DB"
            }
        ]
    }
]

def evaluate_answer(answer: str, expected: str) -> dict:
    """Đánh giá câu trả lời có đúng không"""
    answer_lower = answer.lower()
    
    # Các từ khóa chỉ "không có thông tin"
    refuse_keywords = [
        "không có thông tin",
        "không tìm thấy",
        "không chứa",
        "dữ liệu hiện tại không",
        "chưa có thông tin",
        "không có dữ liệu"
    ]
    
    is_refusing = any(keyword in answer_lower for keyword in refuse_keywords)
    
    if expected == "should_answer":
        # Phải có câu trả lời thực sự (không phải chỉ refuse)
        passed = not is_refusing and len(answer) > 100
        status = "✅ PASS" if passed else "❌ FAIL"
        note = "Có trả lời" if not is_refusing else "Không trả lời dù có trong DB"
        
    elif expected == "should_refuse":
        # Phải từ chối trả lời
        passed = is_refusing
        status = "✅ PASS" if passed else "❌ FAIL"
        note = "Từ chối đúng" if is_refusing else "⚠️ HALLUCINATION - Tự bịa thông tin!"
    
    else:
        passed = False
        status = "❓ UNKNOWN"
        note = "Không xác định"
    
    return {
        "passed": passed,
        "status": status,
        "note": note,
        "is_refusing": is_refusing,
        "answer_length": len(answer)
    }

def run_anti_hallucination_test():
    """Chạy test anti-hallucination"""
    
    print("=" * 80)
    print("🧪 ANTI-HALLUCINATION TEST")
    print("=" * 80)
    print("\nMục tiêu: Kiểm tra LLM có tự bịa thông tin hay không")
    print("- Câu hỏi CÓ trong DB → Phải trả lời")
    print("- Câu hỏi KHÔNG có trong DB → Phải nói 'không có thông tin'")
    print("=" * 80)
    
    # Initialize pipeline
    print("\n📦 Khởi tạo RAG pipeline...")
    try:
        pipeline = create_rag_pipeline(
            provider=LLMProvider.OLLAMA,
            model_name="llama3.2:latest"
        )
        print("   ✅ Pipeline sẵn sàng\n")
    except Exception as e:
        print(f"   ❌ Lỗi: {e}")
        return False
    
    # Statistics
    total_tests = 0
    passed_tests = 0
    failed_tests = 0
    hallucination_count = 0
    
    # Run tests
    for category_data in TEST_CASES:
        category = category_data["category"]
        questions = category_data["questions"]
        
        print("\n" + "=" * 80)
        print(f"📋 {category}")
        print("=" * 80)
        
        for i, test_case in enumerate(questions, 1):
            question = test_case["question"]
            expected = test_case["expected"]
            reason = test_case["reason"]
            
            total_tests += 1
            
            print(f"\n[Test {total_tests}] {question}")
            print(f"   Lý do: {reason}")
            print(f"   Mong đợi: {expected}")
            
            try:
                # Query
                result = pipeline.query(question)
                answer = result.get('answer', '')
                
                # Evaluate
                eval_result = evaluate_answer(answer, expected)
                
                print(f"   {eval_result['status']} - {eval_result['note']}")
                print(f"   Độ dài câu trả lời: {eval_result['answer_length']} ký tự")
                print(f"   Sources: {result.get('num_sources', 0)}")
                
                # Show partial answer
                if len(answer) > 0:
                    preview = answer[:200].replace('\n', ' ')
                    print(f"   Preview: {preview}...")
                
                # Update stats
                if eval_result['passed']:
                    passed_tests += 1
                else:
                    failed_tests += 1
                    if expected == "should_refuse" and not eval_result['is_refusing']:
                        hallucination_count += 1
                
            except Exception as e:
                print(f"   ❌ LỖI: {e}")
                failed_tests += 1
            
            # Small delay
            time.sleep(1)
    
    # Final report
    print("\n" + "=" * 80)
    print("📊 KẾT QUẢ TỔNG HỢP")
    print("=" * 80)
    print(f"\n✅ PASS:  {passed_tests}/{total_tests} ({passed_tests*100//total_tests}%)")
    print(f"❌ FAIL:  {failed_tests}/{total_tests} ({failed_tests*100//total_tests}%)")
    print(f"⚠️  HALLUCINATION: {hallucination_count} lần")
    
    if hallucination_count > 0:
        print(f"\n⚠️  CẢNH BÁO: Phát hiện {hallucination_count} lần LLM tự bịa thông tin!")
        print("   → Cần cải thiện prompt hoặc tăng penalty cho hallucination")
    
    if passed_tests == total_tests:
        print("\n🎉 XUẤT SẮC! Hệ thống KHÔNG hallucinate")
        return True
    elif passed_tests >= total_tests * 0.8:
        print("\n👍 TỐT! Hệ thống ổn nhưng còn cải thiện được")
        return True
    else:
        print("\n⚠️  CẦN CẢI THIỆN! Hệ thống có xu hướng hallucinate")
        return False

if __name__ == "__main__":
    try:
        print("\n⚠️  LƯU Ý: Trước khi chạy, hãy:")
        print("1. Kill Python processes: Get-Process python | Stop-Process -Force")
        print("2. Đảm bảo Ollama đang chạy")
        print("3. Có ít nhất 51 documents trong vector DB")
        
        input("\nNhấn Enter để bắt đầu test...")
        
        success = run_anti_hallucination_test()
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Test bị hủy bởi user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ LỖI: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
