"""
simple_index_fix.py - Index đơn giản với API Qdrant mới
"""

import sys
import os
import json
import time
from pathlib import Path
import uuid

sys.path.insert(0, os.path.dirname(__file__))

print("=" * 60)
print("SIMPLE INDEXING FIX FOR QDRANT")
print("=" * 60)

def index_single_chunk():
    """Index một chunk đơn giản"""
    
    print("\n1. Indexing single test chunk...")
    
    try:
        from embedder import create_vietnamese_embedder
        from qdrant_client import QdrantClient
        from qdrant_client.http import models
        
        # Tạo embedder
        embedder = create_vietnamese_embedder()
        
        # Tạo client
        client = QdrantClient(path="vector_db/qdrant_storage")
        
        # Đọc chunk từ JSONL
        jsonl_path = Path("processed_output/processed_knowledge_base.jsonl")
        with open(jsonl_path, 'r', encoding='utf-8') as f:
            first_line = f.readline().strip()
        
        if not first_line:
            print("   ❌ JSONL empty")
            return False
        
        chunk = json.loads(first_line)
        content = chunk.get("content", "")
        metadata = chunk.get("metadata", {})
        
        print(f"   📄 Chunk length: {len(content)} chars")
        print(f"   📋 Metadata keys: {list(metadata.keys())}")
        
        # Tạo embedding
        embedding = embedder.embed_text(content)
        print(f"   ✅ Embedding created: {embedding.shape}")
        
        # Tạo point với format đúng cho Qdrant mới
        point = models.PointStruct(
            id=1,  # ID đơn giản
            vector=embedding.tolist(),
            payload={
                "content": content,
                "metadata": metadata
            }
        )
        
        # Upsert với format đúng
        client.upsert(
            collection_name="legal_knowledge_base",
            points=[point]
        )
        
        print(f"   ✅ Point added to collection")
        
        # Kiểm tra
        result = client.retrieve(
            collection_name="legal_knowledge_base",
            ids=[1]
        )
        
        if result:
            print(f"   ✅ Point retrieved successfully")
            print(f"   📊 Collection now has data!")
            return True
        else:
            print(f"   ❌ Point not found after adding")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def index_multiple_chunks():
    """Index nhiều chunks"""
    
    print("\n2. Indexing multiple chunks...")
    
    try:
        from embedder import create_vietnamese_embedder
        from qdrant_client import QdrantClient
        from qdrant_client.http import models
        
        # Tạo embedder
        embedder = create_vietnamese_embedder()
        
        # Tạo client
        client = QdrantClient(path="vector_db/qdrant_storage")
        
        # Đọc JSONL
        jsonl_path = Path("processed_output/processed_knowledge_base.jsonl")
        with open(jsonl_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        print(f"   📄 Total chunks: {len(lines)}")
        
        # Lấy 5 chunks đầu tiên
        chunks_to_index = 5
        points = []
        
        for i in range(min(chunks_to_index, len(lines))):
            chunk = json.loads(lines[i])
            content = chunk.get("content", "")
            metadata = chunk.get("metadata", {})
            
            # Tạo embedding
            embedding = embedder.embed_text(content)
            
            # Tạo point
            point = models.PointStruct(
                id=i + 1,  # ID bắt đầu từ 1
                vector=embedding.tolist(),
                payload={
                    "content": content,
                    "metadata": metadata
                }
            )
            
            points.append(point)
            
            if (i + 1) % 2 == 0:
                print(f"   Processed {i + 1}/{chunks_to_index} chunks")
        
        # Upsert batch
        if points:
            client.upsert(
                collection_name="legal_knowledge_base",
                points=points
            )
            
            print(f"   ✅ Added {len(points)} points to collection")
            
            # Kiểm tra
            result = client.count(
                collection_name="legal_knowledge_base"
            )
            
            print(f"   📊 Collection count: {result.count} points")
            return True
        else:
            print(f"   ❌ No points to add")
            return False
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

def test_retrieval():
    """Test retrieval sau khi indexing"""
    
    print("\n3. Testing retrieval...")
    
    try:
        from embedder import create_vietnamese_embedder
        from qdrant_client import QdrantClient
        
        # Tạo embedder
        embedder = create_vietnamese_embedder()
        
        # Tạo client
        client = QdrantClient(path="vector_db/qdrant_storage")
        
        # Test query
        test_queries = [
            "nghỉ phép",
            "bảo hiểm xã hội",
            "lương"
        ]
        
        for query in test_queries:
            print(f"\n   Query: '{query}'")
            
            # Tạo embedding cho query
            query_embedding = embedder.embed_text(query)
            
            # Tìm kiếm
            search_result = client.search(
                collection_name="legal_knowledge_base",
                query_vector=query_embedding.tolist(),
                limit=3
            )
            
            print(f"   Found {len(search_result)} results")
            
            for i, hit in enumerate(search_result):
                payload = hit.payload or {}
                metadata = payload.get("metadata", {})
                
                title = metadata.get("title", "Unknown")
                article = metadata.get("article_number", "N/A")
                score = hit.score
                
                print(f"     {i+1}. {title} - Điều {article} (score: {score:.3f})")
                
                # Preview content
                content = payload.get("content", "")
                if content:
                    preview = content[:80] + "..." if len(content) > 80 else content
                    print(f"        {preview}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error testing retrieval: {e}")
        return False

def main():
    """Main function"""
    
    print("\n🔧 Starting indexing process...")
    
    # Đợi một chút để tránh lock
    time.sleep(1)
    
    # Bước 1: Index single chunk
    if not index_single_chunk():
        print("\n⚠️  Failed to index single chunk")
        return
    
    # Bước 2: Index multiple chunks
    if not index_multiple_chunks():
        print("\n⚠️  Failed to index multiple chunks")
        # Vẫn tiếp tục nếu single chunk thành công
    
    # Bước 3: Test retrieval
    if test_retrieval():
        print("\n" + "=" * 60)
        print("✅ SUCCESS! System is working!")
        print("=" * 60)
        
        print("\n🎯 System is now ready for:")
        print("1. Full testing: python retriever_demo.py")
        print("2. Chat test mode: python main_chat.py --test")
        print("3. With Ollama: python main_chat.py --provider ollama")
        
    else:
        print("\n" + "=" * 60)
        print("⚠️  Data indexed but retrieval needs testing")
        print("=" * 60)
        
        print("\n📋 Next steps:")
        print("1. Test with retriever_demo.py")
        print("2. Index all data: python main_phase2.py --keep-collection")
        print("3. Or continue with current data")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
    except Exception as e:
        print(f"\n💥 Error: {e}")
        import traceback
        traceback.print_exc()