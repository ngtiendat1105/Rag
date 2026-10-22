"""
index_clean.py - Clean re-indexing without Qdrant lock issues
Uses single client instance and proper cleanup
"""

import json
import sys
import os
import time
from pathlib import Path
from typing import List, Dict, Any

# Add workspace to path
sys.path.insert(0, os.path.dirname(__file__))

def cleanup_vector_db():
    """Remove vector DB directory completely"""
    vector_db_path = Path(__file__).parent / "vector_db"
    if vector_db_path.exists():
        import shutil
        try:
            shutil.rmtree(vector_db_path)
            print(f"✅ Removed existing vector_db: {vector_db_path}")
            time.sleep(1)  # Allow filesystem to settle
        except Exception as e:
            print(f"⚠️ Could not remove vector_db: {e}")

def load_embedder():
    """Load Vietnamese embedder"""
    print("Loading embedder...")
    from embedder import create_vietnamese_embedder
    embedder = create_vietnamese_embedder()
    print(f"✅ Embedder loaded: {embedder.get_model_info()['model_name']}")
    return embedder

def load_jsonl_data():
    """Load all JSONL data into memory"""
    from config_phase2 import INPUT_JSONL_PATH
    
    print(f"\nLoading JSONL data from {INPUT_JSONL_PATH}...")
    
    if not os.path.exists(INPUT_JSONL_PATH):
        raise FileNotFoundError(f"JSONL file not found: {INPUT_JSONL_PATH}")
    
    chunks = []
    with open(INPUT_JSONL_PATH, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f):
            try:
                chunk = json.loads(line.strip())
                chunks.append(chunk)
            except json.JSONDecodeError as e:
                print(f"⚠️ Error parsing line {i+1}: {e}")
                continue
    
    print(f"✅ Loaded {len(chunks)} chunks")
    return chunks

def create_embeddings(embedder, chunks: List[Dict[str, Any]]):
    """Create embeddings for all chunks"""
    print(f"\nCreating embeddings for {len(chunks)} chunks...")
    
    # Extract texts
    texts = [chunk.get('content', '') or chunk.get('text', '') for chunk in chunks]
    
    # Embed
    start = time.time()
    embeddings = embedder.embed_batch(texts)
    elapsed = time.time() - start
    
    print(f"✅ Created {len(embeddings)} embeddings in {elapsed:.2f}s")
    print(f"   Embedding dimension: {embeddings[0].shape if len(embeddings) > 0 else 'N/A'}")
    
    return embeddings

def create_qdrant_collection_and_index(chunks, embeddings):
    """Create Qdrant collection and index all chunks at once"""
    from qdrant_client import QdrantClient
    from qdrant_client.http import models
    from config_phase2 import COLLECTION_NAME
    
    vector_db_path = Path(__file__).parent / "vector_db" / "qdrant_storage"
    
    print(f"\nInitializing Qdrant client (local mode at {vector_db_path})...")
    
    # Create single client instance
    client = QdrantClient(path=str(vector_db_path))
    
    try:
        # Get dimension from first embedding
        embedding_dim = embeddings.shape[1] if len(embeddings) > 0 else 768
        
        print(f"Creating collection '{COLLECTION_NAME}' with dimension {embedding_dim}...")
        
        # Create collection
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=models.VectorParams(
                size=embedding_dim,
                distance=models.Distance.COSINE
            )
        )
        print(f"✅ Collection created")
        
        # Prepare points for upsert
        print(f"\nPreparing {len(chunks)} points for indexing...")
        points = []
        
        for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            point = models.PointStruct(
                id=idx + 1,  # 1-based ID
                vector=embedding.tolist(),
                payload={
                    'content': chunk.get('content', ''),
                    'text': chunk.get('text', ''),
                    'document': chunk.get('document', ''),
                    'chunk_index': chunk.get('chunk_index', idx),
                    'total_chunks': chunk.get('total_chunks', len(chunks))
                }
            )
            points.append(point)
        
        # Upsert all points at once
        print(f"Upserting {len(points)} points to Qdrant...")
        start = time.time()
        client.upsert(
            collection_name=COLLECTION_NAME,
            points=points
        )
        elapsed = time.time() - start
        
        print(f"✅ Upserted {len(points)} points in {elapsed:.2f}s")
        
        # Verify
        count = client.count(collection_name=COLLECTION_NAME)
        print(f"✅ Collection now contains {count.count} points")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        # Close client
        try:
            client.close()
            print("✅ Qdrant client closed")
        except:
            pass

def main():
    print("=" * 70)
    print("CLEAN RE-INDEXING - Vector DB Fresh Start")
    print("=" * 70)
    
    try:
        # 1. Clean up
        cleanup_vector_db()
        
        # 2. Load embedder
        embedder = load_embedder()
        
        # 3. Load data
        chunks = load_jsonl_data()
        if not chunks:
            print("❌ No chunks loaded")
            return False
        
        # 4. Create embeddings
        embeddings = create_embeddings(embedder, chunks)
        if len(embeddings) != len(chunks):
            print(f"❌ Embedding count mismatch: {len(embeddings)} vs {len(chunks)}")
            return False
        
        # 5. Create collection and index
        success = create_qdrant_collection_and_index(chunks, embeddings)
        
        if success:
            print("\n" + "=" * 70)
            print("✅ INDEXING COMPLETED SUCCESSFULLY!")
            print("=" * 70)
            print("\nNext steps:")
            print("1. Test retrieval: python retriever_demo.py")
            print("2. Run with Ollama: python main_chat.py --provider ollama --model llama3.2:3b")
            return True
        else:
            print("\n" + "=" * 70)
            print("❌ INDEXING FAILED")
            print("=" * 70)
            return False
            
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
