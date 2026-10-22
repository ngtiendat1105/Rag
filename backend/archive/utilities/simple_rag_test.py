"""
Simple RAG Test - Test retrieval và context generation không cần LLM
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from retriever_service import LegalRetrieverService
import json

# Import from prompts
from prompts import LegalPrompts

# Create instance and get prompts
legal_prompts = LegalPrompts()
SYSTEM_PROMPT = legal_prompts.SYSTEM_PROMPT_TEMPLATE
FORMATTING_INSTRUCTIONS = """## 📝 FORMATTING INSTRUCTIONS:
1. Answer in Vietnamese
2. Use clear structure with bullet points when appropriate
3. Always cite sources at the end
4. Flag any [ĐỐI CHIẾU] warnings if present
5. If information is insufficient, state clearly"""

def test_retrieval_and_context():
    """Test retrieval và tạo context cho RAG"""
    
    print("🧪 Simple RAG Test - Retrieval và Context Generation")
    print("=" * 70)
    
    try:
        # Khởi tạo retriever
        print("🔄 Đang khởi tạo retriever service...")
        retriever = LegalRetrieverService()
        print("✅ Retriever initialized")
        
        # Test questions
        test_questions = [
            "hợp đồng lao động cần có những nội dung gì?",
            "thời gian thử việc tối đa là bao lâu?",
            "lương cơ sở hiện tại là bao nhiêu?"
        ]
        
        for i, question in enumerate(test_questions, 1):
            print(f"\n{'='*70}")
            print(f"Test {i}: '{question}'")
            print(f"{'='*70}")
            
            # Step 1: Retrieval
            print("\n1. 📚 Retrieving relevant contexts...")
            contexts = retriever.retrieve(question, k=3)
            
            if not contexts:
                print("   ❌ No contexts found")
                continue
            
            print(f"   ✅ Found {len(contexts)} contexts")
            
            # Step 2: Display contexts
            print("\n2. 📋 Retrieved contexts:")
            for j, context in enumerate(contexts, 1):
                metadata = context.get("metadata", {})
                print(f"\n   Context {j}:")
                print(f"   - Title: {metadata.get('title', 'N/A')}")
                print(f"   - Article: {metadata.get('article_number', 'N/A')}")
                print(f"   - Verified: {metadata.get('is_verified', 'N/A')}")
                print(f"   - Score: {context.get('score', 0):.4f}")
                
                # Show first 150 chars of content
                content = context.get("content", "")
                preview = content[:150] + "..." if len(content) > 150 else content
                print(f"   - Content: {preview}")
            
            # Step 3: Create RAG prompt
            print("\n3. 🤖 Creating RAG prompt...")
            
            # Format contexts for prompt
            context_texts = []
            for j, context in enumerate(contexts, 1):
                metadata = context.get("metadata", {})
                content = context.get("content", "")
                
                context_str = f"""
Context {j}:
- Document: {metadata.get('title', 'Unknown')}
- Article: {metadata.get('article_number', 'N/A')}
- Verified: {metadata.get('is_verified', 'N/A')}
- Effective Date: {metadata.get('effective_date', 'N/A')}
- Content: {content}
"""
                context_texts.append(context_str)
            
            all_contexts = "\n".join(context_texts)
            
            # Create full RAG prompt
            full_prompt = f"""
{SYSTEM_PROMPT}

{FORMATTING_INSTRUCTIONS}

QUESTION: {question}

RELEVANT LEGAL CONTEXTS:
{all_contexts}

INSTRUCTIONS:
1. Answer based ONLY on the provided legal contexts
2. If information is not in contexts, say "Không tìm thấy thông tin trong các văn bản được cung cấp"
3. Include citations to specific articles
4. Flag any [ĐỐI CHIẾU] warnings if present
5. Answer in Vietnamese

ANSWER:
"""
            
            print(f"   ✅ Prompt created ({len(full_prompt)} chars)")
            
            # Step 4: Show prompt structure
            print("\n4. 📝 Prompt structure:")
            print(f"   - System prompt: {len(LEGAL_SYSTEM_PROMPT)} chars")
            print(f"   - Formatting instructions: {len(FORMATTING_INSTRUCTIONS)} chars")
            print(f"   - Question: {len(question)} chars")
            print(f"   - Contexts: {len(all_contexts)} chars")
            print(f"   - Total: {len(full_prompt)} chars")
            
            # Step 5: Simulate RAG response (without LLM)
            print("\n5. 🎯 Simulated RAG response (template):")
            print("""
   Dựa trên các văn bản pháp luật được cung cấp:

   Theo Bộ luật Lao động 2019:
   - Điều 21: Hợp đồng lao động phải có các nội dung chủ yếu sau...
   - Điều 24: Quy định về thời gian thử việc...

   ⚠️ Lưu ý: Thông tin này chỉ dựa trên ngữ cảnh được cung cấp.
   Đối với thông tin chính xác, vui lòng tham khảo văn bản gốc.
""")
            
            # Save test data
            test_data = {
                "question": question,
                "contexts_found": len(contexts),
                "contexts": contexts,
                "prompt_length": len(full_prompt),
                "retrieval_successful": True
            }
            
            # Save to file
            output_file = f"test_result_{i}.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(test_data, f, ensure_ascii=False, indent=2)
            
            print(f"\n   💾 Test data saved to: {output_file}")
    
    except Exception as e:
        print(f"\n❌ Error during test: {e}")
        import traceback
        traceback.print_exc()

def check_system_status():
    """Kiểm tra trạng thái hệ thống"""
    print("\n🔍 System Status Check")
    print("-" * 50)
    
    # Check files
    required_files = [
        "config_phase2.py",
        "config_llm.py", 
        "embedder.py",
        "vector_db_manager.py",
        "retriever_service.py",
        "rag_pipeline.py",
        "prompts.py"
    ]
    
    for file in required_files:
        if os.path.exists(file):
            print(f"✅ {file}")
        else:
            print(f"❌ {file} (missing)")
    
    # Check vector DB
    vector_db_path = "vector_db/qdrant_storage"
    if os.path.exists(vector_db_path):
        print(f"✅ Vector DB: {vector_db_path}")
    else:
        print(f"❌ Vector DB not found: {vector_db_path}")
    
    print("-" * 50)

if __name__ == "__main__":
    print("🚀 Simple RAG Testing Tool")
    print("=" * 70)
    
    # Check system
    check_system_status()
    
    # Run tests
    test_retrieval_and_context()
    
    print("\n" + "=" * 70)
    print("✅ Test completed!")
    print("\n📋 Next steps to complete RAG testing:")
    print("1. Install Ollama: https://ollama.com/")
    print("2. Pull a model: `ollama pull llama3.2:3b`")
    print("3. Run full RAG: `python main_chat.py --provider ollama`")
    print("=" * 70)