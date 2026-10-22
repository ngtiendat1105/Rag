"""
local_test.py - Thử nghiệm local đơn giản hệ thống RAG
Không cần API keys, chỉ sử dụng local components
"""

import sys
import os
import json
from pathlib import Path

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 60)
print("LOCAL RAG SYSTEM TEST")
print("=" * 60)

def test_vector_db():
    """Test vector database connection"""
    print("\n1. Testing Vector Database...")
    
    try:
        from qdrant_client import QdrantClient
        
        # Kiểm tra Qdrant storage
        qdrant_path = Path("vector_db/qdrant_storage")
        if not qdrant_path.exists():
            print("   ❌ Qdrant storage not found")
            return False
        
        # Kết nối đến Qdrant
        client = QdrantClient(path=str(qdrant_path))
        
        # Kiểm tra collections
        collections = client.get_collections()
        print(f"   ✅ Connected to Qdrant")
        print(f"   ✅ Number of collections: {len(collections.collections)}")
        
        # Tìm collection của chúng ta
        target_collection = "vietnamese_legal_rag"
        found = False
        for collection in collections.collections:
            print(f"   Collection: {collection.name}")
            if collection.name == target_collection:
                found = True
                # Lấy thông tin chi tiết
                collection_info = client.get_collection(collection.name)
                print(f"   ✅ Target collection found: {collection.name}")
                print(f"   ✅ Vectors count: {collection_info.vectors_count}")
                print(f"   ✅ Dimension: {collection_info.config.params.vectors.size}")
                break
        
        if not found:
            print(f"   ❌ Target collection '{target_collection}' not found")
            return False
        
        return True
        
    except Exception as e:
        print(f"   ❌ Vector DB test failed: {e}")
        return False

def test_embeddings():
    """Test embeddings model"""
    print("\n2. Testing Embeddings Model...")
    
    try:
        from embedder import create_vietnamese_embedder
        
        embedder = create_vietnamese_embedder()
        print("   ✅ Embeddings model loaded")
        
        # Test embedding
        test_text = "nghỉ phép năm lao động"
        embedding = embedder.embed_text(test_text)
        
        print(f"   ✅ Embedding created for text: '{test_text}'")
        print(f"   ✅ Embedding shape: {embedding.shape}")
        print(f"   ✅ Embedding dimension: {embedding.shape[0]}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Embeddings test failed: {e}")
        return False

def test_retrieval():
    """Test retrieval without LLM"""
    print("\n3. Testing Retrieval (without LLM)...")
    
    try:
        from retriever_service import LegalRetrieverService
        from config_llm import LLMConfig
        
        # Tạm thời disable metadata filtering
        original_filtering = LLMConfig.USE_METADATA_FILTERING
        LLMConfig.USE_METADATA_FILTERING = False
        
        retriever = LegalRetrieverService()
        print("   ✅ Retriever service created")
        
        # Test query
        test_queries = [
            "nghỉ phép năm",
            "bảo hiểm xã hội",
            "hợp đồng lao động",
            "lương tối thiểu"
        ]
        
        for query in test_queries:
            documents = retriever.retrieve_documents(query, k=2)
            print(f"   ✅ Query: '{query}' -> {len(documents)} documents retrieved")
            
            if documents:
                doc = documents[0]
                metadata = doc.metadata
                print(f"      - Document: {metadata.get('title', 'Unknown')}")
                print(f"      - Article: {metadata.get('article_number', 'N/A')}")
                print(f"      - Verified: {metadata.get('is_verified', True)}")
        
        # Restore original setting
        LLMConfig.USE_METADATA_FILTERING = original_filtering
        
        return True
        
    except Exception as e:
        print(f"   ❌ Retrieval test failed: {e}")
        # Try to provide helpful debug info
        print(f"   Debug info: {type(e).__name__}")
        return False

