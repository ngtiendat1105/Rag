"""
create_and_test_collection.py - Tạo collection mới và test đơn giản
"""

import sys
import os
import time
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))

print("=" * 60)
print("CREATE AND TEST COLLECTION")
print("=" * 60)

def wait_for_qdrant_unlock():
    """Đợi Qdrant unlock nếu bị lock"""
    print("\n1. Checking Qdrant lock status...")
    
    qdrant_path = Path("vector_db/qdrant_storage")
    lock_file = qdrant_path / "storage.lock"
    
    if lock_file.exists():
        print(f"   ⚠️  Lock file exists: {lock_file}")
        print("   ⚠️  Qdrant might be locked by another process")
        print("   💡 Try closing other Python processes or restarting terminal")
        return False
    else:
        print("   ✅ No lock file found")
        return True

def create_collection_if_not_exists():
    """Tạo collection nếu chưa tồn tại"""
    print("\n2. Creating/checking collection...")
    
    try:
        # Close any existing connections first
        time.sleep(1)
        
        from qdrant_client import QdrantClient
        from qdrant_client.http import models
        
        # Tạo client mới
        client = QdrantClient(path="vector_db/qdrant_storage")
        
        # Kiểm tra collections
        collections = client.get_collections()
        print(f"   Found {len(collections.collections)} collections")
        
        collection_name = "legal_knowledge_base"
        collection_exists = False
        
        for collection in collections.collections:
            print(f"   Collection: {collection.name}")
            if collection.name == collection_name:
                collection_exists = True
                break
        
        if collection_exists:
            print(f"   ✅ Collection '{collection_name}' already exists")
            
            # Kiểm dimension
            try:
                collection_info = client.get_collection(collection_name)
                dimension = collection_info.config.params.vectors.size
                print(f"   📏 Collection dimension: {dimension}")
                
                # Kiểm tra số điểm dữ liệu
                try:
                    result = client.scroll(
                        collection_name=collection_name,
                        limit=1,
                        with_payload=False,
                        with_vectors=False
                    )
                    points, _ = result
                    if points:
                        print(f"   📊 Collection has data: {len(points)}+ points")
                    else:
                        print(f"   ⚠️  Collection exists but EMPTY (no data)")
                except Exception as e:
                    print(f"   ⚠️  Cannot check collection data: {e}")
                    
            except Exception as e:
                print(f"   ⚠️  Cannot get collection info: {e}")
                
        else:
            print(f"   ❌ Collection '{collection_name}' does not exist")
            
            # Tạo collection mới
            print(f"   Creating collection '{collection_name}'...")
            
            # Lấy dimension từ embedder
            try:
                from embedder import create_vietnamese_embedder
                embedder = create_vietnamese_embedder()
                dimension = embedder.get_embedding_dimension()
                print(f"   📏 Using dimension from embedder: {dimension}")
            except:
                dimension = 768  # Fallback
                print(f"   📏 Using default dimension: {dimension}")
            
            client.create_collection(
                collection_name=collection_name,
                vectors_config=models.VectorParams(
                    size=dimension,
                    distance=models.Distance.COSINE
                )
            )
            
            print(f"   ✅ Collection '{collection_name}' created with dimension {dimension}")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        
        # Specific error for lock
        if "already accessed by another instance" in str(e):
            print("\n   ⚠️  Qdrant is LOCKED by another process!")
            print("   Please:")
            print("   1. Close all other Python processes")
            print("   2. Or restart your terminal/IDE")
            print("   3. Or wait a few minutes")
        
        return False

def test_simple_indexing():
    """Test indexing đơn giản"""
    print("\n3. Testing simple indexing...")
    
    try:
        # Đóng tất cả connections trước
        time.sleep(2)
        
        from embedder import create_vietnamese_embedder
        from qdrant_client import QdrantClient
        import json
        
        # Tạo embedder
        embedder = create_vietnamese_embedder()
        
        # Tạo client mới
        client = QdrantClient(path="vector_db/qdrant_storage")
        
        # Đọc một chunk từ JSONL
        jsonl_path = Path("processed_output/processed_knowledge_base.jsonl")
        if not jsonl_path.exists():
            print(f"   ❌ JSONL file not found: {jsonl_path}")
            return False
        
        with open(jsonl_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        if not lines:
            print(f"   ❌ JSONL file empty")
            return False
        
        # Lấy chunk đầu tiên
        chunk = json.loads(lines[0])
        content = chunk.get("content", "")
        metadata = chunk.get("metadata", {})
        
        print(f"   📄 Sample chunk: {len(content)} chars")
        print(f"   📋 Metadata: {list(metadata.keys())}")
        
        # Tạo embedding
        print(f"   Creating embedding...")
        embedding = embedder.embed_text(content)
        print(f"   ✅ Embedding created: {embedding.shape}")
        
        # Tạo payload
        payload = {
            "content": content,
            "metadata": metadata
        }
        
        # Thêm vào collection
        print(f"   Adding to collection...")
        client.upsert(
            collection_name="legal_knowledge_base",
            points=[
                {
                    "id": 1,  # ID đơn giản
                    "vector": embedding.tolist(),
                    "payload": payload
                }
            ]
        )
        
        print(f"   ✅ Successfully added 1 point to collection")
        
        # Kiểm tra lại
        result = client.scroll(
            collection_name="legal_knowledge_base",
            limit=5,
            with_payload=True,
            with_vectors=False
        )
        
        points, _ = result
        print(f"   📊 Collection now has {len(points)} points")
        
        if points:
            print(f"   ✅ Data successfully indexed!")
            return True
        else:
            print(f"   ❌ No data found after indexing")
            return False
            
    except Exception as e:
        print(f"   ❌ Error testing indexing: {e}")
        return False

def main():
    """Main function"""
    
    print("\n🔧 Setting up collection...")
    
    # Step 1: Check lock
    if not wait_for_qdrant_unlock():
        print("\n⚠️  Please close other processes and try again")
        return
    
    # Step 2: Create collection
    if not create_collection_if_not_exists():
        print("\n⚠️  Failed to create/check collection")
        return
    
    # Step 3: Test indexing
    if test_simple_indexing():
        print("\n" + "=" * 60)
        print("✅ SUCCESS! Collection ready with data")
        print("=" * 60)
        
        print("\n🎯 Next steps:")
        print("1. Test retrieval: python retriever_demo.py")
        print("2. Run test mode: python main_chat.py --test")
        print("3. Index all data: python main_phase2.py --keep-collection")
        
    else:
        print("\n" + "=" * 60)
        print("⚠️  PARTIAL SUCCESS - Collection exists but needs more data")
        print("=" * 60)
        
        print("\n📋 To index all data:")
        print("1. Close all Python processes")
        print("2. Run: python main_phase2.py --keep-collection")
        print("3. Or run: python indexer.py (for manual indexing)")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
    except Exception as e:
        print(f"\n💥 Error: {e}")
        import traceback
        traceback.print_exc()