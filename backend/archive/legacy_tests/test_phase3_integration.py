"""
Integration Test for Phase 3 RAG Pipeline
Test to verify all components work together correctly.
"""
import sys
import os
import logging
from typing import List, Dict, Any

# Thêm thư mục hiện tại vào path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config_llm import LLMConfig, LLMProvider
from rag_pipeline import create_rag_pipeline, RAGPipeline
from retriever_service import LegalRetrieverService as RetrieverService
from prompts import LegalPrompts
from langchain_core.messages import SystemMessage

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_config_llm():
    """Test LLM configuration."""
    print("🧪 Testing LLM Configuration...")
    
    try:
        # Test OpenAI config
        config_openai = LLMConfig(provider=LLMProvider.OPENAI)
        print(f"  ✅ OpenAI config: {config_openai.provider.value}")
        
        # Test Gemini config  
        config_gemini = LLMConfig(provider=LLMProvider.GOOGLE_GEMINI)
        print(f"  ✅ Gemini config: {config_gemini.provider.value}")
        
        # Test Ollama config
        config_ollama = LLMConfig(provider=LLMProvider.OLLAMA)
        print(f"  ✅ Ollama config: {config_ollama.provider.value}")
        
        # Test HuggingFace config
        config_hf = LLMConfig(provider=LLMProvider.HUGGINGFACE)
        print(f"  ✅ HuggingFace config: {config_hf.provider.value}")
        
        print("  ✅ All LLM configurations created successfully")
        return True
        
    except Exception as e:
        print(f"  ❌ LLM config test failed: {e}")
        return False


