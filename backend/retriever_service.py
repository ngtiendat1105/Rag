"""
retriever_service.py - LangChain Retriever service cho hệ thống RAG pháp lý
Kết nối với Vector Database từ Giai đoạn 2 và cung cấp retrieval cho pipeline
"""

import os
import re
import sys
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path

# Thêm thư mục gốc vào path để import các module khác
sys.path.append(str(Path(__file__).parent))

try:
    from langchain_qdrant import Qdrant
    from langchain_core.documents import Document
    from langchain_core.retrievers import BaseRetriever
    from qdrant_client import QdrantClient
    from qdrant_client.http import models
    LANGCHAIN_AVAILABLE = True
except ImportError as e:
    LANGCHAIN_AVAILABLE = False
    print(f"⚠️ Warning: LangChain or Qdrant client not installed: {e}")
    # Define fallback classes
    class Document:
        def __init__(self, page_content="", metadata=None):
            self.page_content = page_content
            self.metadata = metadata or {}
    
    class BaseRetriever:
        def get_relevant_documents(self, query: str):
            return []

from config_phase2 import (
    VECTOR_DB_DIR,
    COLLECTION_NAME,
    EMBEDDING_DIMENSION,
    VERBOSE_LOGGING
)
from config_llm import LLMConfig
from embedder import create_vietnamese_embedder, VietnameseEmbedder
from metadata_utils import normalize_metadata
from query_understanding import fold_text, understand_query

try:
    from sentence_transformers import CrossEncoder
except ImportError:
    CrossEncoder = None


class RetrievalError(RuntimeError):
    """Lỗi hạ tầng hoặc cấu hình trong quá trình retrieval."""


