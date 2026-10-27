"""
test_single_query.py - Test single query through RAG pipeline
Simplified test without emojis for Windows console
"""

import sys
import os
import pytest
sys.path.insert(0, os.path.dirname(__file__))

from config_llm import LLMConfig, LLMProvider
from rag_pipeline import create_rag_pipeline

@pytest.mark.integration
@pytest.mark.skipif(
    os.getenv("RUN_LIVE_RAG_TESTS") != "1",
    reason="requires Ollama, embeddings, and a local Qdrant index",
)
def test_single_query():
    """Test a single query through the RAG pipeline"""
    
    print("=" * 70)
    print("TESTING SINGLE QUERY THROUGH RAG PIPELINE")
    print("=" * 70)
    
    # Initialize RAG pipeline with Ollama
    print("\n1. Initializing RAG pipeline with Ollama...")
    try:
        pipeline = create_rag_pipeline(provider=LLMProvider.OLLAMA, model_name="llama3.2:latest")
        print("   OK - RAG pipeline initialized")
    except Exception as e:
        print(f"   ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Test query
    print("\n2. Testing query...")
    test_question = "Hợp đồng lao động phải có những nội dung chủ yếu nào?"
    
    print(f"   Question: {test_question}")
    
    try:
        result = pipeline.query(test_question)
        
        print(f"\n   Status: {'SUCCESS' if 'error' not in result else 'FAILED'}")
        
        if 'error' in result:
            print(f"   Error: {result['error']}")
            return False
        
        print(f"   Answer length: {len(result.get('answer', ''))} chars")
        print(f"   Sources found: {result.get('num_sources', 0)}")
        print(f"   Has warning: {result.get('has_warning', False)}")
        
        print(f"\n3. Answer:")
        print("   " + "-" * 66)
        answer = result.get('answer', '')
        for line in answer.split('\n')[:15]:  # First 15 lines
            print(f"   {line}")
        
        if len(answer.split('\n')) > 15:
            print(f"   ... ({len(answer.split('\n')) - 15} more lines)")
        
        print("   " + "-" * 66)
        
        print(f"\n4. Sources:")
        for i, source in enumerate(result.get('sources', [])[:3], 1):
            doc = source.get('document', 'Unknown')
            article = source.get('article', 'N/A')
            print(f"   {i}. {doc} - Article {article}")
        
        print("\n" + "=" * 70)
        print("TEST COMPLETED SUCCESSFULLY")
        print("=" * 70)
        return True
        
    except Exception as e:
        print(f"\n   ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    try:
        success = test_single_query()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\nFATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