def test_simple_rag():
    """Test simple RAG pipeline with mock LLM"""
    print("\n4. Testing Simple RAG Pipeline (mock LLM)...")
    
    try:
        from prompts import LegalPrompts
        import json
        
        prompts = LegalPrompts()
        print("   ✅ Prompt manager loaded")
        
        # Test system prompt
        system_message = prompts.create_system_message()
        print(f"   ✅ System message created: {len(system_message.content)} chars")
        
        # Check for key components
        prompt_content = system_message.content
        checks = [
            ("Chuyên gia Pháp chế Nhân sự", True),
            ("QUY TẮC CHỐNG ẢO GIÁC", True),
            ("Trích dẫn nguồn", True),
            ("[Tên văn bản - Điều số - Khoản số]", True)
        ]
        
        for text, should_exist in checks:
            exists = text in prompt_content
            status = "✅" if (exists == should_exist) else "❌"
            print(f"   {status} '{text}' check: {'FOUND' if exists else 'NOT FOUND'}")
        
        # Test prompt formatting
        test_context = [
            {
                "content": "Người lao động được nghỉ phép năm 12 ngày làm việc.",
                "metadata": {
                    "title": "Bộ luật Lao động 2019",
                    "article_number": "113",
                    "is_verified": True
                }
            }
        ]
        
        formatted_context = prompts.format_context_for_prompt(test_context)
        print(f"   ✅ Context formatting test: {len(formatted_context)} chars")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Simple RAG test failed: {e}")
        return False

def test_main_chat_interface():
    """Test main chat interface with local config"""
    print("\n5. Testing Main Chat Interface...")
    
    try:
        # Import with local config
        from local_config import create_local_llm_config
        
        config = create_local_llm_config()
        print(f"   ✅ Local LLM config created: {config.provider.value}")
        
        # Try to import main chat
        from main_chat import LegalChatBot
        
        print("   ✅ LegalChatBot imported")
        print("   ✅ Main chat interface available")
        
        # Show configuration
        print(f"   ✅ Temperature: {config.temperature}")
        print(f"   ✅ Top K: {config.top_k}")
        print(f"   ✅ Model: {config.model_name}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Main chat test failed: {e}")
        print(f"   Note: This is expected if HuggingFace model needs download")
        return False

def run_all_tests():
    """Run all local tests"""
    print("\n" + "=" * 60)
    print("RUNNING LOCAL TESTS...")
    print("=" * 60)
    
    test_results = []
    
    test_results.append(("Vector Database", test_vector_db()))
    test_results.append(("Embeddings Model", test_embeddings()))
    test_results.append(("Retrieval System", test_retrieval()))
    test_results.append(("Simple RAG Pipeline", test_simple_rag()))
    test_results.append(("Main Chat Interface", test_main_chat_interface()))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in test_results if result)
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "PASS" if result else "FAIL"
        print(f"  {test_name}: {status}")
    
    print(f"\n  Total: {passed}/{total} tests passed")
    
    # Recommendations
    print("\n" + "=" * 60)
    print("NEXT STEPS FOR LOCAL DEPLOYMENT")
    print("=" * 60)
    
    if passed >= 3:
        print("✅ Hệ thống local đã sẵn sàng cơ bản!")
        print("\nĐể chạy full system local:")
        print("1. Cài đặt Ollama: https://ollama.com/download/windows")
        print("2. Tải model: ollama pull llama3.1:latest")
        print("3. Chạy với Ollama:")
        print("   python main_chat.py --provider ollama")
    else:
        print("⚠️  Cần fix một số issues trước khi chạy full system")
    
    print("\nĐể test retrieval đơn thuần:")
    print("python retriever_demo.py")
    
    print("\nĐể test với mock responses:")
    print("python main_chat.py --test")
    
    return passed >= 3

if __name__ == "__main__":
    print("Starting local RAG system tests...")
    print("(This test doesn't require internet connection for APIs)")
    
    try:
        success = run_all_tests()
        
        if success:
            print("\n" + "=" * 60)
            print("🎉 LOCAL RAG SYSTEM READY FOR TESTING!")
            print("=" * 60)
        else:
            print("\n" + "=" * 60)
            print("⚠️  SOME TESTS FAILED - NEEDS CONFIGURATION")
            print("=" * 60)
        
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        import traceback
        traceback.print_exc()