class LegalRetrieverService:
    """
    Service cung cấp retrieval cho hệ thống RAG pháp lý
    Kết nối LangChain với Vector Database từ Giai đoạn 2
    """
    
    def __init__(
        self,
        embedder: Optional[VietnameseEmbedder] = None,
        use_metadata_filtering: Optional[bool] = None,
        similarity_threshold: Optional[float] = None
    ):
        """
        Khởi tạo LegalRetrieverService
        
        Args:
            embedder: VietnameseEmbedder instance
            use_metadata_filtering: Có sử dụng metadata filtering không
            similarity_threshold: Ngưỡng similarity tối thiểu
        """
        if not LANGCHAIN_AVAILABLE:
            raise ImportError(
                "LangChain is required. Install with: pip install langchain langchain-community"
            )
        
        # Khởi tạo embedder
        self.embedder = embedder or create_vietnamese_embedder()
        
        # Cấu hình retrieval
        self.use_metadata_filtering = (
            use_metadata_filtering 
            if use_metadata_filtering is not None 
            else LLMConfig.USE_METADATA_FILTERING
        )
        
        self.similarity_threshold = (
            similarity_threshold 
            if similarity_threshold is not None 
            else LLMConfig.SIMILARITY_THRESHOLD
        )
        
        # Khởi tạo Qdrant client
        self.qdrant_client = None
        self.vector_store = None
        self.langchain_retriever = None
        reranker_name = os.getenv("RAG_RERANKER_MODEL", "").strip()
        self.reranker = (
            CrossEncoder(reranker_name)
            if reranker_name and CrossEncoder is not None
            else None
        )
        
        # Thống kê
        self.stats = {
            "total_queries": 0,
            "total_documents_retrieved": 0,
            "avg_documents_per_query": 0.0,
            "filtered_queries": 0
        }
        
        # Khởi tạo kết nối
        self._initialize_connection()
        
        if VERBOSE_LOGGING:
            print(f"✅ LegalRetrieverService initialized")
            print(f"   Metadata filtering: {'ON' if self.use_metadata_filtering else 'OFF'}")
            print(f"   Similarity threshold: {self.similarity_threshold}")
    
    def _initialize_connection(self):
        """Khởi tạo kết nối đến Qdrant và tạo LangChain retriever"""
        try:
            # Đường dẫn lưu trữ Qdrant
            qdrant_storage_path = VECTOR_DB_DIR / "qdrant_storage"
            
            if not qdrant_storage_path.exists():
                raise FileNotFoundError(
                    f"Qdrant storage not found at {qdrant_storage_path}. "
                    f"Please run Phase 2 indexing first."
                )
            
            # Tạo Qdrant client
            self.qdrant_client = QdrantClient(path=str(qdrant_storage_path))
            
            # Kiểm tra collection tồn tại
            collections = self.qdrant_client.get_collections()
            collection_exists = any(
                collection.name == COLLECTION_NAME 
                for collection in collections.collections
            )
            
            if not collection_exists:
                raise ValueError(
                    f"Collection '{COLLECTION_NAME}' not found. "
                    f"Please run Phase 2 indexing first."
                )
            
            # Tạo LangChain embeddings adapter
            # Note: Chúng ta cần adapter để sử dụng embedder của chúng ta với LangChain
            from langchain_core.embeddings import Embeddings
            
            class CustomEmbeddings(Embeddings):
                """Adapter để sử dụng VietnameseEmbedder với LangChain"""
                def __init__(self, embedder):
                    self.embedder = embedder
                
                def embed_documents(self, texts):
                    """Embed list of documents"""
                    return self.embedder.embed_batch(texts).tolist()
                
                def embed_query(self, text):
                    """Embed single query"""
                    return self.embedder.embed_text(text).tolist()
            
            # Tạo embeddings adapter
            embeddings = CustomEmbeddings(self.embedder)
            
            # Tạo Qdrant vector store với LangChain
            self.vector_store = Qdrant(
                client=self.qdrant_client,
                collection_name=COLLECTION_NAME,
                embeddings=embeddings,
                content_payload_key="content",
                metadata_payload_key="metadata"
            )
            
            # Tạo retriever với cấu hình
            search_kwargs = {
                "k": LLMConfig.TOP_K,
                "score_threshold": self.similarity_threshold
            }
            
            # Thêm metadata filter nếu được bật
            if self.use_metadata_filtering:
                filter_conditions = LLMConfig.DEFAULT_METADATA_FILTER
                qdrant_filter = self._build_qdrant_filter(filter_conditions)
                if qdrant_filter:
                    search_kwargs["filter"] = qdrant_filter
            
            # Tạo LangChain retriever
            self.langchain_retriever = self.vector_store.as_retriever(
                search_type="similarity_score_threshold",
                search_kwargs=search_kwargs
            )
            
            # Lấy thông tin collection
            collection_info = self.qdrant_client.get_collection(
                collection_name=COLLECTION_NAME
            )
            collection_dimension = collection_info.config.params.vectors.size
            embedding_dimension = self.embedder.get_embedding_dimension()
            if collection_dimension != embedding_dimension:
                raise ValueError(
                    "Embedding dimension mismatch: "
                    f"model={embedding_dimension}, collection={collection_dimension}"
                )
            
            if VERBOSE_LOGGING:
                print(f"✅ Connected to Qdrant collection: {COLLECTION_NAME}")
                # Note: vectors_count attribute might have changed in newer Qdrant versions
                # Try to get points_count or other available attributes
                try:
                    points_count = collection_info.points_count
                    print(f"   Points count: {points_count}")
                except AttributeError:
                    try:
                        vectors_count = collection_info.vectors_count
                        print(f"   Vectors count: {vectors_count}")
                    except AttributeError:
                        print(f"   Collection info available, but count attribute not found")
                
                print(f"   Embedding dimension: {collection_info.config.params.vectors.size}")
                print(f"   Search config: k={search_kwargs['k']}, threshold={search_kwargs['score_threshold']}")
            
        except Exception as e:
            error_msg = f"Không thể khởi tạo retriever: {str(e)}"
            print(f"❌ {error_msg}")
            raise RetrievalError(error_msg) from e
    
    def _build_qdrant_filter(self, filter_conditions: Dict[str, Any]) -> Optional[Any]:
        """
        Xây dựng Qdrant filter từ dictionary conditions
        
        Args:
            filter_conditions: Dict với điều kiện lọc
            
        Returns:
            Qdrant Filter object hoặc None
        """
        if not filter_conditions or not LANGCHAIN_AVAILABLE:
            return None
        
        try:
            from qdrant_client.http import models
        except ImportError:
            return None
        
        filter_list = []
        
        for key, value in filter_conditions.items():
            if key == "is_verified":
                # Đảm bảo giá trị là boolean
                bool_value = bool(value)
                filter_list.append(
                    models.FieldCondition(
                        key="metadata.is_verified",
                        match=models.MatchValue(value=bool_value)
                    )
                )
            elif key == "weight":
                # Đảm bảo giá trị là số nguyên (float không được hỗ trợ trong MatchValue)
                int_value = int(value) if isinstance(value, (int, float)) else 1
                filter_list.append(
                    models.FieldCondition(
                        key="metadata.weight",
                        match=models.MatchValue(value=int_value)
                    )
                )
            elif key == "effective_date":
                # Có thể thêm range filter cho date nếu cần
                pass
        
        if filter_list:
            return models.Filter(must=filter_list)
        
        return None
    
    def retrieve_documents(
        self, 
        query: str, 
        k: Optional[int] = None,
        filter_conditions: Optional[Dict[str, Any]] = None
    ) -> List[Document]:
        """
        Truy xuất documents liên quan đến query
        
        Args:
            query: Câu hỏi cần tìm kiếm
            k: Số lượng documents tối đa (mặc định từ config)
            filter_conditions: Điều kiện lọc metadata
            
        Returns:
            List các Document LangChain
        """
        try:
            # Cập nhật thống kê
            self.stats["total_queries"] += 1
            
            understanding = understand_query(query)
            variants = understanding["query_variants"] or [query]
            final_k = k or LLMConfig.TOP_K
            candidate_limit = max(final_k * 4, 12)
            hits_by_id = {}

            # Search multiple deterministic variants to improve recall for short,
            # colloquial, or acronym-based Vietnamese questions.
            for variant in variants:
                query_embedding = self.embedder.embed_text(variant)
                search_result = self.qdrant_client.query_points(
                    collection_name=COLLECTION_NAME,
                    query=query_embedding.tolist(),
                    limit=candidate_limit,
                    score_threshold=self.similarity_threshold,
                    with_payload=True,
                    with_vectors=False
                )
                for hit in search_result.points:
                    point_key = str(hit.id)
                    existing = hits_by_id.get(point_key)
                    if existing is None or float(hit.score) > float(existing.score):
                        hits_by_id[point_key] = hit

            # If the question names a document, run an exact metadata-scoped
            # search as well; this prevents a generic semantic result from
            # hiding the explicitly requested legal source.
            for source_file in understanding["source_file_hints"]:
                query_embedding = self.embedder.embed_text(query)
                scoped_filter = models.Filter(
                    must=[
                        models.FieldCondition(
                            key="metadata.source_file",
                            match=models.MatchValue(value=source_file),
                        )
                    ]
                )
                scoped_result = self.qdrant_client.query_points(
                    collection_name=COLLECTION_NAME,
                    query=query_embedding.tolist(),
                    query_filter=scoped_filter,
                    limit=candidate_limit,
                    with_payload=True,
                    with_vectors=False,
                )
                for hit in scoped_result.points:
                    hits_by_id[str(hit.id)] = hit
            
            # Convert to LangChain Documents
            documents = []
            hits = list(hits_by_id.values())
            normalized_query_terms = set(
                re.findall(r"\w+", fold_text(understanding["normalized_query"]))
            )
            normalized_query = fold_text(understanding["normalized_query"])

            def ranking_score(hit):
                payload = hit.payload or {}
                content = str(payload.get("content", "")).lower()
                metadata = payload.get("metadata", {}) or {}
                searchable = fold_text(
                    f"{content} {metadata.get('title', '')} "
                    f"{metadata.get('article_title', '')} {metadata.get('source_file', '')}"
                )
                overlap = sum(
                    1 for term in normalized_query_terms
                    if len(term) > 2 and term in searchable
                )
                document_match = sum(
                    1 for hint in understanding["document_hints"]
                    if hint.lower() in searchable
                )
                article_match = bool(
                    understanding["article_number"]
                    and (
                        f"dieu {understanding['article_number']}" in fold_text(content)
                        or understanding["article_number"] == str(metadata.get("article_number", ""))
                    )
                )
                exact_phrase_match = normalized_query and normalized_query in fold_text(searchable)
                checklist_match = (
                    "checklist" in normalized_query
                    and "checklist" in fold_text(searchable)
                )
                return (
                    float(hit.score)
                    + min(overlap * 0.01, 0.08)
                    + min(document_match * 0.25, 0.25)
                    + (0.04 if article_match else 0.0)
                    + (0.35 if exact_phrase_match else 0.0)
                    + (0.25 if checklist_match else 0.0)
                )

            if self.reranker and hits:
                rerank_scores = self.reranker.predict(
                    [
                        (query, (hit.payload or {}).get("content", ""))
                        for hit in hits
                    ]
                )
                hits = [
                    hit for _, hit in sorted(
                        zip(rerank_scores, hits),
                        key=lambda item: float(item[0]),
                        reverse=True,
                    )
                ]
            else:
                hits.sort(key=ranking_score, reverse=True)

            hits = hits[:final_k]

            for hit in hits:
                payload = hit.payload or {}
                metadata = normalize_metadata(
                    payload.get("metadata", {}),
                    chunk_id=payload.get("chunk_id", ""),
                )
                metadata["retrieval_score"] = hit.score
                content = payload.get("content", "")
                
                doc = Document(
                    page_content=content,
                    metadata=metadata
                )
                documents.append(doc)
            
            # Update stats
            num_docs = len(documents)
            self.stats["total_documents_retrieved"] += num_docs
            self.stats["avg_documents_per_query"] = (
                self.stats["total_documents_retrieved"] / self.stats["total_queries"]
            )
            
            if VERBOSE_LOGGING:
                print(f"🔍 Retrieved {num_docs} documents for query: '{query[:50]}...'")
                if num_docs > 0:
                    for i, doc in enumerate(documents[:2], 1):
                        title = doc.metadata.get("title", "Unknown")
                        article = doc.metadata.get("article_number", "N/A")
                        verified = doc.metadata.get("is_verified", True)
                        print(f"   {i}. {title} - Điều {article} (verified: {verified})")
            
            return documents
            
        except Exception as e:
            error_msg = f"Lỗi khi retrieve documents: {str(e)}"
            print(f"❌ {error_msg}")
            raise RetrievalError(error_msg) from e
    
    def retrieve_with_scores(
        self, 
        query: str, 
        k: Optional[int] = None
    ) -> List[Tuple[Document, float]]:
        """
        Truy xuất documents với similarity scores
        
        Args:
            query: Câu hỏi cần tìm kiếm
            k: Số lượng documents tối đa
            
        Returns:
            List các tuple (Document, similarity_score)
        """
        try:
            # Sử dụng similarity_search_with_score của Qdrant
            if not self.vector_store:
                raise RuntimeError("Vector store chưa được khởi tạo")
            
            # Tạo embeddings cho query
            query_embedding = self.embedder.embed_text(query)
            
            # Tìm kiếm với Qdrant client trực tiếp (sử dụng query_points API mới)
            search_result = self.qdrant_client.query_points(
                collection_name=COLLECTION_NAME,
                query=query_embedding.tolist(),  # Direct vector list
                limit=k or LLMConfig.TOP_K,
                score_threshold=self.similarity_threshold,
                with_payload=True,
                with_vectors=False
            )
            
            # Convert kết quả sang LangChain Documents
            documents_with_scores = []
            for hit in search_result.points:  # query_points returns QueryResponse with .points
                # Lấy payload từ hit
                payload = hit.payload or {}
                metadata = payload.get("metadata", {})
                content = payload.get("content", "")
                
                # Tạo Document
                doc = Document(
                    page_content=content,
                    metadata=metadata
                )
                
                # Lấy similarity score (cosine similarity)
                score = hit.score
                documents_with_scores.append((doc, score))
            
            return documents_with_scores
            
        except Exception as e:
            error_msg = f"Lỗi khi retrieve với scores: {str(e)}"
            print(f"❌ {error_msg}")
            raise RetrievalError(error_msg) from e
    
    def check_unverified_documents(self, documents: List[Document]) -> Tuple[bool, List[Dict[str, Any]]]:
        """
        Kiểm tra documents có chứa content chưa kiểm chứng không
        
        Args:
            documents: List các Document
            
        Returns:
            Tuple (has_unverified, unverified_info)
        """
        has_unverified = False
        unverified_info = []
        
        for i, doc in enumerate(documents):
            metadata = doc.metadata
            
            # Kiểm tra metadata is_verified
            is_verified = metadata.get("is_verified", True)
            
            # Kiểm tra content có chứa [ĐỐI CHIẾU] không
            content = doc.page_content
            has_doi_chieu = "[ĐỐI CHIẾU]" in content or "[ĐỐI CHIẾU SỐ ĐIỀU]" in content
            
            if not is_verified or has_doi_chieu:
                has_unverified = True
                
                info = {
                    "index": i + 1,
                    "title": metadata.get("title", "Unknown"),
                    "article_number": metadata.get("article_number", "N/A"),
                    "is_verified": is_verified,
                    "has_doi_chieu": has_doi_chieu,
                    "reason": "metadata is_verified=False" if not is_verified else "contains [ĐỐI CHIẾU] tag"
                }
                unverified_info.append(info)
        
        return has_unverified, unverified_info
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """Lấy thống kê collection"""
        try:
            if not self.qdrant_client:
                return {"error": "Qdrant client not initialized"}
            
            collection_info = self.qdrant_client.get_collection(
                collection_name=COLLECTION_NAME
            )
            
            # Thử lấy points count
            try:
                count_result = self.qdrant_client.count(collection_name=COLLECTION_NAME)
                points_count = count_result.count
            except:
                points_count = 0
            
            stats = {
                "collection_name": COLLECTION_NAME,
                "points_count": points_count,  # Thay vectors_count bằng points_count
                "status": str(collection_info.status),
                "dimension": collection_info.config.params.vectors.size,
                "distance": str(collection_info.config.params.vectors.distance)
            }
            
            # Thêm thống kê retriever
            stats.update({
                "total_queries": self.stats["total_queries"],
                "total_documents_retrieved": self.stats["total_documents_retrieved"],
                "avg_documents_per_query": round(self.stats["avg_documents_per_query"], 2),
                "filtered_queries": self.stats["filtered_queries"]
            })
            
            return stats
            
        except Exception as e:
            return {"error": str(e), "collection_name": COLLECTION_NAME}
    
    def get_retriever(self) -> BaseRetriever:
        """Lấy LangChain retriever"""
        if not self.langchain_retriever:
            raise RuntimeError("Retriever chưa được khởi tạo")
        return self.langchain_retriever
    
    def close(self):
        """Đóng connection Qdrant để tránh lock file issues"""
        try:
            if self.qdrant_client:
                # Close Qdrant client
                if hasattr(self.qdrant_client, 'close'):
                    self.qdrant_client.close()
                self.qdrant_client = None
            
            if self.vector_store:
                self.vector_store = None
            
            if self.langchain_retriever:
                self.langchain_retriever = None
            
            print("✓ Retriever service closed successfully")
        except Exception as e:
            print(f"⚠️ Error closing retriever: {e}")
    
    def __del__(self):
        """Ensure cleanup when object is garbage collected"""
        try:
            self.close()
        except:
            pass


