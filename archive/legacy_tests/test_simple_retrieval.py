"""
test_simple_retrieval.py - Test retrieval đơn giản không có emoji
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

print("TEST SIMPLE RETRIEVAL")
print("=" * 50)

try:
    # Tắt metadata filtering
    from config_llm import LLMConfig
    LLMConfig.USE_METADATA_FILTERING = False
    
    from retriever_service import LegalRetrieverService
    
    print("Initializing retriever...")
    retriever = LegalRetrieverService()
    print("Retriever initialized successfully!")
    
    # Test queries
    test_queries = [
        "nghỉ phép năm",
        "bảo hiểm xã hội", 
        "hợp đồng lao động"
    ]
    
    for query in test_queries:
        print(f"\nQuery: '{query}'")
        documents = retriever.retrieve_documents(query, k=2)
        
        print(f"Found {len(documents)} documents:")
        for i, doc in enumerate(documents, 1):
            metadata = doc.metadata
            title = metadata.get("title", "Unknown")
            article = metadata.get("article_number", "N/A")
            verified = metadata.get("is_verified", True)
            score = metadata.get("score", 0.0)
            
            print(f"  {i}. {title} - Điều {article}")
            print(f"     Verified: {verified}, Score: {score:.3f}")
            
            # Preview content
            content = doc.page_content
            if len(content) > 100:
                content = content[:100] + "..."
            print(f"     Content: {content}")
    
    print("\n" + "=" * 50)
    print("RETRIEVAL TEST PASSED!")
    print("=" * 50)
    
except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
    
    print("\n" + "=" * 50)
    print("TROUBLESHOOTING:")
    print("1. Make sure Qdrant is not locked by another process")
    print("2. Check if vector_db/qdrant_storage exists")
    print("3. Try closing other Python processes")
    print("=" * 50)