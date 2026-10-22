"""
fix_dimension_issue.py - Fix dimension mismatch between collection and embeddings model
"""

import sys
import os
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))

print("=" * 60)
print("FIX DIMENSION MISMATCH ISSUE")
print("=" * 60)

def check_current_situation():
    """Kiểm tra tình trạng hiện tại"""
    print("\n1. Checking current situation...")
    
    try:
        from qdrant_client import QdrantClient
        
        # Kiểm tra Qdrant
        qdrant_path = Path("vector_db/qdrant_storage")
        if not qdrant_path.exists():
            print("   ❌ Qdrant storage not found")
            return None
        
        client = QdrantClient(path=str(qdrant_path))
        
        # Kiểm tra collection
        collections = client.get_collections()
        if not collections.collections:
            print("   ❌ No collections found")
            return None
        
        collection_name = "legal_knowledge_base"
        collection_exists = False
        
        for collection in collections.collections:
            if collection.name == collection_name:
                collection_exists = True
                collection_info = client.get_collection(collection_name)
                print(f"   ✅ Collection '{collection_name}' exists")
                print(f"   📏 Current dimension: {collection_info.config.params.vectors.size}")
                break
        
        if not collection_exists:
            print(f"   ❌ Collection '{collection_name}' not found")
            return None
        
        return client, collection_name
        
    except Exception as e:
        print(f"   ❌ Error checking: {e}")
        return None

def check_embeddings_model():
    """Kiểm tra embeddings model dimension"""
    print("\n2. Checking embeddings model...")
    
    try:
        from embedder import create_vietnamese_embedder
        
        embedder = create_vietnamese_embedder()
        model_info = embedder.get_model_info()
        
        print(f"   ✅ Embeddings model: {model_info['model_name']}")
        print(f"   📏 Model dimension: {model_info['embedding_dimension']}")
        
        return model_info['embedding_dimension']
        
    except Exception as e:
        print(f"   ❌ Error checking embeddings: {e}")
        return None

def fix_dimension_mismatch(client, collection_name, target_dimension=768):
    """Fix dimension mismatch"""
    print(f"\n3. Fixing dimension mismatch (target: {target_dimension})...")
    
    try:
        from qdrant_client.http import models
        
        # Lấy thông tin collection hiện tại
        collection_info = client.get_collection(collection_name)
        current_dimension = collection_info.config.params.vectors.size
        
        if current_dimension == target_dimension:
            print(f"   ✅ Dimension already correct: {current_dimension}")
            return True
        
        print(f"   ⚠️  Dimension mismatch: {current_dimension} != {target_dimension}")
        
        # Kiểm tra nếu collection có dữ liệu
        try:
            points = client.scroll(
                collection_name=collection_name,
                limit=1,
                with_payload=False,
                with_vectors=False
            )
            
            if points[0]:  # Có dữ liệu
                print(f"   ⚠️  Collection has data. Need to recreate...")
                
                # Tạo collection tạm thời
                temp_collection = f"{collection_name}_temp"
                
                print(f"   Creating temporary collection '{temp_collection}'...")
                client.create_collection(
                    collection_name=temp_collection,
                    vectors_config=models.VectorParams(
                        size=target_dimension,
                        distance=models.Distance.COSINE
                    )
                )
                
                print(f"   ✅ Temporary collection created")
                print(f"   ℹ️  Please re-run Phase 2 indexing")
                print(f"   ℹ️  Then delete old collection: {collection_name}")
                
                return False
                
            else:  # Collection trống
                print(f"   Collection is empty. Recreating...")
                
                # Xóa collection cũ
                client.delete_collection(collection_name)
                print(f"   ✅ Deleted old collection")
                
                # Tạo collection mới với dimension đúng
                client.create_collection(
                    collection_name=collection_name,
                    vectors_config=models.VectorParams(
                        size=target_dimension,
                        distance=models.Distance.COSINE
                    )
                )
                
                print(f"   ✅ Created new collection with dimension {target_dimension}")
                return True
                
        except Exception as e:
            print(f"   ❌ Error checking collection data: {e}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error fixing dimension: {e}")
        return False

def create_fresh_collection():
    """Tạo collection mới hoàn toàn"""
    print("\n4. Creating fresh collection...")
    
    try:
        from qdrant_client import QdrantClient
        from qdrant_client.http import models
        from embedder import create_vietnamese_embedder
        
        # Lấy dimension từ embedder
        embedder = create_vietnamese_embedder()
        target_dimension = embedder.get_embedding_dimension()
        
        print(f"   Target dimension from embedder: {target_dimension}")
        
        # Kết nối Qdrant
        client = QdrantClient(path="vector_db/qdrant_storage")
        collection_name = "legal_knowledge_base"
        
        # Xóa collection cũ nếu tồn tại
        try:
            client.delete_collection(collection_name)
            print(f"   ✅ Deleted old collection")
        except:
            print(f"   ℹ️  Old collection not found or already deleted")
        
        # Tạo collection mới
        client.create_collection(
            collection_name=collection_name,
            vectors_config=models.VectorParams(
                size=target_dimension,
                distance=models.Distance.COSINE
            )
        )
        
        print(f"   ✅ Created fresh collection '{collection_name}'")
        print(f"   ✅ Dimension: {target_dimension}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error creating fresh collection: {e}")
        return False

def main():
    """Main function"""
    
    # Kiểm tra hiện trạng
    result = check_current_situation()
    if not result:
        print("\n⚠️  Cannot check current situation. Creating fresh collection...")
        if create_fresh_collection():
            print("\n✅ Please run Phase 2 indexing now:")
            print("   python main_phase2.py")
        return
    
    client, collection_name = result
    
    # Kiểm tra embeddings model
    target_dimension = check_embeddings_model()
    if not target_dimension:
        print("\n⚠️  Cannot get embeddings dimension")
        return
    
    # Fix dimension mismatch
    if fix_dimension_mismatch(client, collection_name, target_dimension):
        print("\n✅ Dimension fixed!")
        print("\n📋 Next steps:")
        print("   1. Run Phase 2 indexing: python main_phase2.py")
        print("   2. Test retrieval: python retriever_demo.py")
        print("   3. Run full system: python main_chat.py --test")
    else:
        print("\n⚠️  Manual action required")
        print("\n📋 To fix completely:")
        print("   1. Delete old collection if exists")
        print("   2. Create new collection with correct dimension")
        print("   3. Run Phase 2 indexing: python main_phase2.py")
        
        # Offer to create fresh collection
        print("\n❓ Do you want me to create a fresh collection? (y/n)")
        response = input().strip().lower()
        
        if response == 'y':
            if create_fresh_collection():
                print("\n✅ Fresh collection created!")
                print("   Now run: python main_phase2.py")

if __name__ == "__main__":
    try:
        main()
        
        print("\n" + "=" * 60)
        print("FIX COMPLETED")
        print("=" * 60)
        
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
    except Exception as e:
        print(f"\n💥 Error: {e}")
        import traceback
        traceback.print_exc()