"""
retriever_demo.py - Logic truy xuất kết hợp Semantic Search + Metadata Filtering
Triển khai hàm search_legal_context với phân tích câu hỏi thông minh và bộ lọc metadata
"""

import re
import time
import os
from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from datetime import datetime

from config_phase2 import (
    detect_money_query,
    get_money_keywords_in_query,
    DEFAULT_FILTER_CONDITIONS,
    MAX_SEARCH_RESULTS,
    MIN_SIMILARITY_THRESHOLD,
    SEARCH_WEIGHT_SEMANTIC,
    SEARCH_WEIGHT_METADATA,
    VERBOSE_LOGGING
)
from embedder import create_vietnamese_embedder, VietnameseEmbedder
from vector_db_manager import create_vector_db_manager, VectorDBManager
from metadata_utils import normalize_metadata

try:
    from sentence_transformers import CrossEncoder
except ImportError:
    CrossEncoder = None


class LegalRetriever:
    """
    Class thực hiện truy xuất thông tin pháp lý với semantic search và metadata filtering
    Tự động phân tích câu hỏi để áp dụng bộ lọc thích hợp
    """
    
    def __init__(
        self,
        embedder: Optional[VietnameseEmbedder] = None,
        db_manager: Optional[VectorDBManager] = None
    ):
        """
        Khởi tạo LegalRetriever
        
        Args:
            embedder: VietnameseEmbedder instance (tạo mới nếu None)
            db_manager: VectorDBManager instance (tạo mới nếu None)
        """
        # Khởi tạo embedder
        self.embedder = embedder or create_vietnamese_embedder()
        
        # Khởi tạo vector DB manager
        self.db_manager = db_manager or create_vector_db_manager(local_mode=True)
        
        # Kiểm tra collection tồn tại
        self._check_collection_exists()
        
        # Pattern để trích xuất số năm từ effective_date
        self.year_pattern = re.compile(r'(\d{4})-\d{2}-\d{2}')
        
        # Thống kê
        self.stats = {
            "total_queries": 0,
            "money_queries": 0,
            "avg_search_time": 0.0
        }
        reranker_name = os.getenv("RAG_RERANKER_MODEL", "").strip()
        self.reranker = (
            CrossEncoder(reranker_name)
            if reranker_name and CrossEncoder is not None
            else None
        )
        
        if VERBOSE_LOGGING:
            print("✅ LegalRetriever initialized")
    
    def _check_collection_exists(self):
        """Kiểm tra collection có tồn tại không"""
        try:
            # Sử dụng internal method của db_manager
            collection_info = self.db_manager.get_collection_stats()
            
            # Kiểm tra collection tồn tại (không dùng vectors_count nữa vì API đã thay đổi)
            if "error" in collection_info or "collection_name" not in collection_info:
                raise RuntimeError(f"Collection không tồn tại hoặc chưa được tạo")
            
            # Kiểm tra bằng cách đếm points
            try:
                from qdrant_client import QdrantClient
                client = QdrantClient(path=str(self.db_manager.vector_db_path))
                count_result = client.count(collection_name=self.db_manager.collection_name)
                
                if VERBOSE_LOGGING:
                    print(f"   Collection stats: {count_result.count} points")
                    
            except Exception as count_error:
                # Nếu không đếm được, vẫn coi như collection tồn tại
                if VERBOSE_LOGGING:
                    print(f"   Collection exists but cannot count points: {count_error}")
                
        except Exception as e:
            error_msg = f"Không thể truy cập Vector DB: {e}"
            print(f"❌ {error_msg}")
            print("   Vui lòng chạy indexing pipeline trước để tạo collection và thêm dữ liệu")
            raise RuntimeError(error_msg)
    
    def analyze_query(self, query_text: str) -> Dict[str, Any]:
        """
        Phân tích câu hỏi để xác định loại bộ lọc cần áp dụng
        
        Args:
            query_text: Câu hỏi người dùng
            
        Returns:
            Dict với thông tin phân tích
        """
        analysis = {
            "is_money_query": False,
            "money_keywords": [],
            "requires_latest_effective_date": False,
            "requires_verified_content": True,  # Mặc định luôn yêu cầu verified
            "query_type": "general"
        }
        
        # Phát hiện câu hỏi về tiền
        is_money = detect_money_query(query_text)
        analysis["is_money_query"] = is_money
        
        if is_money:
            analysis["money_keywords"] = get_money_keywords_in_query(query_text)
            analysis["requires_latest_effective_date"] = True
            analysis["query_type"] = "money_related"
            
            if VERBOSE_LOGGING:
                print(f"💰 Money query detected: {analysis['money_keywords']}")
        
        # Phát hiện câu hỏi yêu cầu thông tin mới nhất (có từ "hiện tại", "mới nhất", etc.)
        latest_indicators = ["hiện tại", "mới nhất", "hiện nay", "hiện hành", "đang áp dụng"]
        query_lower = query_text.lower()
        
        for indicator in latest_indicators:
            if indicator in query_lower:
                analysis["requires_latest_effective_date"] = True
                analysis["query_type"] = "requires_latest"
                break
        
        return analysis
    
    def build_filter_conditions(self, query_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Xây dựng bộ lọc metadata dựa trên phân tích câu hỏi
        
        Args:
            query_analysis: Kết quả phân tích từ analyze_query
            
        Returns:
            Dict với các điều kiện lọc metadata
        """
        # Bắt đầu với bộ lọc mặc định (ưu tiên content đã kiểm chứng)
        filter_conditions = DEFAULT_FILTER_CONDITIONS.copy()
        
        # Áp dụng các điều kiện đặc biệt dựa trên phân tích
        if query_analysis["requires_verified_content"]:
            filter_conditions["is_verified"] = True
        
        # Đối với câu hỏi về tiền, KHÔNG áp dụng filter effective_date ở Qdrant level
        # Thay vào đó, chúng ta sẽ sort kết quả theo effective_date ở application level
        # Vì Qdrant không hỗ trợ sort trực tiếp theo payload field
        
        if VERBOSE_LOGGING:
            print(f"🔍 Filter conditions: {filter_conditions}")
        
        return filter_conditions
    
    def extract_year_from_date(self, date_str: str) -> Optional[int]:
        """
        Trích xuất năm từ chuỗi date (YYYY-MM-DD)
        
        Args:
            date_str: Chuỗi date
            
        Returns:
            Năm dưới dạng integer hoặc None nếu không thể parse
        """
        if not date_str:
            return None
        
        match = self.year_pattern.match(date_str)
        if match:
            return int(match.group(1))
        
        # Thử parse với các định dạng khác
        try:
            # Thử parse với datetime
            for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d"]:
                try:
                    dt = datetime.strptime(date_str, fmt)
                    return dt.year
                except ValueError:
                    continue
        except Exception:
            pass
        
        return None
    
    def sort_by_effective_date(self, results: List[Dict[str, Any]], descending: bool = True) -> List[Dict[str, Any]]:
        """
        Sắp xếp kết quả theo effective_date (mới nhất đầu tiên)
        
        Args:
            results: List kết quả từ search
            descending: True = mới nhất đầu tiên, False = cũ nhất đầu tiên
            
        Returns:
            List kết quả đã sắp xếp
        """
        def get_date_key(result):
            metadata = result.get("metadata", {})
            date_str = metadata.get("effective_date", "")
            year = self.extract_year_from_date(date_str)
            
            # Trả về (year, score) để sort theo năm rồi score
            # Nếu không có year, đặt ở cuối
            return (year if year is not None else -1, result.get("score", 0))
        
        # Sắp xếp theo effective_date (năm) và score
        sorted_results = sorted(
            results,
            key=get_date_key,
            reverse=descending  # Mới nhất (năm lớn) đầu tiên
        )
        
        return sorted_results
    
    def rerank_by_combined_score(
        self, 
        results: List[Dict[str, Any]], 
        query_analysis: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Tái xếp hạng kết quả dựa trên combined score (semantic + metadata)
        
        Args:
            results: List kết quả từ semantic search
            query_analysis: Phân tích câu hỏi
            
        Returns:
            List kết quả đã tái xếp hạng
        """
        if not results:
            return []
        
        reranked_results = []
        query_text = query_analysis.get("query_text", "")
        rerank_scores = (
            self.reranker.predict(
                [(query_text, result.get("content", "")) for result in results]
            )
            if self.reranker
            else [None] * len(results)
        )

        for result, rerank_score in zip(results, rerank_scores):
            base_score = result.get("score", 0.0)
            metadata = normalize_metadata(result.get("metadata", {}))
            
            # Tính metadata score
            metadata_score = 0.0
            
            # Ưu tiên content đã kiểm chứng
            if metadata.get("is_verified", True):
                metadata_score += 0.3
            
            # Ưu tiên content có weight cao
            weight = metadata.get("weight", 1.0)
            metadata_score += (weight * 0.2)  # weight 1.0 => +0.2, 0.5 => +0.1
            
            # Đối với câu hỏi về tiền: ưu tiên effective_date mới nhất
            if query_analysis["is_money_query"]:
                date_str = metadata.get("effective_date", "")
                year = self.extract_year_from_date(date_str)
                
                if year is not None:
                    # Ưu tiên năm gần đây (2026 > 2025 > 2024, etc.)
                    # Giả sử current_year là 2026
                    current_year = 2026
                    year_diff = abs(year - current_year)
                    
                    # Càng gần current_year càng được điểm cao
                    year_score = max(0, 1.0 - (year_diff * 0.2))  # Mỗi năm cách giảm 0.2 điểm
                    metadata_score += year_score * 0.5  # Trọng số cao cho năm hiệu lực
            
            # Kết hợp scores
            combined_score = (
                base_score * SEARCH_WEIGHT_SEMANTIC + 
                metadata_score * SEARCH_WEIGHT_METADATA
            )
            if rerank_score is not None:
                combined_score = float(rerank_score)
            
            # Tạo result mới với combined score
            reranked_result = result.copy()
            reranked_result["combined_score"] = combined_score
            reranked_result["base_score"] = base_score
            reranked_result["metadata_score"] = metadata_score
            if rerank_score is not None:
                reranked_result["rerank_score"] = float(rerank_score)
            
            reranked_results.append(reranked_result)
        
        # Sắp xếp theo combined score
        reranked_results.sort(key=lambda x: x["combined_score"], reverse=True)
        
        return reranked_results
    
    def search_legal_context(self, query_text: str, limit: int = None) -> Dict[str, Any]:
        """
        Tìm kiếm ngữ cảnh pháp lý với semantic search và metadata filtering thông minh
        
        Args:
            query_text: Câu hỏi người dùng
            limit: Số kết quả tối đa (mặc định từ config)
            
        Returns:
            Dict với kết quả tìm kiếm và metadata
        """
        if not query_text or not query_text.strip():
            raise ValueError("Query text cannot be empty")
        
        search_start_time = time.time()
        
        try:
            # Cập nhật thống kê
            self.stats["total_queries"] += 1
            
            # Phân tích câu hỏi
            query_analysis = self.analyze_query(query_text)
            query_analysis["query_text"] = query_text
            
            if query_analysis["is_money_query"]:
                self.stats["money_queries"] += 1
            
            # Bước 1: Tạo embedding cho query
            if VERBOSE_LOGGING:
                print(f"\n🔍 Searching for: '{query_text}'")
                print(f"   Query type: {query_analysis['query_type']}")
            
            query_embedding = self.embedder.embed_text(query_text)
            
            # Bước 2: Xây dựng filter conditions
            filter_conditions = self.build_filter_conditions(query_analysis)
            
            # Bước 3: Tìm kiếm trong Vector DB với filter
            search_limit = limit or MAX_SEARCH_RESULTS
            
            # Tăng limit để có nhiều kết quả cho việc reranking
            initial_search_limit = search_limit * 2
            
            semantic_results = self.db_manager.search_vectors(
                query_vector=query_embedding,
                limit=initial_search_limit,
                filter_conditions=filter_conditions,
                score_threshold=MIN_SIMILARITY_THRESHOLD
            )
            
            if VERBOSE_LOGGING:
                print(f"   Found {len(semantic_results)} semantic results")
            
            # Bước 4: Tái xếp hạng kết quả với combined scoring
            reranked_results = self.rerank_by_combined_score(semantic_results, query_analysis)
            
            # Bước 5: Áp dụng sorting theo effective_date nếu cần
            if query_analysis["requires_latest_effective_date"]:
                reranked_results = self.sort_by_effective_date(reranked_results, descending=True)
                
                if VERBOSE_LOGGING:
                    print(f"   Sorted by effective_date (newest first)")
            
            # Bước 6: Giới hạn số lượng kết quả trả về
            final_results = reranked_results[:search_limit]
            
            # Bước 7: Tính thời gian search
            search_time = time.time() - search_start_time
            self.stats["avg_search_time"] = (
                (self.stats["avg_search_time"] * (self.stats["total_queries"] - 1) + search_time) / 
                self.stats["total_queries"]
            )
            
            # Bước 8: Chuẩn bị response
            response = {
                "query": query_text,
                "query_analysis": query_analysis,
                "search_time_seconds": search_time,
                "total_results_found": len(semantic_results),
                "returned_results": len(final_results),
                "results": final_results,
                "filter_applied": filter_conditions,
                "search_config": {
                    "min_similarity_threshold": MIN_SIMILARITY_THRESHOLD,
                    "semantic_weight": SEARCH_WEIGHT_SEMANTIC,
                    "metadata_weight": SEARCH_WEIGHT_METADATA
                }
            }
            
            # Thêm debug info nếu VERBOSE_LOGGING
            if VERBOSE_LOGGING and final_results:
                print(f"✅ Search completed in {search_time:.2f}s")
                print(f"   Returned {len(final_results)} results")
                
                # Hiển thị top result
                top_result = final_results[0]
                print(f"\n🏆 Top result:")
                print(f"   Combined score: {top_result.get('combined_score', 0):.4f}")
                print(f"   Base score: {top_result.get('base_score', 0):.4f}")
                print(f"   Title: {top_result.get('metadata', {}).get('title', 'N/A')}")
                print(f"   Article: {top_result.get('metadata', {}).get('article_number', 'N/A')}")
                print(f"   Verified: {top_result.get('metadata', {}).get('is_verified', 'N/A')}")
                print(f"   Effective date: {top_result.get('metadata', {}).get('effective_date', 'N/A')}")
                print(f"   Content preview: {top_result.get('content', '')[:150]}...")
            
            return response
            
        except Exception as e:
            error_msg = f"Lỗi khi search: {e}"
            print(f"❌ {error_msg}")
            
            # Trả về response với lỗi
            return {
                "query": query_text,
                "error": str(e),
                "search_time_seconds": time.time() - search_start_time,
                "total_results_found": 0,
                "returned_results": 0,
                "results": []
            }
    
    def format_results_for_display(self, search_response: Dict[str, Any]) -> str:
        """
        Format kết quả search để hiển thị cho người dùng
        
        Args:
            search_response: Response từ search_legal_context
            
        Returns:
            String được format để hiển thị
        """
        if "error" in search_response:
            return f"❌ Lỗi: {search_response['error']}"
        
        results = search_response.get("results", [])
        if not results:
            return "ℹ️ Không tìm thấy kết quả phù hợp."
        
        output_lines = []
        
        # Header
        output_lines.append(f"🔍 Kết quả tìm kiếm cho: '{search_response['query']}'")
        output_lines.append(f"📊 Tìm thấy {search_response['total_results_found']} kết quả, hiển thị {search_response['returned_results']} kết quả tốt nhất")
        output_lines.append(f"⏱️ Thời gian tìm kiếm: {search_response['search_time_seconds']:.2f}s")
        output_lines.append("")
        
        # Query analysis
        analysis = search_response.get("query_analysis", {})
        if analysis.get("is_money_query"):
            output_lines.append("💰 **Câu hỏi về mức tiền/phí/lương**")
            output_lines.append(f"   Từ khóa phát hiện: {', '.join(analysis.get('money_keywords', []))}")
            output_lines.append("   ⚡ Ưu tiên thông tin có hiệu lực mới nhất")
            output_lines.append("")
        
        # Results
        for i, result in enumerate(results, 1):
            metadata = result.get("metadata", {})
            content = result.get("content", "")
            
            output_lines.append(f"### Kết quả {i}: {metadata.get('title', 'N/A')}")
            output_lines.append(f"**Điểm tổng hợp:** {result.get('combined_score', 0):.4f}")
            output_lines.append(f"**Điểm ngữ nghĩa:** {result.get('base_score', 0):.4f}")
            output_lines.append(f"**Điểm metadata:** {result.get('metadata_score', 0):.4f}")
            
            # Metadata info
            meta_info = []
            if metadata.get("article_number"):
                meta_info.append(f"Điều {metadata['article_number']}")
            if metadata.get("doc_id"):
                meta_info.append(f"Mã văn bản: {metadata['doc_id']}")
            if metadata.get("effective_date"):
                meta_info.append(f"Hiệu lực từ: {metadata['effective_date']}")
            if metadata.get("is_verified") is not None:
                verified_status = "✅ Đã kiểm chứng" if metadata['is_verified'] else "⚠️ Chưa kiểm chứng"
                meta_info.append(verified_status)
            if metadata.get("weight"):
                meta_info.append(f"Trọng số: {metadata['weight']}")
            
            if meta_info:
                output_lines.append("**Thông tin:** " + " | ".join(meta_info))
            
            # Content preview (cắt ngắn nếu quá dài)
            content_preview = content[:300] + "..." if len(content) > 300 else content
            output_lines.append(f"**Nội dung:** {content_preview}")
            output_lines.append("---")
        
        return "\n".join(output_lines)
    
    def get_stats(self) -> Dict[str, Any]:
        """Lấy thống kê retriever"""
        return self.stats.copy()


# ============ FACTORY FUNCTION & DEMO ============

def create_legal_retriever(
    embedder: Optional[VietnameseEmbedder] = None,
    db_manager: Optional[VectorDBManager] = None
) -> LegalRetriever:
    """Factory function để tạo LegalRetriever"""
    return LegalRetriever(embedder=embedder, db_manager=db_manager)


def demo_retrieval():
    """Demo chức năng retrieval với các câu hỏi mẫu"""
    print("🧪 Demo LegalRetriever với các câu hỏi mẫu...")
    
    try:
        # Tạo retriever
        retriever = create_legal_retriever()
        
        # Các câu hỏi demo
        demo_queries = [
            "lương cơ sở hiện tại là bao nhiêu?",
            "mức tham chiếu để tính bảo hiểm xã hội năm 2026",
            "hợp đồng lao động cần có những nội dung gì?",
            "thời gian thử việc tối đa là bao lâu?",
            "trợ cấp thai sản được quy định như thế nào?"
        ]
        
        print(f"\n📋 Demo với {len(demo_queries)} câu hỏi mẫu:")
        print("=" * 70)
        
        for i, query in enumerate(demo_queries, 1):
            print(f"\n{i}. Query: '{query}'")
            print("-" * 50)
            
            try:
                # Thực hiện search
                response = retriever.search_legal_context(query, limit=3)
                
                # Format và hiển thị kết quả
                formatted = retriever.format_results_for_display(response)
                
                # Chỉ hiển thị phần tóm tắt
                lines = formatted.split('\n')
                for line in lines[:10]:  # Hiển thị 10 dòng đầu
                    print(f"   {line}")
                
                if len(lines) > 10:
                    print(f"   ... và {len(lines) - 10} dòng khác")
                
                print()
                
            except Exception as e:
                print(f"   ❌ Lỗi với query '{query}': {e}")
                continue
        
        # Hiển thị thống kê
        stats = retriever.get_stats()
        print(f"\n📊 Thống kê retriever:")
        print(f"   Tổng queries: {stats['total_queries']}")
        print(f"   Money queries: {stats['money_queries']}")
        print(f"   Thời gian search trung bình: {stats['avg_search_time']:.2f}s")
        
        return retriever
        
    except Exception as e:
        print(f"❌ Error in demo: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    # Demo retrieval
    demo_retrieval()