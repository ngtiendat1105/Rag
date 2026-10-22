"""
vector_db_manager.py - Class quản lý kết nối và thao tác với Vector Database
Sử dụng Qdrant (local mode) cho khả năng lọc metadata mạnh mẽ
"""

import json
import time
from typing import List, Dict, Any, Optional, Union
from pathlib import Path
import numpy as np

try:
    from qdrant_client import QdrantClient
    from qdrant_client.http import models
    from qdrant_client.http.exceptions import UnexpectedResponse
    QDRANT_AVAILABLE = True
except ImportError:
    QDRANT_AVAILABLE = False
    print("⚠️ Warning: qdrant-client not installed. Please install with: pip install qdrant-client")

from config_phase2 import (
    VECTOR_DB_DIR,
    COLLECTION_NAME,
    EMBEDDING_DIMENSION,
    VERBOSE_LOGGING,
    METADATA_KEYS_FOR_FILTERING,
    DEFAULT_FILTER_CONDITIONS
)


class VectorDBManager:
    """
    Class quản lý Vector Database sử dụng Qdrant
    Xử lý kết nối, tạo collection, và các thao tác CRUD
    """
    
    def __init__(self, collection_name: Optional[str] = None, local_mode: bool = True):
        """
        Khởi tạo VectorDBManager
        
        Args:
            collection_name: Tên collection (mặc định từ config)
            local_mode: True = chạy Qdrant local, False = kết nối remote
            
        Raises:
            ImportError: Nếu qdrant-client chưa được cài đặt
            RuntimeError: Nếu không thể kết nối đến Qdrant
        """
        if not QDRANT_AVAILABLE:
            raise ImportError(
                "qdrant-client is required. Install with: pip install qdrant-client"
            )
        
        self.collection_name = collection_name or COLLECTION_NAME
        self.local_mode = local_mode
        self.client = None
        self.collection_exists = False
        
        # Thống kê
        self.total_vectors_stored = 0
        self.collection_info = {}
        
        # Khởi tạo kết nối
        self._initialize_connection()
    
    def _initialize_connection(self):
        """Khởi tạo kết nối đến Qdrant"""
        try:
            if self.local_mode:
                # Local mode: sử dụng Qdrant local (cần cài đặt Qdrant server)
                # Hoặc sử dụng in-memory mode cho development
                if VERBOSE_LOGGING:
                    print("🔄 Đang khởi tạo Qdrant client (local mode)...")
                
                # Tạo thư mục cho Qdrant nếu chưa tồn tại
                qdrant_storage_path = VECTOR_DB_DIR / "qdrant_storage"
                qdrant_storage_path.mkdir(exist_ok=True, parents=True)
                
                # Khởi tạo client với in-memory storage (hoặc local file)
                self.client = QdrantClient(path=str(qdrant_storage_path))
                
                if VERBOSE_LOGGING:
                    print(f"✅ Qdrant client initialized (local storage: {qdrant_storage_path})")
            else:
                # Remote mode: kết nối đến Qdrant server
                if VERBOSE_LOGGING:
                    print("🔄 Đang khởi tạo Qdrant client (remote mode)...")
                
                # URL mặc định cho Qdrant local server
                self.client = QdrantClient(host="localhost", port=6333)
                
                if VERBOSE_LOGGING:
                    print("✅ Qdrant client initialized (remote: localhost:6333)")
            
            # Kiểm tra kết nối
            self._check_connection()
            
        except Exception as e:
            error_msg = f"Không thể khởi tạo Qdrant client: {str(e)}"
            
            print(f"❌ {error_msg}")
            print("\n💡 Gợi ý cài đặt Qdrant:")
            print("   1. Cài đặt Qdrant server (Docker): docker pull qdrant/qdrant")
            print("   2. Chạy Qdrant: docker run -p 6333:6333 qdrant/qdrant")
            print("   3. Hoặc sử dụng ChromaDB thay thế (đơn giản hơn)")
            
            raise RuntimeError(error_msg)
    
    def _check_connection(self):
        """Kiểm tra kết nối đến Qdrant server"""
        try:
            # Thử lấy danh sách collections
            collections = self.client.get_collections()
            if VERBOSE_LOGGING:
                print(f"✅ Connected to Qdrant. Collections: {len(collections.collections)}")
            
            # Kiểm tra collection hiện tại có tồn tại không
            self._check_collection_exists()
            
        except Exception as e:
            print(f"⚠️ Warning khi kiểm tra kết nối Qdrant: {e}")
            print("   Có thể server chưa chạy, nhưng client vẫn có thể tạo collection mới")
    
    def _check_collection_exists(self):
        """Kiểm tra xem collection đã tồn tại chưa"""
        try:
            collections = self.client.get_collections()
            for collection in collections.collections:
                if collection.name == self.collection_name:
                    self.collection_exists = True
                    
                    # Lấy thông tin collection
                    collection_info = self.client.get_collection(collection_name=self.collection_name)
                    
                    # Thử lấy points count
                    try:
                        count_result = self.client.count(collection_name=self.collection_name)
                        points_count = count_result.count
                    except:
                        points_count = 0
                    
                    self.collection_info = {
                        "points_count": points_count,
                        "status": str(collection_info.status),
                        "dimension": collection_info.config.params.vectors.size
                    }
                    
                    if VERBOSE_LOGGING:
                        print(f"✅ Collection '{self.collection_name}' đã tồn tại")
                        print(f"   Points count: {self.collection_info['points_count']}")
                        print(f"   Dimension: {self.collection_info['dimension']}")
                    
                    return True
            
            self.collection_exists = False
            if VERBOSE_LOGGING:
                print(f"ℹ️ Collection '{self.collection_name}' chưa tồn tại, sẽ tạo mới")
            
            return False
            
        except Exception as e:
            print(f"⚠️ Error checking collection existence: {e}")
            self.collection_exists = False
            return False
    
    def create_collection(self, vector_size: Optional[int] = None, recreate: bool = False):
        """
        Tạo collection mới trong Qdrant
        
        Args:
            vector_size: Kích thước vector (mặc định từ config)
            recreate: True = xóa collection cũ nếu tồn tại
        """
        vector_dim = vector_size or EMBEDDING_DIMENSION
        
        try:
            # Xóa collection cũ nếu recreate=True
            if recreate and self.collection_exists:
                if VERBOSE_LOGGING:
                    print(f"🗑️ Deleting existing collection: {self.collection_name}")
                
                self.client.delete_collection(collection_name=self.collection_name)
                self.collection_exists = False
            
            # Tạo collection mới
            if VERBOSE_LOGGING:
                print(f"🔄 Creating collection: {self.collection_name}")
                print(f"   Vector dimension: {vector_dim}")
            
            # Cấu hình collection với HNSW index cho tìm kiếm nhanh
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=models.VectorParams(
                    size=vector_dim,
                    distance=models.Distance.COSINE  # Cosine similarity phù hợp cho semantic search
                ),
                # Optional: cấu hình HNSW index
                hnsw_config=models.HnswConfigDiff(
                    m=16,  # Số lượng kết nối mỗi node
                    ef_construct=100  # Kích thước dynamic list cho construction
                )
            )
            
            self.collection_exists = True
            self.collection_info = {
                "vectors_count": 0,
                "status": "green",
                "dimension": vector_dim
            }
            
            if VERBOSE_LOGGING:
                print(f"✅ Collection '{self.collection_name}' created successfully")
            
        except Exception as e:
            error_msg = f"Không thể tạo collection: {str(e)}"
            print(f"❌ {error_msg}")
            
            # Nếu collection đã tồn tại
            if "already exists" in str(e):
                print("   Collection đã tồn tại, sử dụng collection hiện có")
                self.collection_exists = True
            else:
                raise RuntimeError(error_msg)
    
    def upsert_vectors(
        self, 
        vectors: np.ndarray, 
        payloads: List[Dict[str, Any]], 
        ids: Optional[List[Union[str, int]]] = None
    ):
        """
        Thêm hoặc cập nhật vectors vào collection
        
        Args:
            vectors: numpy array 2D chứa embedding vectors
            payloads: List các dict chứa metadata cho mỗi vector
            ids: List các ID cho mỗi vector (mặc định là index)
            
        Returns:
            Số lượng vectors đã được upsert
        """
        if not self.collection_exists:
            raise RuntimeError(f"Collection '{self.collection_name}' chưa tồn tại. Hãy tạo collection trước.")
        
        if len(vectors) != len(payloads):
            raise ValueError(f"Số lượng vectors ({len(vectors)}) không khớp với payloads ({len(payloads)})")
        
        if ids is not None and len(vectors) != len(ids):
            raise ValueError(f"Số lượng vectors ({len(vectors)}) không khớp với ids ({len(ids)})")
        
        # Tạo IDs nếu không được cung cấp
        if ids is None:
            # Tìm ID bắt đầu từ total_vectors_stored hiện tại
            start_id = self.total_vectors_stored
            ids = list(range(start_id, start_id + len(vectors)))
        
        try:
            if VERBOSE_LOGGING:
                print(f"🔄 Upserting {len(vectors)} vectors to collection '{self.collection_name}'...")
            
            start_time = time.time()
            
            # Chuẩn bị points cho Qdrant
            points = []
            for i, (vector, payload, point_id) in enumerate(zip(vectors, payloads, ids)):
                point = models.PointStruct(
                    id=point_id,
                    vector=vector.tolist(),  # Qdrant cần list, không phải numpy array
                    payload=payload
                )
                points.append(point)
            
            # Thực hiện upsert
            self.client.upsert(
                collection_name=self.collection_name,
                points=points,
                wait=True  # Đợi cho đến khi hoàn thành
            )
            
            # Cập nhật thống kê
            self.total_vectors_stored += len(vectors)
            
            if self.collection_info:
                self.collection_info["vectors_count"] = self.total_vectors_stored
            
            elapsed_time = time.time() - start_time
            
            if VERBOSE_LOGGING:
                print(f"✅ Successfully upserted {len(vectors)} vectors in {elapsed_time:.2f}s")
                print(f"   Total vectors in collection: {self.total_vectors_stored}")
            
            return len(vectors)
            
        except Exception as e:
            error_msg = f"Không thể upsert vectors: {str(e)}"
            print(f"❌ {error_msg}")
            raise RuntimeError(error_msg)
    
    def search_vectors(
        self,
        query_vector: np.ndarray,
        limit: int = 5,
        filter_conditions: Optional[Dict[str, Any]] = None,
        score_threshold: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Tìm kiếm vectors tương tự với filtering
        
        Args:
            query_vector: Embedding vector cho query
            limit: Số kết quả tối đa trả về
            filter_conditions: Điều kiện lọc metadata (vd: {"is_verified": True})
            score_threshold: Ngưỡng similarity tối thiểu
            
        Returns:
            List các kết quả với payload và similarity score
        """
        if not self.collection_exists:
            raise RuntimeError(f"Collection '{self.collection_name}' chưa tồn tại.")
        
        try:
            # Xây dựng filter cho Qdrant
            qdrant_filter = None
            if filter_conditions:
                qdrant_filter = self._build_qdrant_filter(filter_conditions)
            
            # Thực hiện search sử dụng query_points (API mới)
            query_result = self.client.query_points(
                collection_name=self.collection_name,
                query=query_vector.tolist(),  # Direct vector list
                query_filter=qdrant_filter,
                limit=limit,
                score_threshold=score_threshold,
                with_payload=True,
                with_vectors=False  # Không cần trả về vectors
            )
            
            # Format kết quả
            results = []
            for point in query_result.points:
                result = {
                    "id": point.id,
                    "score": point.score,  # Cosine similarity score
                    "payload": point.payload,
                    "content": point.payload.get("content", "") if point.payload else "",
                    "metadata": point.payload.get("metadata", {}) if point.payload else {}
                }
                results.append(result)
            
            return results
            
        except Exception as e:
            error_msg = f"Không thể search vectors: {str(e)}"
            print(f"❌ {error_msg}")
            raise RuntimeError(error_msg)
    
    def _build_qdrant_filter(self, filter_conditions: Dict[str, Any]) -> Optional[models.Filter]:
        """
        Xây dựng Qdrant filter từ dictionary conditions
        
        Args:
            filter_conditions: Dict với điều kiện lọc
            
        Returns:
            Qdrant Filter object hoặc None
        """
        if not filter_conditions:
            return None
        
        # Chuyển đổi filter conditions sang Qdrant filter
        filter_list = []
        
        for key, value in filter_conditions.items():
            # Xác định loại filter dựa trên key
            if key in ["is_verified"]:
                # Boolean filter - xử lý cả True/False và "true"/"false" string
                if isinstance(value, bool):
                    bool_value = value
                elif isinstance(value, str):
                    bool_value = value.lower() == "true"
                elif isinstance(value, int):
                    bool_value = value == 1
                else:
                    # Mặc định là False nếu không xác định
                    bool_value = False
                
                filter_list.append(
                    models.FieldCondition(
                        key=f"metadata.{key}",
                        match=models.MatchValue(value=bool_value)
                    )
                )
            
            elif key in ["weight"]:
                # Numeric filter - sử dụng Range thay vì MatchValue cho float
                if isinstance(value, (int, float)):
                    # Sử dụng Range để filter exact value (gte và lte cùng giá trị)
                    filter_list.append(
                        models.FieldCondition(
                            key=f"metadata.{key}",
                            range=models.Range(gte=float(value), lte=float(value))
                        )
                    )
                elif isinstance(value, str):
                    # Thử parse string thành number
                    try:
                        num_value = float(value)
                        filter_list.append(
                            models.FieldCondition(
                                key=f"metadata.{key}",
                                range=models.Range(gte=num_value, lte=num_value)
                            )
                        )
                    except ValueError:
                        # Không thể parse, bỏ qua filter này
                        print(f"⚠️ Warning: Cannot parse '{value}' as number for filter '{key}'")
                        pass
            
            elif key == "effective_date":
                # Range filter cho date (tìm các date >= một giá trị)
                # Đối với money queries, chúng ta muốn effective_date mới nhất
                # Có thể xử lý ở retriever level
                pass
            
            elif key == "doc_id" or key == "title":
                # Text match filter - chỉ string mới được chấp nhận
                if isinstance(value, str):
                    filter_list.append(
                        models.FieldCondition(
                            key=f"metadata.{key}",
                            match=models.MatchValue(value=value)
                        )
                    )
                else:
                    # Convert non-string values to string
                    filter_list.append(
                        models.FieldCondition(
                            key=f"metadata.{key}",
                            match=models.MatchValue(value=str(value))
                        )
                    )
        
        # Kết hợp tất cả conditions với AND
        if filter_list:
            return models.Filter(
                must=filter_list
            )
        
        return None
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """Lấy thống kê collection"""
        if not self.collection_exists:
            return {"status": "collection_not_exists"}
        
        try:
            collection_info = self.client.get_collection(collection_name=self.collection_name)
            
            # Thử lấy points count thay vì vectors_count
            try:
                count_result = self.client.count(collection_name=self.collection_name)
                points_count = count_result.count
            except:
                points_count = 0
            
            stats = {
                "collection_name": self.collection_name,
                "points_count": points_count,  # Thay vectors_count bằng points_count
                "status": str(collection_info.status),
                "dimension": collection_info.config.params.vectors.size,
                "distance": str(collection_info.config.params.vectors.distance),
                "total_vectors_stored": self.total_vectors_stored
            }
            
            return stats
            
        except Exception as e:
            return {"error": str(e), "collection_name": self.collection_name}
    
    def delete_collection(self):
        """Xóa collection"""
        try:
            self.client.delete_collection(collection_name=self.collection_name)
            self.collection_exists = False
            self.total_vectors_stored = 0
            self.collection_info = {}
            
            if VERBOSE_LOGGING:
                print(f"✅ Collection '{self.collection_name}' deleted")
                
        except Exception as e:
            print(f"⚠️ Error deleting collection: {e}")
    
    def close(self):
        """Đóng kết nối"""
        if self.client:
            # Qdrant client không có close method rõ ràng
            # Nhưng có thể thực hiện cleanup nếu cần
            pass


# ============ FACTORY FUNCTION & TEST ============

def create_vector_db_manager(collection_name: Optional[str] = None, local_mode: bool = True) -> VectorDBManager:
    """Factory function để tạo VectorDBManager"""
    return VectorDBManager(collection_name=collection_name, local_mode=local_mode)


def test_vector_db():
    """Test chức năng VectorDBManager"""
    print("🧪 Testing VectorDBManager...")
    
    try:
        # Tạo manager
        db_manager = create_vector_db_manager(local_mode=True)
        
        # Tạo collection
        db_manager.create_collection(vector_size=384, recreate=True)  # Dùng 384 cho test
        
        # Test upsert vectors
        test_vectors = np.random.randn(3, 384).astype(np.float32)
        test_payloads = [
            {
                "content": "lương cơ sở hiện tại là 2.530.000 đồng",
                "metadata": {
                    "title": "Bộ luật Lao động",
                    "is_verified": True,
                    "weight": 1.0,
                    "effective_date": "2026-07-01"
                }
            },
            {
                "content": "hợp đồng lao động cần có 10 nội dung chủ yếu",
                "metadata": {
                    "title": "Bộ luật Lao động",
                    "is_verified": True,
                    "weight": 1.0,
                    "effective_date": "2021-01-01"
                }
            },
            {
                "content": "thời gian thử việc tối đa 60 ngày",
                "metadata": {
                    "title": "Bộ luật Lao động",
                    "is_verified": False,
                    "weight": 0.5,
                    "effective_date": "2021-01-01"
                }
            }
        ]
        
        upserted = db_manager.upsert_vectors(test_vectors, test_payloads)
        print(f"✅ Upserted {upserted} vectors")
        
        # Test search với filter
        query_vector = np.random.randn(384).astype(np.float32)
        
        # Search không filter
        results_no_filter = db_manager.search_vectors(query_vector, limit=2)
        print(f"✅ Search without filter: {len(results_no_filter)} results")
        
        # Search với filter is_verified=True
        results_with_filter = db_manager.search_vectors(
            query_vector, 
            limit=2,
            filter_conditions={"is_verified": True}
        )
        print(f"✅ Search with filter (is_verified=True): {len(results_with_filter)} results")
        
        for i, result in enumerate(results_with_filter[:2]):
            print(f"   Result {i+1}: score={result['score']:.4f}, verified={result['metadata'].get('is_verified')}")
        
        # Lấy thống kê
        stats = db_manager.get_collection_stats()
        print(f"\n📊 Collection stats:")
        for key, value in stats.items():
            print(f"   {key}: {value}")
        
        # Xóa collection test
        db_manager.delete_collection()
        
        return db_manager
        
    except Exception as e:
        print(f"❌ Error testing VectorDBManager: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    # Test vector DB manager
    test_vector_db()