"""
test_rag_complete.py - Complete RAG system test with Ollama
Tests: retrieval → ranking → LLM response generation
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from pathlib import Path
from embedder import create_vietnamese_embedder
from qdrant_client import QdrantClient
from config_phase2 import COLLECTION_NAME
from langchain_ollama import ChatOllama
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage, SystemMessage
import time

def retrieve_context(query_text: str, embedder, client, top_k=3):
    """Retrieve relevant context from vector DB"""
    
    # Embed query
    query_embedding = embedder.embed_text(query_text)
    
    # Search Qdrant
    results = client.query_points(
        collection_name=COLLECTION_NAME,
        query=query_embedding.tolist(),
        limit=top_k,
        with_payload=True,
        with_vectors=False
    )
    
    # Format context
    documents = []
    for hit in results.points:
        payload = hit.payload or {}
        doc = Document(
            page_content=payload.get('content', ''),
            metadata={
                'score': hit.score,
                'document': payload.get('document', ''),
                'chunk_index': payload.get('chunk_index', 0)
            }
        )
        documents.append(doc)
    
    return documents

def format_context(documents):
    """Format documents into context string"""
    
    context_parts = []
    for i, doc in enumerate(documents, 1):
        context_parts.append(f"[Tài liệu {i}] (độ liên quan: {doc.metadata['score']:.2%})")
        context_parts.append(doc.page_content)
        context_parts.append("")
    
    return "\n".join(context_parts)

def generate_response(query: str, context: str, llm):
    """Generate RAG response using LLM"""
    
    system_prompt = """Bạn là một trợ lý pháp lý chuyên về luật lao động Việt Nam.
Dựa trên các tài liệu được cung cấp, hãy trả lời câu hỏi của người dùng.
- Hãy chính xác và trích dẫn từ tài liệu
- Nếu thông tin không có trong tài liệu, hãy nói rõ
- Luôn sử dụng tiếng Việt"""
    
    user_prompt = f"""Dựa trên các tài liệu sau:

{context}

Hãy trả lời câu hỏi: {query}"""
    
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ]
    
    response = llm.invoke(messages)
    return response.content

def test_rag_pipeline():
    """Test complete RAG pipeline"""
    
    print("=" * 80)
    print("TESTING COMPLETE RAG PIPELINE")
    print("=" * 80)
    
    # 1. Initialize components
    print("\n1. Initializing components...")
    
    embedder = create_vietnamese_embedder()
    print("   ✅ Embedder loaded")
    
    qdrant_path = Path(__file__).parent / "vector_db" / "qdrant_storage"
    client = QdrantClient(path=str(qdrant_path))
    count = client.count(collection_name=COLLECTION_NAME)
    print(f"   ✅ Qdrant connected ({count.count} documents)")
    
    # Initialize Ollama LLM
    print("\n2. Connecting to Ollama...")
    try:
        llm = ChatOllama(
            model="llama3.2:latest",
            base_url="http://localhost:11434",
            temperature=0.7,
            top_p=0.9,
            timeout=120
        )
        print("   ✅ Ollama LLM initialized (model: llama3.2:latest)")
    except Exception as e:
        print(f"   ❌ Failed to connect to Ollama: {e}")
        print("   Make sure Ollama is running: ollama serve")
        return False
    
    # 3. Test queries
    test_queries = [
        {
            "query": "Hợp đồng lao động phải có những nội dung chủ yếu nào?",
            "category": "Hợp đồng lao động"
        },
        {
            "query": "Thời gian thử việc tối đa là bao lâu?",
            "category": "Thử việc"
        },
        {
            "query": "Người tham gia bảo hiểm xã hội bắt buộc gồm những ai?",
            "category": "Bảo hiểm xã hội"
        }
    ]
    
    print("\n3. Running RAG test queries:")
    print("=" * 80)
    
    results = []
    
    for i, test_case in enumerate(test_queries, 1):
        query = test_case["query"]
        category = test_case["category"]
        
        print(f"\n📝 Query {i}: [{category}]")
        print(f"   Q: {query}")
        
        try:
            # Retrieve
            print(f"   ⏳ Retrieving context...")
            start_retrieval = time.time()
            documents = retrieve_context(query, embedder, client, top_k=3)
            retrieval_time = time.time() - start_retrieval
            print(f"   ✅ Retrieved {len(documents)} documents ({retrieval_time:.2f}s)")
            
            # Format context
            context = format_context(documents)
            
            # Generate response
            print(f"   ⏳ Generating response with Ollama...")
            start_generation = time.time()
            response = generate_response(query, context, llm)
            generation_time = time.time() - start_generation
            print(f"   ✅ Response generated ({generation_time:.2f}s)")
            
            # Display response
            print(f"\n   📄 Response:")
            response_lines = response.split('\n')
            for line in response_lines[:10]:  # Show first 10 lines
                print(f"       {line}")
            
            if len(response_lines) > 10:
                print(f"       ... [+{len(response_lines)-10} more lines]")
            
            # Store result
            results.append({
                "query": query,
                "success": True,
                "retrieval_time": retrieval_time,
                "generation_time": generation_time,
                "documents_retrieved": len(documents),
                "response": response[:200] + "..." if len(response) > 200 else response
            })
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            results.append({
                "query": query,
                "success": False,
                "error": str(e)
            })
    
    # 4. Summary
    print("\n" + "=" * 80)
    print("📊 TEST SUMMARY")
    print("=" * 80)
    
    successful = sum(1 for r in results if r.get("success", False))
    total = len(results)
    
    print(f"\n✅ Successful: {successful}/{total}")
    
    for i, result in enumerate(results, 1):
        status = "✓" if result.get("success") else "✗"
        print(f"\n{status} Query {i}: {result['query'][:60]}...")
        
        if result.get("success"):
            print(f"  Retrieval: {result['retrieval_time']:.2f}s, "
                  f"Generation: {result['generation_time']:.2f}s, "
                  f"Docs: {result['documents_retrieved']}")
        else:
            print(f"  Error: {result.get('error', 'Unknown')}")
    
    # Close connections
    client.close()
    
    print("\n" + "=" * 80)
    if successful == total:
        print("✅ ALL TESTS PASSED!")
        print("\nNext steps:")
        print("1. Run main_chat.py for interactive testing")
        print("2. Adjust LLM parameters if needed")
        return True
    else:
        print(f"⚠️  {total - successful} test(s) failed")
        return False

if __name__ == "__main__":
    try:
        success = test_rag_pipeline()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
