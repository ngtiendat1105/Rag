"""
main_phase2.py - File chạy chính cho Giai đoạn 2: Embedding và Vector Database
Thực thi quá trình tạo DB và test truy vấn mẫu
"""

import sys
import time
import argparse
from pathlib import Path
from typing import Optional, List, Dict, Any

from config_phase2 import (
    print_config_summary,
    check_input_file,
    VIETNAMESE_EMBEDDING_MODEL,
    VERBOSE_LOGGING
)
from embedder import create_vietnamese_embedder, VietnameseEmbedder
from vector_db_manager import create_vector_db_manager, VectorDBManager
from indexer import create_data_indexer, DataIndexer
from retriever_demo import create_legal_retriever, LegalRetriever


class Phase2Pipeline:
    """
    Class điều phối toàn bộ Giai đoạn 2: Embedding và Vector Database
    """
    
    def __init__(self, test_mode: bool = False):
        """
        Khởi tạo Phase2Pipeline
        
        Args:
            test_mode: Chế độ test (sử dụng model nhỏ hơn)
        """
        self.test_mode = test_mode
        self.embedder = None
        self.db_manager = None
        self.indexer = None
        self.retriever = None
        
        # Thống kê
        self.stats = {
            "start_time": None,
            "end_time": None,
            "total_time": 0.0,
            "indexing_stats": {},
            "retrieval_stats": {},
            "errors": []
        }
    
    def setup_components(self):
        """Thiết lập tất cả các components"""
        print("🔄 Thiết lập các components...")
        
        try:
            # Tạo embedder (sử dụng model nhỏ hơn cho test mode)
            if self.test_mode:
                test_model = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
                print(f"   Test mode: sử dụng model {test_model}")
                self.embedder = create_vietnamese_embedder(model_name=test_model)
            else:
                self.embedder = create_vietnamese_embedder()
            
            # Tạo vector DB manager
            self.db_manager = create_vector_db_manager(local_mode=True)
            
            # Tạo indexer
            self.indexer = create_data_indexer(
                embedder=self.embedder,
                db_manager=self.db_manager
            )
            
            # Tạo retriever
            self.retriever = create_legal_retriever(
                embedder=self.embedder,
                db_manager=self.db_manager
            )
            
            print("✅ Components setup completed")
            
        except Exception as e:
            error_msg = f"Lỗi thiết lập components: {e}"
            self.stats["errors"].append(error_msg)
            raise RuntimeError(error_msg)
    
    def run_indexing(self, recreate_collection: bool = True):
        """
        Chạy indexing pipeline
        
        Args:
            recreate_collection: True = xóa và tạo mới collection
        """
        print("\n" + "=" * 70)
        print("🚀 BẮT ĐẦU INDEXING PIPELINE")
        print("=" * 70)
        
        indexing_start = time.time()
        
        try:
            # Chạy indexing pipeline
            self.indexer.run_indexing_pipeline(recreate_collection=recreate_collection)
            
            # Lấy thống kê từ indexer
            self.stats["indexing_stats"] = self.indexer.get_stats()
            self.stats["indexing_errors"] = self.indexer.get_errors()
            
            indexing_time = time.time() - indexing_start
            self.stats["indexing_time"] = indexing_time
            
            print(f"\n✅ Indexing pipeline hoàn thành trong {indexing_time:.2f}s")
            
        except KeyboardInterrupt:
            print("\n\n⏹️ Indexing pipeline bị dừng bởi người dùng")
            raise
            
        except Exception as e:
            error_msg = f"Lỗi indexing pipeline: {e}"
            self.stats["errors"].append(error_msg)
            print(f"❌ {error_msg}")
            raise
    
    def test_retrieval(self, test_queries: Optional[List[str]] = None):
        """
        Test retrieval với các câu hỏi mẫu
        
        Args:
            test_queries: List câu hỏi test (mặc định dùng queries mẫu)
        """
        if test_queries is None:
            # Các câu hỏi test mẫu
            test_queries = [
                "lương cơ sở hiện tại là bao nhiêu?",
                "hợp đồng lao động cần có những nội dung gì?",
                "mức tham chiếu để tính bảo hiểm xã hội",
                "thời gian thử việc tối đa là bao lâu?",
                "trợ cấp thai sản được quy định như thế nào?"
            ]
        
        print("\n" + "=" * 70)
        print("🧪 TEST RETRIEVAL VỚI CÂU HỎI MẪU")
        print("=" * 70)
        
        retrieval_results = []
        
        for i, query in enumerate(test_queries, 1):
            print(f"\n{i}. Query: '{query}'")
            print("-" * 50)
            
            try:
                # Thực hiện search
                start_time = time.time()
                response = self.retriever.search_legal_context(query, limit=2)
                search_time = time.time() - start_time
                
                # Format kết quả
                formatted = self.retriever.format_results_for_display(response)
                
                # Lưu kết quả
                result_info = {
                    "query": query,
                    "search_time": search_time,
                    "total_results": response.get("total_results_found", 0),
                    "returned_results": response.get("returned_results", 0),
                    "query_analysis": response.get("query_analysis", {}),
                    "top_result_score": None,
                    "top_result_date": None
                }
                
                # Lấy thông tin top result
                results = response.get("results", [])
                if results:
                    top_result = results[0]
                    result_info["top_result_score"] = top_result.get("combined_score", 0)
                    result_info["top_result_date"] = top_result.get("metadata", {}).get("effective_date", "")
                
                retrieval_results.append(result_info)
                
                # Hiển thị kết quả tóm tắt
                lines = formatted.split('\n')
                for line in lines[:8]:  # Hiển thị 8 dòng đầu
                    print(f"   {line}")
                
                if len(lines) > 8:
                    print(f"   ... và {len(lines) - 8} dòng khác")
                
                print(f"\n   ⏱️ Search time: {search_time:.2f}s")
                
            except Exception as e:
                error_msg = f"Lỗi với query '{query}': {e}"
                print(f"   ❌ {error_msg}")
                self.stats["errors"].append(error_msg)
                continue
        
        # Tổng kết test retrieval
        print("\n" + "=" * 70)
        print("📊 TỔNG KẾT RETRIEVAL TEST")
        print("=" * 70)
        
        successful_queries = [r for r in retrieval_results if r["total_results"] > 0]
        
        if successful_queries:
            avg_search_time = sum(r["search_time"] for r in successful_queries) / len(successful_queries)
            avg_results = sum(r["total_results"] for r in successful_queries) / len(successful_queries)
            
            print(f"✅ {len(successful_queries)}/{len(test_queries)} queries thành công")
            print(f"   Thời gian search trung bình: {avg_search_time:.2f}s")
            print(f"   Số kết quả trung bình/query: {avg_results:.1f}")
            
            # Phân tích money queries
            money_queries = [r for r in successful_queries if r["query_analysis"].get("is_money_query")]
            if money_queries:
                print(f"\n💰 {len(money_queries)} queries về tiền:")
                for r in money_queries:
                    keywords = r["query_analysis"].get("money_keywords", [])
                    print(f"   - '{r['query']}' (keywords: {keywords})")
                    if r["top_result_date"]:
                        print(f"     Top result date: {r['top_result_date']}")
        
        # Lấy thống kê từ retriever
        self.stats["retrieval_stats"] = self.retriever.get_stats()
        self.stats["retrieval_test_results"] = retrieval_results
        
        print("\n✅ Retrieval test hoàn thành")
    
    def run_complete_pipeline(self, recreate_collection: bool = True):
        """
        Chạy toàn bộ pipeline Giai đoạn 2
        
        Args:
            recreate_collection: True = xóa và tạo mới collection
        """
        self.stats["start_time"] = time.time()
        
        try:
            # Hiển thị cấu hình
            print_config_summary()
            
            # Kiểm tra file đầu vào
            if not check_input_file():
                print("❌ Không thể tiếp tục vì file đầu vào không tồn tại")
                print("   Vui lòng chạy Giai đoạn 1 trước để tạo file processed_knowledge_base.jsonl")
                return
            
            # Thiết lập components
            self.setup_components()
            
            # Chạy indexing
            self.run_indexing(recreate_collection=recreate_collection)
            
            # Test retrieval
            self.test_retrieval()
            
            # Tổng kết
            self._print_final_summary()
            
        except KeyboardInterrupt:
            print("\n\n⏹️ Pipeline bị dừng bởi người dùng")
            self._print_final_summary()
            
        except Exception as e:
            print(f"\n❌ Lỗi trong pipeline: {e}")
            self._print_final_summary()
            raise
    
    def _print_final_summary(self):
        """In tổng kết cuối cùng"""
        self.stats["end_time"] = time.time()
        self.stats["total_time"] = self.stats["end_time"] - self.stats["start_time"]
        
        print("\n" + "=" * 70)
        print("🎉 TỔNG KẾT GIAI ĐOẠN 2: HOÀN THÀNH")
        print("=" * 70)
        
        print(f"⏱️ Tổng thời gian: {self.stats['total_time']:.2f}s")
        
        # Thống kê indexing
        indexing_stats = self.stats.get("indexing_stats", {})
        if indexing_stats:
            print(f"\n📈 Indexing statistics:")
            print(f"  - Tổng chunks indexed: {indexing_stats.get('total_chunks_indexed', 0)}")
            print(f"  - Tổng batches: {indexing_stats.get('total_batches', 0)}")
            print(f"  - Thời gian embedding: {indexing_stats.get('embedding_time', 0):.2f}s")
            print(f"  - Thời gian indexing: {indexing_stats.get('indexing_time', 0):.2f}s")
        
        # Thống kê retrieval
        retrieval_stats = self.stats.get("retrieval_stats", {})
        if retrieval_stats:
            print(f"\n🔍 Retrieval statistics:")
            print(f"  - Tổng queries test: {retrieval_stats.get('total_queries', 0)}")
            print(f"  - Money queries: {retrieval_stats.get('money_queries', 0)}")
            print(f"  - Thời gian search trung bình: {retrieval_stats.get('avg_search_time', 0):.2f}s")
        
        # Vector DB info
        try:
            if self.db_manager:
                db_stats = self.db_manager.get_collection_stats()
                print(f"\n🗄️ Vector Database:")
                print(f"  - Collection: {db_stats.get('collection_name', 'N/A')}")
                print(f"  - Vectors count: {db_stats.get('vectors_count', 0)}")
                print(f"  - Dimension: {db_stats.get('dimension', 0)}")
                print(f"  - Distance metric: {db_stats.get('distance', 'N/A')}")
        except Exception as e:
            print(f"\n⚠️ Không thể lấy Vector DB stats: {e}")
        
        # Hiển thị lỗi nếu có
        errors = self.stats.get("errors", [])
        if errors:
            print(f"\n⚠️ Lỗi trong quá trình xử lý ({len(errors)}):")
            for i, error in enumerate(errors[:5], 1):
                print(f"  {i}. {error[:100]}...")
            if len(errors) > 5:
                print(f"  ... và {len(errors) - 5} lỗi khác")
        
        print(f"\n✅ Giai đoạn 2: Embedding và Vector Database đã hoàn thành!")
        print("=" * 70)


