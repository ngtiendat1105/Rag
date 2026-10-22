"""
indexer.py - Logic đọc file jsonl, batch processing, embedding và upsert vào Vector DB
Xử lý chia batch để tránh tràn RAM và tích hợp với embedder và vector_db_manager
"""

import json
import time
import uuid
from typing import List, Dict, Any, Optional, Generator
from pathlib import Path
import numpy as np

try:
    from tqdm import tqdm
    TQDM_AVAILABLE = True
except ImportError:
    TQDM_AVAILABLE = False
    print("⚠️ Warning: tqdm not installed. Progress bars will not be shown.")

from config_phase2 import (
    INPUT_JSONL_PATH,
    BATCH_SIZE,
    VERBOSE_LOGGING,
    check_input_file
)
from embedder import create_vietnamese_embedder, VietnameseEmbedder
from vector_db_manager import create_vector_db_manager, VectorDBManager
from metadata_utils import normalize_metadata


class DataIndexer:
    """
    Class xử lý indexing dữ liệu từ JSONL vào Vector Database
    Đọc file, chia batch, tạo embedding, và upsert vào Vector DB
    """
    
    def __init__(
        self,
        embedder: Optional[VietnameseEmbedder] = None,
        db_manager: Optional[VectorDBManager] = None
    ):
        """
        Khởi tạo DataIndexer
        
        Args:
            embedder: VietnameseEmbedder instance (tạo mới nếu None)
            db_manager: VectorDBManager instance (tạo mới nếu None)
        """
        # Khởi tạo embedder
        self.embedder = embedder or create_vietnamese_embedder()
        
        # Khởi tạo vector DB manager
        self.db_manager = db_manager or create_vector_db_manager(local_mode=True)
        
        # Thống kê
        self.stats = {
            "total_chunks_read": 0,
            "total_chunks_embedded": 0,
            "total_chunks_indexed": 0,
            "total_batches": 0,
            "total_time_seconds": 0.0,
            "embedding_time": 0.0,
            "indexing_time": 0.0
        }
        
        # Error tracking
        self.errors = []
        
        if VERBOSE_LOGGING:
            print("✅ DataIndexer initialized")
            print(f"   Embedding model: {self.embedder.get_model_info()['model_name']}")
            print(f"   Batch size: {BATCH_SIZE}")
    
    def read_jsonl_file(self) -> Generator[List[Dict[str, Any]], None, None]:
        """
        Đọc file JSONL và yield từng batch
        
        Yields:
            List các dict chứa chunk data
        """
        if not check_input_file():
            raise FileNotFoundError(f"Input JSONL file not found: {INPUT_JSONL_PATH}")
        
        batch = []
        
        try:
            with open(INPUT_JSONL_PATH, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f, 1):
                    line = line.strip()
                    if not line:
                        continue
                    
                    try:
                        # Parse JSON line
                        chunk_data = json.loads(line)
                        batch.append(chunk_data)
                        
                        # Yield batch khi đủ size
                        if len(batch) >= BATCH_SIZE:
                            yield batch
                            batch = []
                            
                    except json.JSONDecodeError as e:
                        error_msg = f"Lỗi parsing JSON tại dòng {line_num}: {e}"
                        self.errors.append(error_msg)
                        if VERBOSE_LOGGING:
                            print(f"⚠️ {error_msg}")
                        continue
                    
                    except Exception as e:
                        error_msg = f"Lỗi xử lý dòng {line_num}: {e}"
                        self.errors.append(error_msg)
                        if VERBOSE_LOGGING:
                            print(f"⚠️ {error_msg}")
                        continue
            
            # Yield batch cuối cùng (nếu có)
            if batch:
                yield batch
                
        except Exception as e:
            error_msg = f"Lỗi đọc file JSONL: {e}"
            self.errors.append(error_msg)
            raise RuntimeError(error_msg)
    
    def prepare_batch_for_indexing(self, batch_data: List[Dict[str, Any]]) -> tuple:
        """
        Chuẩn bị batch data cho indexing
        
        Args:
            batch_data: List các chunk data từ JSONL
            
        Returns:
            Tuple (texts, payloads, ids)
        """
        texts = []
        payloads = []
        ids = []
        
        for chunk in batch_data:
            try:
                # Lấy content cho embedding
                content = chunk.get("content", "")
                if not content or not content.strip():
                    continue  # Bỏ qua chunk không có content
                
                # Lấy metadata
                chunk_id = chunk.get("chunk_id", "")
                metadata = normalize_metadata(
                    chunk.get("metadata", {}),
                    chunk_id=chunk_id,
                    article_title=chunk.get("article_title", ""),
                )
                
                # Chuẩn bị payload cho Vector DB
                # Qdrant payload có thể chứa cả metadata và content
                payload = {
                    "content": content,
                    "metadata": metadata,
                    "chunk_id": chunk_id,
                    "title": metadata["title"],
                    "doc_id": metadata.get("doc_id", ""),
                    "is_verified": metadata.get("is_verified", True),
                    "weight": metadata["weight"],
                    "effective_date": metadata.get("effective_date", ""),
                    "article_number": metadata["article_number"],
                }
                
                # Thêm quality_analysis nếu có
                if "quality_analysis" in chunk:
                    payload["quality_analysis"] = chunk["quality_analysis"]
                
                # Thêm cross_references nếu có
                if "cross_references" in chunk:
                    payload["cross_references"] = chunk["cross_references"]
                
                texts.append(content)
                payloads.append(payload)
                stable_id = chunk_id or f"chunk_{len(texts)}"
                ids.append(str(uuid.uuid5(uuid.NAMESPACE_URL, stable_id)))
                
            except Exception as e:
                error_msg = f"Lỗi chuẩn bị chunk: {e}"
                self.errors.append(error_msg)
                if VERBOSE_LOGGING:
                    print(f"⚠️ {error_msg}")
                continue
        
        return texts, payloads, ids
    
    def process_batch(self, batch_data: List[Dict[str, Any]]) -> int:
        """
        Xử lý một batch: embedding và indexing
        
        Args:
            batch_data: List các chunk data
            
        Returns:
            Số chunks đã được indexed thành công
        """
        if not batch_data:
            return 0
        
        batch_start_time = time.time()
        chunks_indexed = 0
        
        try:
            # Bước 1: Chuẩn bị batch
            prep_start = time.time()
            texts, payloads, ids = self.prepare_batch_for_indexing(batch_data)
            prep_time = time.time() - prep_start
            
            if not texts:
                if VERBOSE_LOGGING:
                    print(f"⚠️ Batch không có valid texts, bỏ qua")
                return 0
            
            # Bước 2: Tạo embeddings
            embed_start = time.time()
            embeddings = self.embedder.embed_batch(texts)
            embed_time = time.time() - embed_start
            
            # Validate embeddings
            if not self.embedder.validate_embeddings(embeddings, len(texts)):
                error_msg = "Embeddings không hợp lệ"
                self.errors.append(error_msg)
                if VERBOSE_LOGGING:
                    print(f"❌ {error_msg}")
                return 0
            
            # Bước 3: Index vào Vector DB
            index_start = time.time()
            chunks_indexed = self.db_manager.upsert_vectors(embeddings, payloads, ids)
            index_time = time.time() - index_start
            
            # Cập nhật thống kê
            batch_total_time = time.time() - batch_start_time
            
            self.stats["total_chunks_read"] += len(batch_data)
            self.stats["total_chunks_embedded"] += len(texts)
            self.stats["total_chunks_indexed"] += chunks_indexed
            self.stats["total_batches"] += 1
            self.stats["total_time_seconds"] += batch_total_time
            self.stats["embedding_time"] += embed_time
            self.stats["indexing_time"] += index_time
            
            if VERBOSE_LOGGING:
                print(f"✅ Batch processed: {len(texts)} texts, {chunks_indexed} indexed")
                print(f"   Times - prep: {prep_time:.2f}s, embed: {embed_time:.2f}s, index: {index_time:.2f}s")
                print(f"   Total indexed so far: {self.stats['total_chunks_indexed']}")
            
            return chunks_indexed
            
        except Exception as e:
            error_msg = f"Lỗi xử lý batch: {e}"
            self.errors.append(error_msg)
            if VERBOSE_LOGGING:
                print(f"❌ {error_msg}")
            return 0
    
    def create_collection(self, recreate: bool = False):
        """
        Tạo collection trong Vector DB
        
        Args:
            recreate: True = xóa collection cũ nếu tồn tại
        """
        try:
            # Lấy embedding dimension từ embedder
            vector_dim = self.embedder.get_embedding_dimension()
            
            # Tạo collection
            self.db_manager.create_collection(vector_size=vector_dim, recreate=recreate)
            
            if VERBOSE_LOGGING:
                print(f"✅ Collection created with dimension: {vector_dim}")
                
        except Exception as e:
            error_msg = f"Lỗi tạo collection: {e}"
            self.errors.append(error_msg)
            raise RuntimeError(error_msg)
    
    def run_indexing_pipeline(self, recreate_collection: bool = False):
        """
        Chạy toàn bộ pipeline indexing
        
        Args:
            recreate_collection: True = xóa và tạo mới collection
        """
        print("\n" + "=" * 70)
        print("🚀 BẮT ĐẦU PIPELINE INDEXING DỮ LIỆU")
        print("=" * 70)
        
        pipeline_start_time = time.time()
        
        try:
            # Bước 1: Tạo collection
            print("1. 📁 Tạo collection trong Vector DB...")
            self.create_collection(recreate=recreate_collection)
            
            # Bước 2: Đọc và xử lý file JSONL
            print("2. 📄 Đọc file JSONL và xử lý từng batch...")
            
            # Sử dụng tqdm cho progress bar nếu available
            batch_iterator = self.read_jsonl_file()
            
            if TQDM_AVAILABLE:
                # Đếm tổng số dòng trước để hiển thị progress bar chính xác
                total_chunks = self._count_total_chunks()
                batch_iterator = tqdm(
                    batch_iterator,
                    total=(total_chunks + BATCH_SIZE - 1) // BATCH_SIZE,  # Số batch ước tính
                    desc="Processing batches",
                    unit="batch"
                )
            
            # Xử lý từng batch
            for batch_num, batch_data in enumerate(batch_iterator, 1):
                if VERBOSE_LOGGING:
                    print(f"\n📦 Processing batch {batch_num} ({len(batch_data)} chunks)...")
                
                chunks_indexed = self.process_batch(batch_data)
                
                if not VERBOSE_LOGGING and not TQDM_AVAILABLE:
                    # Hiển thị progress đơn giản
                    if batch_num % 5 == 0:
                        print(f"   Processed {batch_num} batches, indexed {self.stats['total_chunks_indexed']} chunks")
            
            # Bước 3: Tổng kết
            print("\n3. 📊 Tổng kết pipeline...")
            self._print_pipeline_summary(pipeline_start_time)
            
        except KeyboardInterrupt:
            print("\n\n⏹️ Pipeline bị dừng bởi người dùng")
            self._print_pipeline_summary(pipeline_start_time)
            raise
            
        except Exception as e:
            print(f"\n❌ Lỗi trong pipeline: {e}")
            self._print_pipeline_summary(pipeline_start_time)
            raise
    
    def _count_total_chunks(self) -> int:
        """Đếm tổng số chunks trong file JSONL"""
        try:
            count = 0
            with open(INPUT_JSONL_PATH, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip():
                        count += 1
            return count
        except Exception as e:
            print(f"⚠️ Không thể đếm tổng số chunks: {e}")
            return 0
    
    def _print_pipeline_summary(self, start_time: float):
        """In tổng kết pipeline"""
        total_time = time.time() - start_time
        
        print("\n" + "=" * 70)
        print("📊 TỔNG KẾT PIPELINE INDEXING")
        print("=" * 70)
        
        print(f"Thời gian tổng: {total_time:.2f}s")
        print(f"Thời gian embedding: {self.stats['embedding_time']:.2f}s")
        print(f"Thời gian indexing: {self.stats['indexing_time']:.2f}s")
        
        print(f"\n📈 Thống kê:")
        print(f"  - Tổng chunks đọc: {self.stats['total_chunks_read']}")
        print(f"  - Tổng chunks embedded: {self.stats['total_chunks_embedded']}")
        print(f"  - Tổng chunks indexed: {self.stats['total_chunks_indexed']}")
        print(f"  - Tổng batches: {self.stats['total_batches']}")
        
        if self.stats['total_chunks_embedded'] > 0:
            avg_embed_time = self.stats['embedding_time'] / self.stats['total_chunks_embedded']
            print(f"  - Thời gian embedding trung bình/chunk: {avg_embed_time:.4f}s")
        
        if self.stats['total_chunks_indexed'] > 0:
            avg_index_time = self.stats['indexing_time'] / self.stats['total_chunks_indexed']
            print(f"  - Thời gian indexing trung bình/chunk: {avg_index_time:.4f}s")
        
        # Thống kê Vector DB
        try:
            db_stats = self.db_manager.get_collection_stats()
            print(f"\n🗄️ Vector DB stats:")
            for key, value in db_stats.items():
                print(f"  - {key}: {value}")
        except Exception as e:
            print(f"\n⚠️ Không thể lấy Vector DB stats: {e}")
        
        # Hiển thị lỗi nếu có
        if self.errors:
            print(f"\n⚠️ Lỗi trong quá trình xử lý ({len(self.errors)}):")
            for i, error in enumerate(self.errors[:10], 1):
                print(f"  {i}. {error[:100]}...")
            if len(self.errors) > 10:
                print(f"  ... và {len(self.errors) - 10} lỗi khác")
        
        print(f"\n✅ Pipeline hoàn thành!")
        print("=" * 70)
    
    def get_stats(self) -> Dict[str, Any]:
        """Lấy thống kê indexing"""
        return self.stats.copy()
    
    def get_errors(self) -> List[str]:
        """Lấy danh sách lỗi"""
        return self.errors.copy()


# ============ FACTORY FUNCTION & TEST ============

def create_data_indexer(
    embedder: Optional[VietnameseEmbedder] = None,
    db_manager: Optional[VectorDBManager] = None
) -> DataIndexer:
    """Factory function để tạo DataIndexer"""
    return DataIndexer(embedder=embedder, db_manager=db_manager)


def test_indexer():
    """Test chức năng indexer với dữ liệu mẫu"""
    print("🧪 Testing DataIndexer...")
    
    try:
        # Tạo embedder test với model nhỏ
        from config_phase2 import VIETNAMESE_EMBEDDING_MODEL
        test_model = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
        
        print(f"   Using test model: {test_model}")
        
        embedder = create_vietnamese_embedder(model_name=test_model)
        
        # Tạo indexer
        indexer = create_data_indexer(embedder=embedder)
        
        # Test đọc JSONL
        print("\n1. Testing JSONL reading...")
        batch_count = 0
        total_chunks = 0
        
        for batch in indexer.read_jsonl_file():
            batch_count += 1
            total_chunks += len(batch)
            print(f"   Batch {batch_count}: {len(batch)} chunks")
            
            if batch_count >= 2:  # Chỉ test 2 batch đầu
                break
        
        print(f"   Total batches read in test: {batch_count}")
        print(f"   Total chunks read in test: {total_chunks}")
        
        # Test prepare batch
        if total_chunks > 0:
            print("\n2. Testing batch preparation...")
            # Đọc lại batch đầu tiên
            first_batch = None
            for batch in indexer.read_jsonl_file():
                first_batch = batch
                break
            
            if first_batch:
                texts, payloads, ids = indexer.prepare_batch_for_indexing(first_batch)
                print(f"   Prepared {len(texts)} texts, {len(payloads)} payloads")
                
                if texts:
                    print(f"   First text preview: {texts[0][:100]}...")
                    print(f"   First payload keys: {list(payloads[0].keys())}")
        
        # Test collection creation
        print("\n3. Testing collection creation...")
        indexer.create_collection(recreate=True)
        
        print("✅ DataIndexer test completed successfully")
        return indexer
        
    except Exception as e:
        print(f"❌ Error testing DataIndexer: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    # Test indexer
    test_indexer()