"""
embedder.py - Class VietnameseEmbedder sử dụng sentence-transformers cho tiếng Việt
Xử lý embedding văn bản tiếng Việt với model tối ưu hóa
"""

import time
from typing import List, Optional, Union
import numpy as np

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    print("⚠️ Warning: sentence-transformers not installed. Please install with: pip install sentence-transformers")

from config_phase2 import (
    VIETNAMESE_EMBEDDING_MODEL, 
    EMBEDDING_DIMENSION, 
    EMBEDDING_DEVICE,
    VERBOSE_LOGGING
)


class VietnameseEmbedder:
    """
    Class chuyên xử lý embedding văn bản tiếng Việt
    Sử dụng model sentence-transformers đã được fine-tune cho tiếng Việt
    """
    
    def __init__(self, model_name: Optional[str] = None, device: Optional[str] = None):
        """
        Khởi tạo VietnameseEmbedder với model được chỉ định
        
        Args:
            model_name: Tên model sentence-transformers (mặc định từ config)
            device: Device cho inference (cpu/cuda)
            
        Raises:
            ImportError: Nếu sentence-transformers chưa được cài đặt
            RuntimeError: Nếu không thể tải model
        """
        if not SENTENCE_TRANSFORMERS_AVAILABLE:
            raise ImportError(
                "sentence-transformers is required. Install with: pip install sentence-transformers"
            )
        
        # Sử dụng model từ config nếu không chỉ định
        self.model_name = model_name or VIETNAMESE_EMBEDDING_MODEL
        self.device = device or EMBEDDING_DEVICE
        
        # Thông tin model
        self.model = None
        self.embedding_dimension = EMBEDDING_DIMENSION
        
        # Thống kê
        self.total_texts_embedded = 0
        self.total_time_seconds = 0.0
        
        # Khởi tạo model
        self._initialize_model()
    
    def _initialize_model(self):
        """Khởi tạo và tải model sentence-transformers"""
        try:
            if VERBOSE_LOGGING:
                print(f"🔄 Đang tải model embedding: {self.model_name}")
                print(f"   Device: {self.device}")
                print(f"   Expected dimension: {self.embedding_dimension}")
            
            start_time = time.time()
            
            # Tải model với các tham số tối ưu
            self.model = SentenceTransformer(
                self.model_name,
                device=self.device,
                trust_remote_code=True  # Quan trọng cho một số model custom
            )
            
            # Kiểm tra embedding dimension thực tế
            test_embedding = self.model.encode(["test"], convert_to_numpy=True)
            actual_dimension = test_embedding.shape[1]
            
            if actual_dimension != self.embedding_dimension:
                print(f"⚠️ Dimension mismatch: config={self.embedding_dimension}, actual={actual_dimension}")
                print(f"   Cập nhật EMBEDDING_DIMENSION trong config_phase2.py")
                self.embedding_dimension = actual_dimension
            
            load_time = time.time() - start_time
            
            if VERBOSE_LOGGING:
                print(f"✅ Model loaded successfully in {load_time:.2f}s")
                print(f"   Actual embedding dimension: {self.embedding_dimension}")
                print(f"   Model info: {self.model}")
            
        except Exception as e:
            error_msg = f"Không thể tải model {self.model_name}: {str(e)}"
            
            # Gợi ý các model thay thế
            print(f"❌ {error_msg}")
            print("\n💡 Gợi ý các model thay thế:")
            print("   1. 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2' (384 dimensions)")
            print("   2. 'sentence-transformers/paraphrase-multilingual-mpnet-base-v2' (768 dimensions)")
            print("   3. 'intfloat/multilingual-e5-small' (384 dimensions)")
            
            raise RuntimeError(error_msg)
    
    def embed_text(self, text: str) -> np.ndarray:
        """
        Tạo embedding cho một đoạn văn bản
        
        Args:
            text: Văn bản tiếng Việt cần embedding
            
        Returns:
            numpy array chứa embedding vector
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty for embedding")
        
        start_time = time.time()
        
        try:
            # Chuyển đổi text thành embedding
            # normalize_embeddings=True để chuẩn hóa vector (hữu ích cho cosine similarity)
            embedding = self.model.encode(
                text,
                convert_to_numpy=True,
                normalize_embeddings=True,
                show_progress_bar=False
            )
            
            # Cập nhật thống kê
            self.total_texts_embedded += 1
            self.total_time_seconds += (time.time() - start_time)
            
            return embedding
            
        except Exception as e:
            raise RuntimeError(f"Error embedding text: {str(e)}")
    
    def embed_batch(self, texts: List[str]) -> np.ndarray:
        """
        Tạo embedding cho một batch văn bản (hiệu quả hơn)
        
        Args:
            texts: List các văn bản tiếng Việt
            
        Returns:
            numpy array 2D với shape (batch_size, embedding_dimension)
        """
        if not texts:
            raise ValueError("Texts list cannot be empty")
        
        # Lọc bỏ text rỗng
        valid_texts = [text for text in texts if text and text.strip()]
        if not valid_texts:
            raise ValueError("No valid texts for embedding")
        
        start_time = time.time()
        
        try:
            # Batch encoding với các tham số tối ưu
            embeddings = self.model.encode(
                valid_texts,
                batch_size=min(len(valid_texts), 32),  # Batch size hợp lý
                convert_to_numpy=True,
                normalize_embeddings=True,
                show_progress_bar=VERBOSE_LOGGING
            )
            
            # Cập nhật thống kê
            self.total_texts_embedded += len(valid_texts)
            self.total_time_seconds += (time.time() - start_time)
            
            return embeddings
            
        except Exception as e:
            raise RuntimeError(f"Error embedding batch: {str(e)}")
    
    def get_embedding_dimension(self) -> int:
        """Trả về kích thước embedding dimension"""
        return self.embedding_dimension
    
    def get_model_info(self) -> dict:
        """Trả về thông tin model"""
        if not self.model:
            return {"status": "model_not_loaded"}
        
        return {
            "model_name": self.model_name,
            "device": self.device,
            "embedding_dimension": self.embedding_dimension,
            "total_texts_embedded": self.total_texts_embedded,
            "total_time_seconds": self.total_time_seconds,
            "avg_time_per_text": self.total_time_seconds / max(self.total_texts_embedded, 1)
        }
    
    def validate_embeddings(self, embeddings: np.ndarray, expected_count: int) -> bool:
        """
        Validate embeddings array
        
        Args:
            embeddings: Embeddings array cần validate
            expected_count: Số lượng embeddings mong đợi
            
        Returns:
            True nếu valid, False nếu không
        """
        if embeddings is None:
            return False
        
        if not isinstance(embeddings, np.ndarray):
            return False
        
        # Kiểm tra shape
        if embeddings.ndim != 2:
            return False
        
        if embeddings.shape[0] != expected_count:
            return False
        
        if embeddings.shape[1] != self.embedding_dimension:
            return False
        
        # Kiểm tra NaN values
        if np.any(np.isnan(embeddings)):
            return False
        
        return True
    
    def calculate_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Tính cosine similarity giữa hai embeddings
        
        Args:
            embedding1: Embedding vector thứ nhất
            embedding2: Embedding vector thứ hai
            
        Returns:
            Cosine similarity score (-1 đến 1)
        """
        # Ensure embeddings are normalized (nếu model chưa normalize)
        if np.linalg.norm(embedding1) == 0 or np.linalg.norm(embedding2) == 0:
            return 0.0
        
        # Cosine similarity = dot product của normalized vectors
        similarity = np.dot(embedding1, embedding2) / (
            np.linalg.norm(embedding1) * np.linalg.norm(embedding2)
        )
        
        return float(similarity)