def test_individual_components():
    """Test từng component riêng biệt"""
    print("🧪 TEST CÁC COMPONENTS RIÊNG BIỆT")
    print("=" * 70)
    
    try:
        # Test embedder
        print("\n1. Testing VietnameseEmbedder...")
        embedder = create_vietnamese_embedder()
        model_info = embedder.get_model_info()
        print(f"   ✅ Model: {model_info['model_name']}")
        print(f"   ✅ Dimension: {model_info['embedding_dimension']}")
        
        # Test vector DB
        print("\n2. Testing VectorDBManager...")
        db_manager = create_vector_db_manager()
        print(f"   ✅ Vector DB manager created")
        
        # Test indexer
        print("\n3. Testing DataIndexer...")
        indexer = create_data_indexer(embedder=embedder, db_manager=db_manager)
        print(f"   ✅ DataIndexer created")
        
        # Test retriever
        print("\n4. Testing LegalRetriever...")
        retriever = create_legal_retriever(embedder=embedder, db_manager=db_manager)
        print(f"   ✅ LegalRetriever created")
        
        print("\n✅ Tất cả components test passed!")
        
    except Exception as e:
        print(f"❌ Component test failed: {e}")
        import traceback
        traceback.print_exc()


def interactive_search_mode():
    """Chế độ interactive search"""
    print("\n" + "=" * 70)
    print("💬 CHẾ ĐỘ INTERACTIVE SEARCH")
    print("=" * 70)
    print("Nhập câu hỏi để tìm kiếm (hoặc 'quit' để thoát)")
    print("-" * 70)
    
    try:
        # Khởi tạo pipeline
        pipeline = Phase2Pipeline()
        pipeline.setup_components()
        
        while True:
            # Nhập query từ user
            query = input("\n❓ Câu hỏi của bạn: ").strip()
            
            if query.lower() in ['quit', 'exit', 'q']:
                print("👋 Tạm biệt!")
                break
            
            if not query:
                print("⚠️ Vui lòng nhập câu hỏi")
                continue
            
            try:
                # Thực hiện search
                start_time = time.time()
                response = pipeline.retriever.search_legal_context(query, limit=3)
                search_time = time.time() - start_time
                
                # Format và hiển thị kết quả
                formatted = pipeline.retriever.format_results_for_display(response)
                print("\n" + formatted)
                
                print(f"\n⏱️ Thời gian tìm kiếm: {search_time:.2f}s")
                
            except Exception as e:
                print(f"❌ Lỗi khi tìm kiếm: {e}")
                continue
    
    except Exception as e:
        print(f"❌ Lỗi khởi tạo interactive mode: {e}")
        import traceback
        traceback.print_exc()


