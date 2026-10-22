"""
test_simple_query.py - Test direct Qdrant queries without LangChain complexity
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from pathlib import Path
from embedder import create_vietnamese_embedder
from qdrant_client import QdrantClient
from config_phase2 import COLLECTION_NAME

def test_direct_query():
    """Test direct Qdrant queries"""
    
    print("=" * 70)
    print("TESTING DIRECT QDRANT QUERIES")
    print("=" * 70)
    
    # 1. Load embedder
    print("\n1. Loading embedder...")
    embedder = create_vietnamese_embedder()
    print(f"   ✅ Embedder loaded")
    
    # 2. Connect to Qdrant
    print("\n2. Connecting to Qdrant...")
    qdrant_path = Path(__file__).parent / "vector_db" / "qdrant_storage"
    client = QdrantClient(path=str(qdrant_path))
    
    # Check collection
    collections = client.get_collections()
    print(f"   ✅ Found {len(collections.collections)} collection(s)")
    
    # Get collection info
    collection_info = client.get_collection(collection_name=COLLECTION_NAME)
    count = client.count(collection_name=COLLECTION_NAME)
    print(f"   ✅ Collection '{COLLECTION_NAME}': {count.count} points")
    print(f"   Dimension: {collection_info.config.params.vectors.size}")
    
    # 3. Test queries
    test_queries = [
        "lương cơ sở",
        "hợp đồng lao động",
        "thời gian thử việc",
        "bảo hiểm xã hội",
        "trợ cấp thai sản"
    ]
    
    print("\n3. Testing queries:")
    print("-" * 70)
    
    for query_text in test_queries:
        print(f"\nQuery: '{query_text}'")
        
        # Embed query
        query_embedding = embedder.embed_text(query_text)
        
        # Search without filter
        results = client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_embedding.tolist(),
            limit=3,
            with_payload=True,
            with_vectors=False
        )
        
        print(f"  Results: {len(results.points)} points found")
        
        for i, hit in enumerate(results.points, 1):
            payload = hit.payload or {}
            content = payload.get('content', '')[:100]
            score = hit.score
            title = payload.get('document', 'Unknown')
            
            print(f"    {i}. Score: {score:.4f}")
            print(f"       Title: {title}")
            print(f"       Content: {content}...")
    
    # 4. Test without embedding (direct vector search)
    print("\n\n4. Testing direct vector match:")
    print("-" * 70)
    
    # Get first point to verify it exists
    results = client.query_points(
        collection_name=COLLECTION_NAME,
        query=[0.1] * 768,  # Random vector
        limit=1,
        with_payload=True
    )
    
    if results.points:
        print(f"   ✅ Retrieved first point successfully")
        hit = results.points[0]
        print(f"   ID: {hit.id}, Score: {hit.score}")
        print(f"   Payload keys: {list(hit.payload.keys()) if hit.payload else 'None'}")
    else:
        print("   ❌ No points found")
    
    # Close client
    client.close()
    print("\n✅ Test completed")

if __name__ == "__main__":
    try:
        test_direct_query()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