def test_prompt_manager():
    """Test prompt management."""
    print("\n🧪 Testing Prompt Manager...")
    
    try:
        manager = LegalPrompts()
        
        # Test system prompt (class method)
        system_message = manager.create_system_message()
        assert isinstance(system_message, SystemMessage)
        print(f"  ✅ System message created successfully")
        
        # Test system prompt template content
        assert "Chuyên gia Pháp chế Nhân sự" in manager.SYSTEM_PROMPT_TEMPLATE
        print(f"  ✅ System prompt contains 'Chuyên gia Pháp chế Nhân sự'")
        
        # Test anti-hallucination rules
        assert "QUY TẮC CHỐNG ẢO GIÁC" in manager.SYSTEM_PROMPT_TEMPLATE
        print(f"  ✅ System prompt contains anti-hallucination rules")
        
        # Test chat prompt creation
        chat_prompt = manager.create_chat_prompt()
        print(f"  ✅ Chat prompt template created")
        
        print("  ✅ Prompt manager test passed")
        return True
        
    except Exception as e:
        print(f"  ❌ Prompt manager test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_retriever_service():
    """Test retriever service."""
    print("\n🧪 Testing Retriever Service...")
    
    try:
        retriever = RetrieverService()
        
        # Test retrieval
        test_query = "nghỉ phép"
        docs = retriever.retrieve_with_metadata(test_query, k=2)
        
        print(f"  ✅ Retrieved {len(docs)} documents for query: '{test_query}'")
        
        if docs:
            doc = docs[0]
            metadata = doc.get("metadata", {})
            print(f"  ✅ Document metadata includes: {list(metadata.keys())}")
            
            # Check for required fields
            assert "document_name" in metadata
            assert "article" in metadata
            assert "chunk_id" in metadata
            
            print("  ✅ Document structure is correct")
        
        print("  ✅ Retriever service test passed")
        return True
        
    except Exception as e:
        print(f"  ❌ Retriever service test failed: {e}")
        return False


def test_rag_pipeline_simple():
    """Test RAG pipeline with simple queries."""
    print("\n🧪 Testing RAG Pipeline (Simple Queries)...")
    
    try:
        # Create pipeline with OpenAI (default)
        pipeline = create_rag_pipeline()
        print("  ✅ RAG pipeline created successfully")
        
        # Test queries
        test_queries = [
            "nghỉ phép năm",
            "bảo hiểm xã hội",
            "hợp đồng lao động"
        ]
        
        for query in test_queries:
            result = pipeline.query(query)
            
            print(f"  ✅ Query: '{query}'")
            print(f"     - Answer length: {len(result.get('answer', ''))} chars")
            print(f"     - Sources found: {result.get('num_sources', 0)}")
            print(f"     - Has warning: {result.get('has_warning', False)}")
            
            # Basic validation
            assert "answer" in result
            assert "sources" in result
            assert "has_warning" in result
        
        print("  ✅ RAG pipeline test passed")
        return True
        
    except Exception as e:
        print(f"  ❌ RAG pipeline test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_rag_pipeline_warning():
    """Test RAG pipeline warning handling."""
    print("\n🧪 Testing RAG Pipeline Warning Handling...")
    
    try:
        pipeline = create_rag_pipeline()
        
        # Query that might trigger warnings (based on data)
        # We'll try to find something with [ĐỐI CHIẾU] or unverified content
        test_queries = [
            "đối chiếu",
            "tham khảo",
            "chưa xác minh"
        ]
        
        for query in test_queries:
            result = pipeline.query(query)
            
            print(f"  ✅ Query: '{query}'")
            print(f"     - Has warning: {result.get('has_warning', False)}")
            
            if result.get("has_warning"):
                print(f"     ⚠️  Warning triggered as expected")
                
                # Check sources for unverified content
                sources = result.get("sources", [])
                unverified = [s for s in sources if not s.get("is_verified", True)]
                if unverified:
                    print(f"     - Found {len(unverified)} unverified sources")
        
        print("  ✅ Warning handling test completed")
        return True
        
    except Exception as e:
        print(f"  ❌ Warning handling test failed: {e}")
        return False


def test_main_chat_interface():
    """Test main chat interface."""
    print("\n🧪 Testing Main Chat Interface...")
    
    try:
        # Import and test LegalChatBot
        from main_chat import LegalChatBot, ChatMode
        
        # Create chatbot with no history saving for test
        chatbot = LegalChatBot(save_history=False)
        print("  ✅ LegalChatBot created successfully")
        
        # Test single query
        test_question = "Nghỉ phép năm được quy định thế nào?"
        result = chatbot.ask(test_question)
        
        print(f"  ✅ Test query: '{test_question}'")
        print(f"     - Answer received: {len(result.get('answer', '')) > 0}")
        print(f"     - Sources: {len(result.get('sources', []))}")
        
        # Test answer formatting
        formatted = chatbot._format_answer(result)
        print(f"  ✅ Answer formatting successful: {len(formatted)} chars")
        
        print("  ✅ Main chat interface test passed")
        return True
        
    except Exception as e:
        print(f"  ❌ Main chat interface test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_comprehensive_test():
    """Run all integration tests."""
    print("\n" + "="*60)
    print("🚀 COMPREHENSIVE INTEGRATION TEST - PHASE 3 RAG PIPELINE")
    print("="*60)
    
    test_results = []
    
    # Run all tests
    test_results.append(("LLM Configuration", test_config_llm()))
    test_results.append(("Prompt Manager", test_prompt_manager()))
    test_results.append(("Retriever Service", test_retriever_service()))
    test_results.append(("RAG Pipeline Simple", test_rag_pipeline_simple()))
    test_results.append(("RAG Pipeline Warning", test_rag_pipeline_warning()))
    test_results.append(("Main Chat Interface", test_main_chat_interface()))
    
    # Summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    
    passed = 0
    failed = 0
    
    for test_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"  {status} - {test_name}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print("\n" + "="*60)
    print(f"🏁 TOTAL: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 ALL TESTS PASSED! Phase 3 RAG pipeline is ready.")
    else:
        print(f"⚠️  {failed} test(s) failed. Please check the logs above.")
    
    print("="*60)
    
    return failed == 0


if __name__ == "__main__":
    print("Starting Phase 3 Integration Tests...")
    
    try:
        success = run_comprehensive_test()
        
        if success:
            print("\n💡 NEXT STEPS:")
            print("1. Run the main chat interface: python main_chat.py")
            print("2. Test with specific provider: python main_chat.py --provider gemini")
            print("3. Run batch processing: python main_chat.py --batch questions.txt")
            print("4. Run test mode: python main_chat.py --test")
        else:
            print("\n🔧 Debugging suggestions:")
            print("1. Check if Qdrant is running: python retriever_demo.py")
            print("2. Verify embeddings: python embedder.py")
            print("3. Check vector database: python vector_db_manager.py")
            
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n\n🛑 Tests interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)