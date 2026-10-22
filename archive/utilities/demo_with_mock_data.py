"""
demo_with_mock_data.py - Demo RAG system với mock data
Cho phép test ngay mà không cần vector database
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

print("=" * 60)
print("RAG SYSTEM DEMO WITH MOCK DATA")
print("=" * 60)

def demo_mock_rag():
    """Demo RAG system với mock data"""
    
    print("\n1. Loading system components...")
    
    try:
        from prompts import LegalPrompts
        from config_llm import LLMConfig, LLMProvider
        
        prompts = LegalPrompts()
        config = LLMConfig()
        
        print(f"   ✅ Prompt system loaded")
        print(f"   ✅ LLM config: {config.provider.value}")
        print(f"   ✅ Temperature: {config.temperature}")
        print(f"   ✅ Top K: {config.top_k}")
        
    except Exception as e:
        print(f"   ❌ Error loading components: {e}")
        return
    
    print("\n2. Mock RAG Pipeline Demo")
    print("   " + "-" * 40)
    
    # Mock documents từ các văn bản pháp lý
    mock_documents = [
        {
            "content": "Người lao động có đủ 12 tháng làm việc cho một người sử dụng lao động thì được nghỉ phép năm, hưởng nguyên lương theo hợp đồng lao động.",
            "metadata": {
                "title": "Bộ luật Lao động 2019",
                "article_number": "113",
                "section_number": "1",
                "is_verified": True
            }
        },
        {
            "content": "Thời gian nghỉ phép năm được tính theo năm làm việc và được người sử dụng lao động sắp xếp theo kế hoạch nghỉ phép năm sau khi thỏa thuận với người lao động.",
            "metadata": {
                "title": "Bộ luật Lao động 2019",
                "article_number": "114", 
                "section_number": "1",
                "is_verified": True
            }
        },
        {
            "content": "Bảo hiểm xã hội bắt buộc áp dụng đối với người lao động là công dân Việt Nam làm việc theo hợp đồng lao động không xác định thời hạn, hợp đồng lao động xác định thời hạn.",
            "metadata": {
                "title": "Luật Bảo hiểm xã hội 2024",
                "article_number": "2",
                "section_number": "1",
                "is_verified": True
            }
        },
        {
            "content": "Mức lương tối thiểu vùng do Chính phủ quy định và được điều chỉnh phù hợp với điều kiện kinh tế - xã hội và mức sống tối thiểu của người lao động.",
            "metadata": {
                "title": "Bộ luật Lao động 2019",
                "article_number": "91",
                "section_number": "1",
                "is_verified": True
            }
        }
    ]
    
    # Test questions
    test_questions = [
        "Điều kiện nghỉ phép năm là gì?",
        "Ai phải tham gia bảo hiểm xã hội bắt buộc?",
        "Mức lương tối thiểu được quy định thế nào?"
    ]
    
    for question in test_questions:
        print(f"\n   ❓ QUESTION: {question}")
        print("   " + "-" * 40)
        
        # Mock retrieval: chọn documents liên quan
        relevant_docs = []
        if "nghỉ phép" in question.lower():
            relevant_docs = [mock_documents[0], mock_documents[1]]
        elif "bảo hiểm" in question.lower():
            relevant_docs = [mock_documents[2]]
        elif "lương" in question.lower():
            relevant_docs = [mock_documents[3]]
        
        # Format context
        context = prompts.format_context_for_prompt(relevant_docs)
        
        # Show retrieved documents
        print(f"   📚 Retrieved {len(relevant_docs)} documents:")
        for i, doc in enumerate(relevant_docs, 1):
            metadata = doc["metadata"]
            citation = prompts.extract_citation_from_document(doc)
            print(f"     {i}. {citation}")
            print(f"        Verified: {metadata['is_verified']}")
            
            # Preview content
            content = doc["content"]
            if len(content) > 80:
                content = content[:80] + "..."
            print(f"        Content: {content}")
        
        # Mock LLM response
        print(f"\n   🤖 MOCK LLM RESPONSE:")
        
        if "nghỉ phép" in question.lower():
            response = """Dựa trên thông tin được cung cấp:

Người lao động được nghỉ phép năm khi có đủ 12 tháng làm việc cho một người sử dụng lao động, với nguyên lương theo hợp đồng lao động. Thời gian nghỉ phép được tính theo năm làm việc và được sắp xếp theo kế hoạch sau khi thỏa thuận giữa người sử dụng lao động và người lao động.

**Trích dẫn nguồn:**
- [Bộ luật Lao động 2019 - Điều 113 - Khoản 1]
- [Bộ luật Lao động 2019 - Điều 114 - Khoản 1]"""
        
        elif "bảo hiểm" in question.lower():
            response = """Dựa trên thông tin được cung cấp:

Bảo hiểm xã hội bắt buộc áp dụng đối với người lao động là công dân Việt Nam làm việc theo hợp đồng lao động, bao gồm cả hợp đồng không xác định thời hạn và hợp đồng xác định thời hạn.