def main():
    """Hàm chính điều phối Giai đoạn 2"""
    parser = argparse.ArgumentParser(
        description='Giai đoạn 2: Embedding và Vector Database cho hệ thống RAG pháp lý'
    )
    
    parser.add_argument(
        '--test',
        action='store_true',
        help='Chế độ test (sử dụng model nhỏ hơn)'
    )
    
    parser.add_argument(
        '--components',
        action='store_true',
        help='Test các components riêng biệt'
    )
    
    parser.add_argument(
        '--interactive',
        action='store_true',
        help='Chế độ interactive search'
    )
    
    parser.add_argument(
        '--skip-indexing',
        action='store_true',
        help='Bỏ qua indexing (chỉ test retrieval)'
    )
    
    parser.add_argument(
        '--keep-collection',
        action='store_true',
        help='Giữ collection cũ (không xóa và tạo mới)'
    )
    
    parser.add_argument(
        '--query',
        type=str,
        help='Test một query cụ thể (ví dụ: --query "lương cơ sở hiện tại")'
    )
    
    args = parser.parse_args()
    
    try:
        # Hiển thị thông tin hệ thống
        print("\n" + "=" * 70)
        print("🤖 GIAI ĐOẠN 2: EMBEDDING & VECTOR DATABASE")
        print("=" * 70)
        print(f"Model embedding: {VIETNAMESE_EMBEDDING_MODEL}")
        print(f"Test mode: {args.test}")
        print("=" * 70)
        
        # Chế độ test components
        if args.components:
            test_individual_components()
            return
        
        # Chế độ interactive search
        if args.interactive:
            interactive_search_mode()
            return
        
        # Tạo pipeline
        pipeline = Phase2Pipeline(test_mode=args.test)
        
        # Test query cụ thể
        if args.query:
            print(f"\n🔍 Testing query: '{args.query}'")
            pipeline.setup_components()
            
            # Test retrieval với query cụ thể
            response = pipeline.retriever.search_legal_context(args.query, limit=5)
            formatted = pipeline.retriever.format_results_for_display(response)
            print("\n" + formatted)
            return
        
        # Chạy toàn bộ pipeline
        recreate_collection = not args.keep_collection
        
        if args.skip_indexing:
            # Chỉ test retrieval
            print("\n📊 Chế độ chỉ test retrieval (bỏ qua indexing)")
            pipeline.setup_components()
            pipeline.test_retrieval()
        else:
            # Chạy toàn bộ pipeline
            pipeline.run_complete_pipeline(recreate_collection=recreate_collection)
    
    except KeyboardInterrupt:
        print("\n\n⏹️ Chương trình bị dừng bởi người dùng")
        sys.exit(0)
    
    except Exception as e:
        print(f"\n❌ Lỗi không mong muốn: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()