# ============ FACTORY FUNCTION & TEST ============

def create_retriever_service(
    embedder: Optional[VietnameseEmbedder] = None,
    use_metadata_filtering: Optional[bool] = None,
    similarity_threshold: Optional[float] = None
) -> LegalRetrieverService:
    """Factory function để tạo LegalRetrieverService"""
    return LegalRetrieverService(
        embedder=embedder,
        use_metadata_filtering=use_metadata_filtering,
        similarity_threshold=similarity_threshold
    )


def test_retriever_service():
    """Test chức năng retriever service"""
    print("🧪 Testing LegalRetrieverService...")
    
    try:
        # Kiểm tra dependencies
        if not LANGCHAIN_AVAILABLE:
            print("❌ LangChain not available. Please install dependencies first.")
            return None
        
        # Tạo retriever service
        retriever_service = create_retriever_service()
        
        # Lấy thống kê collection
        stats = retriever_service.get_collection_stats()
        print(f"✅ Collection stats: {stats.get('points_count', 0)} points")
        
        # Test retrieval với query mẫu
        test_queries = [
            "lương cơ sở",
            "hợp đồng lao động",
            "thời gian thử việc"
        ]
        
        for query in test_queries[:2]:  # Chỉ test 2 query đầu
            print(f"\n🔍 Testing query: '{query}'")
            
            # Retrieve documents
            documents = retriever_service.retrieve_documents(query, k=2)
            print(f"   Retrieved {len(documents)} documents")
            
            if documents:
                # Kiểm tra unverified documents
                has_unverified, unverified_info = retriever_service.check_unverified_documents(documents)
                print(f"   Has unverified content: {has_unverified}")
                
                # Hiển thị document đầu tiên
                first_doc = documents[0]
                metadata = first_doc.metadata
                print(f"   First document: {metadata.get('title', 'Unknown')} - Điều {metadata.get('article_number', 'N/A')}")
                print(f"   Verified: {metadata.get('is_verified', True)}")
                print(f"   Content preview: {first_doc.page_content[:100]}...")
        
        # Test retrieval với scores
        print(f"\n🧪 Testing retrieval with scores:")
        query = "bảo hiểm xã hội"
        docs_with_scores = retriever_service.retrieve_with_scores(query, k=2)
        
        for doc, score in docs_with_scores:
            title = doc.metadata.get("title", "Unknown")
            print(f"   Document: {title}, Score: {score:.4f}")
        
        # Print final stats
        final_stats = retriever_service.get_collection_stats()
        print(f"\n📊 Final retriever stats:")
        print(f"   Total queries: {final_stats.get('total_queries', 0)}")
        print(f"   Avg docs per query: {final_stats.get('avg_documents_per_query', 0)}")
        
        return retriever_service
        
    except Exception as e:
        print(f"❌ Error testing retriever service: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    # Test retriever service
    test_retriever_service()