# ============ FACTORY FUNCTION & TEST ============

def create_vietnamese_embedder(model_name: Optional[str] = None, device: Optional[str] = None) -> VietnameseEmbedder:
    """Factory function để tạo VietnameseEmbedder"""
    return VietnameseEmbedder(model_name=model_name, device=device)


def test_embedder():
    """Test chức năng embedder"""
    print("🧪 Testing VietnameseEmbedder...")
    
    try:
        # Tạo embedder
        embedder = create_vietnamese_embedder()
        
        # Lấy thông tin model
        model_info = embedder.get_model_info()
        print(f"✅ Model loaded: {model_info['model_name']}")
        print(f"   Dimension: {model_info['embedding_dimension']}")
        print(f"   Device: {model_info['device']}")
        
        # Test embedding single text
        test_text = "lương cơ sở hiện tại là bao nhiêu?"
        embedding = embedder.embed_text(test_text)
        print(f"✅ Single text embedding shape: {embedding.shape}")
        print(f"   Embedding norm: {np.linalg.norm(embedding):.4f}")
        
        # Test embedding batch
        test_texts = [
            "hợp đồng lao động cần có những nội dung gì?",
            "thời gian thử việc tối đa là bao lâu?",
            "mức tham chiếu để tính bảo hiểm xã hội"
        ]
        batch_embeddings = embedder.embed_batch(test_texts)
        print(f"✅ Batch embedding shape: {batch_embeddings.shape}")
        
        # Test similarity
        sim1 = embedder.calculate_similarity(batch_embeddings[0], batch_embeddings[1])
        sim2 = embedder.calculate_similarity(batch_embeddings[0], batch_embeddings[2])
        print(f"✅ Similarity scores:")
        print(f"   Text1-Text2: {sim1:.4f}")
        print(f"   Text1-Text3: {sim2:.4f}")
        
        # Test validation
        is_valid = embedder.validate_embeddings(batch_embeddings, len(test_texts))
        print(f"✅ Embeddings validation: {is_valid}")
        
        # Print statistics
        print(f"\n📊 Embedding statistics:")
        print(f"   Total texts embedded: {model_info['total_texts_embedded']}")
        print(f"   Total time: {model_info['total_time_seconds']:.2f}s")
        print(f"   Avg time per text: {model_info['avg_time_per_text']:.4f}s")
        
        return embedder
        
    except Exception as e:
        print(f"❌ Error testing embedder: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    # Test embedder
    test_embedder()