**Trích dẫn nguồn:**
- [Luật Bảo hiểm xã hội 2024 - Điều 2 - Khoản 1]"""
        
        elif "lương" in question.lower():
            response = """Dựa trên thông tin được cung cấp:

Mức lương tối thiểu vùng do Chính phủ quy định và được điều chỉnh phù hợp với điều kiện kinh tế - xã hội và mức sống tối thiểu của người lao động.

**Trích dẫn nguồn:**
- [Bộ luật Lao động 2019 - Điều 91 - Khoản 1]"""
        
        else:
            response = "Dựa trên dữ liệu hiện có của hệ thống, không tìm thấy thông tin cụ thể về vấn đề này."
        
        # Print response with indentation
        for line in response.split('\n'):
            print(f"        {line}")
    
    print("\n3. System Features Demonstration")
    print("   " + "-" * 40)
    
    # Demo anti-hallucination warning
    print("\n   ⚠️  ANTI-HALLUCINATION FEATURE:")
    
    question_without_context = "Quy định về nghỉ thai sản?"
    print(f"   Question: {question_without_context}")
    
    # Mock: không có context
    mock_empty_context = []
    context = prompts.format_context_for_prompt(mock_empty_context)
    
    print(f"   Retrieved documents: {len(mock_empty_context)}")
    print(f"   Expected response: 'Dữ liệu hiện tại của hệ thống không chứa thông tin về vấn đề này.'")
    
    # Demo [ĐỐI CHIẾU] warning
    print("\n   ⚠️  [ĐỐI CHIẾU] WARNING FEATURE:")
    
    unverified_doc = {
        "content": "Theo một số ý kiến tham khảo [ĐỐI CHIẾU SỐ ĐIỀU], thời gian nghỉ phép có thể lên đến 15 ngày trong một số trường hợp đặc biệt.",
        "metadata": {
            "title": "Tài liệu tham khảo",
            "article_number": "N/A",
            "is_verified": False
        }
    }
    
    print(f"   Unverified document contains: '[ĐỐI CHIẾU SỐ ĐIỀU]'")
    print(f"   Metadata is_verified: {unverified_doc['metadata']['is_verified']}")
    print(f"   System sẽ thêm cảnh báo: '⚠️ LƯU Ý: Thông tin này chưa được kiểm chứng hoặc cần đối chiếu'")

def show_installation_guide():
    """Hiển thị hướng dẫn cài đặt đầy đủ"""
    print("\n" + "=" * 60)
    print("ĐỂ CHẠY HỆ THỐNG ĐẦY ĐỦ")
    print("=" * 60)
    
    print("\n📋 CÁC BƯỚC CẦN THỰC HIỆN:")
    
    print("\n1. Chạy Phase 2 - Tạo Vector Database:")
    print("   python main_phase2.py")
    print("   (Hoặc chạy từng bước: python embedder.py, python indexer.py)")
    
    print("\n2. Cài đặt Ollama (cho LLM local):")
    print("   - Download: https://ollama.com/download/windows")
    print("   - Chạy: ollama pull llama3.1:latest")
    
    print("\n3. Chạy hệ thống đầy đủ:")
    print("   python main_chat.py --provider ollama")
    
    print("\n4. Hoặc test với API keys (nếu có):")
    print("   python main_chat.py --provider openai")
    print("   python main_chat.py --provider gemini")
    
    print("\n" + "=" * 60)
    print("📊 HỆ THỐNG HIỆN TẠI")
    print("=" * 60)
    
    status = {
        "Phase 1 - Data Processing": "✅ Complete (4 legal docs)",
        "Phase 2 - Vector Database": "❌ Needs to run (no data)",
        "Phase 3 - RAG Pipeline": "✅ Complete (5 modules ready)",
        "Phase 4 - Evaluation": "✅ Complete (evaluation system ready)",
        "Embeddings Model": "✅ Ready",
        "Prompt System": "✅ Ready with anti-hallucination",
        "Citation Format": "✅ [Tên văn bản - Điều số - Khoản số]",
        "[ĐỐI CHIẾU] Warning": "✅ Implemented"
    }
    
    for item, stat in status.items():
        print(f"   {item}: {stat}")

if __name__ == "__main__":
    print("\n🎯 DEMO STARTING...")
    print("(Using mock data to show system capabilities)")
    
    try:
        demo_mock_rag()
        show_installation_guide()
        
        print("\n" + "=" * 60)
        print("✅ DEMO COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print("\nHệ thống RAG pháp lý đã được xây dựng với:")
        print("- 4 giai đoạn hoàn chỉnh")
        print("- Anti-hallucination rules")
        print("- [ĐỐI CHIẾU] warning system")
        print("- Source citation format")
        print("- 4 LLM providers support")
        
        print("\nChỉ cần chạy Phase 2 và cài đặt Ollama để có hệ thống hoàn chỉnh!")
        
    except KeyboardInterrupt:
        print("\n\nDemo interrupted by user")
    except Exception as e:
        print(f"\n💥 Error: {e}")
        import traceback
        traceback.print_exc()