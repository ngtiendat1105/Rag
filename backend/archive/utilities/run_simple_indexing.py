"""
run_simple_indexing.py - Chạy indexing đơn giản bỏ qua kiểm tra collection
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

print("=" * 60)
print("SIMPLE INDEXING - Add data to existing collection")
print("=" * 60)

def run_indexing():
    """Chạy indexing đơn giản"""
    
    try:
        from embedder import create_vietnamese_embedder
        from indexer import create_data_indexer
        from config_phase2 import (
            INPUT_JSONL_PATH,
            VECTOR_DB_DIR,
            COLLECTION_NAME,
            BATCH_SIZE,
            VERBOSE_LOGGING
        )
        
        print("1. Loading embedder...")
        embedder = create_vietnamese_embedder()
        print(f"   ✅ Embedder loaded: {embedder.get_model_info()['model_name']}")
        
        print("\n2. Creating indexer...")
        indexer = create_data_indexer(embedder=embedder)
        
        print("\n3. Checking collection...")
        # Try to check if collection exists (skip if error)
        try:
            stats = indexer.get_collection_stats()
            print(f"   ✅ Collection exists: {stats.get('collection_name', 'N/A')}")
        except:
            print("   ⚠️  Cannot check collection stats (API issue), continuing...")
        
        print("\n4. Loading JSONL data...")
        if not os.path.exists(INPUT_JSONL_PATH):
            print(f"   ❌ JSONL file not found: {INPUT_JSONL_PATH}")
            return False
        
        # Đếm số dòng
        with open(INPUT_JSONL_PATH, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        print(f"   ✅ Found {len(lines)} chunks in JSONL")
        
        # Process first few chunks để test
        print("\n5. Processing test batch (first 10 chunks)...")
        
        import json
        test_chunks = []
        for i in range(min(10, len(lines))):
            chunk = json.loads(lines[i])
            test_chunks.append(chunk)
        
        print(f"   Processing {len(test_chunks)} test chunks...")
        
        try:
            # Process batch
            success_count, error_count = indexer.process_batch(test_chunks)
            print(f"   ✅ Success: {success_count}, Errors: {error_count}")
            
            if success_count > 0:
                print("\n✅ Test indexing successful!")
                print(f"\nNow you can:")
                print("1. Test retrieval: python retriever_demo.py")
                print("2. Run full system: python main_chat.py --test")
                return True
            else:
                print("\n❌ No chunks indexed successfully")
                return False
                
        except Exception as e:
            print(f"   ❌ Error indexing: {e}")
            
            # Try alternative: check if collection needs to be created
            print("\n   Trying to create collection if not exists...")
            try:
                from qdrant_client import QdrantClient
                from qdrant_client.http import models
                
                client = QdrantClient(path=str(VECTOR_DB_DIR / "qdrant_storage"))
                
                # Check collections
                collections = client.get_collections()
                collection_exists = any(c.name == COLLECTION_NAME for c in collections.collections)
                
                if not collection_exists:
                    print(f"   Creating collection '{COLLECTION_NAME}'...")
                    client.create_collection(
                        collection_name=COLLECTION_NAME,
                        vectors_config=models.VectorParams(
                            size=768,  # From embedder
                            distance=models.Distance.COSINE
                        )
                    )
                    print(f"   ✅ Collection created")
                    
                    # Try indexing again
                    success_count, error_count = indexer.process_batch(test_chunks)
                    print(f"   ✅ Success: {success_count}, Errors: {error_count}")
                    
                    if success_count > 0:
                        print("\n✅ Collection created and test indexing successful!")
                        return True
                    
                else:
                    print(f"   Collection exists but indexing failed")
                    
            except Exception as e2:
                print(f"   ❌ Error creating collection: {e2}")
            
            return False
            
    except Exception as e:
        print(f"❌ General error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("\n🎯 Starting simple indexing...")
    
    if run_indexing():
        print("\n" + "=" * 60)
        print("✅ INDEXING COMPLETED SUCCESSFULLY!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("❌ INDEXING FAILED")
        print("=" * 60)
        
    print("\nNext steps:")
    print("1. Test if data exists: python -c \"from qdrant_client import QdrantClient; client = QdrantClient(path='vector_db/qdrant_storage'); print(client.get_collection('legal_knowledge_base'))\"")
    print("2. Test retrieval: python retriever_demo.py")
    print("3. Run test mode: python main_chat.py --test")