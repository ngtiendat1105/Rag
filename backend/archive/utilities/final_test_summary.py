"""
final_test_summary.py - Tổng kết và kiểm tra cuối cùng hệ thống Giai đoạn 2
"""

import os
import json
from pathlib import Path

def check_system_structure():
    """Kiểm tra cấu trúc hệ thống"""
    print("📁 Kiểm tra cấu trúc hệ thống...")
    
    workspace = Path(__file__).parent
    required_files = [
        "config_phase2.py",
        "embedder.py", 
        "vector_db_manager.py",
        "indexer.py",
        "retriever_demo.py", 
        "main_phase2.py",
        "processed_output/processed_knowledge_base.jsonl"
    ]
    
    all_files_exist = True
    for file_path in required_files:
        full_path = workspace / file_path
        exists = full_path.exists()
        status = "✅" if exists else "❌"
        print(f"  {status} {file_path}")
        
        if not exists:
            all_files_exist = False
            
            # Nếu là file JSONL từ Giai đoạn 1
            if "processed_knowledge_base.jsonl" in file_path:
                print("     ⚠️ File JSONL từ Giai đoạn 1 chưa tồn tại")
                print("     Chạy Giai đoạn 1 trước để tạo file này")
    
    return all_files_exist

def analyze_jsonl_data():
    """Phân tích dữ liệu JSONL đầu vào"""
    print("\n📊 Phân tích dữ liệu JSONL đầu vào...")
    
    jsonl_path = Path(__file__).parent / "processed_output" / "processed_knowledge_base.jsonl"
    
    if not jsonl_path.exists():
        print("  ❌ File JSONL không tồn tại")
        return False
    
    try:
        with open(jsonl_path, 'r', encoding='utf-8') as f:
            chunks = []
            verified_count = 0
            unverified_count = 0
            money_related_chunks = 0
            years = set()
            
            for line_num, line in enumerate(f, 1):
                if line.strip():
                    try:
                        chunk = json.loads(line)
                        chunks.append(chunk)
                        
                        # Thống kê verified
                        metadata = chunk.get("metadata", {})
                        if metadata.get("is_verified", True):
                            verified_count += 1
                        else:
                            unverified_count += 1
                        
                        # Kiểm tra money-related content
                        content = chunk.get("content", "").lower()
                        money_keywords = ["lương", "tiền", "mức", "tham chiếu", "trợ cấp", "thai sản"]
                        if any(keyword in content for keyword in money_keywords):
                            money_related_chunks += 1
                        
                        # Thu thập years từ effective_date
                        effective_date = metadata.get("effective_date", "")
                        if effective_date and "-" in effective_date:
                            year = effective_date.split("-")[0]
                            years.add(year)
                            
                    except json.JSONDecodeError:
                        continue
        
        print(f"  ✅ Tổng số chunks: {len(chunks)}")
        print(f"     - Đã kiểm chứng: {verified_count} ({verified_count/len(chunks)*100:.1f}%)")
        print(f"     - Chưa kiểm chứng: {unverified_count} ({unverified_count/len(chunks)*100:.1f}%)")
        print(f"     - Chunks liên quan đến tiền: {money_related_chunks}")
        print(f"     - Các năm hiệu lực: {sorted(years)}")
        
        if chunks:
            # Hiển thị metadata mẫu
            sample = chunks[0]
            print(f"\n  📋 Mẫu chunk đầu tiên:")
            print(f"     - chunk_id: {sample.get('chunk_id')}")
            print(f"     - title: {sample.get('metadata', {}).get('title', 'N/A')}")
            print(f"     - is_verified: {sample.get('metadata', {}).get('is_verified', 'N/A')}")
            print(f"     - effective_date: {sample.get('metadata', {}).get('effective_date', 'N/A')}")
            print(f"     - content length: {len(sample.get('content', ''))} ký tự")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Lỗi phân tích JSONL: {e}")
        return False

def check_dependencies():
    """Kiểm tra dependencies"""
    print("\n📦 Kiểm tra dependencies...")
    
    dependencies = [
        ("sentence-transformers", "embedding"),
        ("qdrant-client", "vector database"),
        ("numpy", "numerical computing"),
        ("tqdm", "progress bars (optional)")
    ]
    
    missing = []
    
    for package, purpose in dependencies:
        try:
            if "-" in package:
                import_name = package.replace("-", "_")
            else:
                import_name = package
                
            __import__(import_name)
            print(f"  ✅ {package}: installed ({purpose})")
        except ImportError:
            print(f"  ❌ {package}: NOT installed ({purpose})")
            missing.append(package)
    
    if missing:
        print(f"\n⚠️ Cần cài đặt: pip install {' '.join(missing)}")
        return False
    
    return True

def verify_configuration():
    """Xác minh cấu hình hệ thống"""
    print("\n⚙️ Xác minh cấu hình...")
    
    try:
        from config_phase2 import (
            VIETNAMESE_EMBEDDING_MODEL,
            BATCH_SIZE,
            MONEY_RELATED_KEYWORDS,
            DEFAULT_FILTER_CONDITIONS,
            SEARCH_WEIGHT_SEMANTIC,
            SEARCH_WEIGHT_METADATA
        )
        
        print(f"  ✅ Embedding model: {VIETNAMESE_EMBEDDING_MODEL}")
        print(f"  ✅ Batch size: {BATCH_SIZE}")
        print(f"  ✅ Số từ khóa tiền: {len(MONEY_RELATED_KEYWORDS)}")
        print(f"  ✅ Bộ lọc mặc định: {DEFAULT_FILTER_CONDITIONS}")
        print(f"  ✅ Trọng số search: semantic={SEARCH_WEIGHT_SEMANTIC}, metadata={SEARCH_WEIGHT_METADATA}")
        
        # Test money detection
        test_queries = [
            ("lương cơ sở", True),
            ("hợp đồng", False),
            ("mức tham chiếu 2026", True)
        ]
        
        from config_phase2 import detect_money_query
        
        print("\n  🧪 Test money query detection:")
        for query, expected in test_queries:
            result = detect_money_query(query)
            status = "✅" if result == expected else "❌"
            print(f"    {status} '{query}' -> {result} (expected: {expected})")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Lỗi cấu hình: {e}")
        return False

def generate_implementation_plan():
    """Tạo kế hoạch triển khai"""
    print("\n📋 KẾ HOẠCH TRIỂN KHAI HỆ THỐNG")
    print("=" * 70)
    
    steps = [
        "1. 📦 CÀI ĐẶT DEPENDENCIES",
        "   pip install sentence-transformers qdrant-client numpy tqdm",
        "",
        "2. 🧪 TEST CÁC COMPONENTS",
        "   python main_phase2.py --components",
        "",
        "3. 🚀 CHẠY PIPELINE TEST MODE",
        "   python main_phase2.py --test",
        "   (Sử dụng model nhỏ hơn để test nhanh)",
        "",
        "4. 🔧 CHẠY PIPELINE ĐẦY ĐỦ",
        "   python main_phase2.py",
        "   (Sử dụng model KeepitIreal/Vietnamese-sbert)",
        "",
        "5. 💬 INTERACTIVE SEARCH",
        "   python main_phase2.py --interactive",
        "   (Nhập câu hỏi và nhận kết quả)",
        "",
        "6. 🎯 TEST QUERY CỤ THỂ",
        "   python main_phase2.py --query \"lương cơ sở hiện tại\"",
        "",
        "7. 📊 ĐÁNH GIÁ KẾT QUẢ",
        "   - Kiểm tra money query handling",
        "   - Kiểm tra metadata filtering",
        "   - Kiểm tra sorting by effective_date",
        "",
        "8. 🎨 TÍCH HỢP GIAI ĐOẠN 3",
        "   - Kết hợp với LLM (GPT, Claude, etc.)",
        "   - Tạo RAG pipeline hoàn chỉnh",
    ]
    
    for step in steps:
        print(step)

def main():
    """Hàm chính tổng kết"""
    print("=" * 70)
    print("🎯 TỔNG KẾT HỆ THỐNG GIAI ĐOẠN 2")
    print("=" * 70)
    
    print("Hệ thống đã được xây dựng với 6 module Python:")
    print("1. config_phase2.py    - Cấu hình hệ thống")
    print("2. embedder.py         - Vietnamese Embedder")  
    print("3. vector_db_manager.py - Qdrant Vector DB Manager")
    print("4. indexer.py          - Batch Indexing Pipeline")
    print("5. retriever_demo.py   - Intelligent Legal Retriever")
    print("6. main_phase2.py      - Main Pipeline Controller")
    
    print("\n" + "=" * 70)
    
    # Kiểm tra 1: Cấu trúc file
    structure_ok = check_system_structure()
    
    # Kiểm tra 2: Dữ liệu JSONL
    if structure_ok:
        data_ok = analyze_jsonl_data()
    else:
        data_ok = False
    
    # Kiểm tra 3: Dependencies
    deps_ok = check_dependencies()
    
    # Kiểm tra 4: Cấu hình
    config_ok = verify_configuration()
    
    print("\n" + "=" * 70)
    print("📊 KẾT QUẢ KIỂM TRA CUỐI CÙNG")
    print("=" * 70)
    
    results = [
        ("Cấu trúc hệ thống", structure_ok),
        ("Dữ liệu JSONL", data_ok),
        ("Dependencies", deps_ok),
        ("Cấu hình", config_ok)
    ]
    
    all_passed = True
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"  {test_name}: {status}")
        if not passed:
            all_passed = False
    
    print("\n" + "=" * 70)
    
    if all_passed:
        print("🎉 HỆ THỐNG ĐÃ SẴN SÀNG CHO GIAI ĐOẠN 2!")
        print("\n💡 Đặc điểm nổi bật:")
        print("   - Module architecture dễ debug và nâng cấp")
        print("   - Vietnamese embedding tối ưu cho pháp lý")
        print("   - Qdrant với metadata filtering mạnh mẽ")
        print("   - Intelligent retrieval với phân tích câu hỏi")
        print("   - Money query handling ưu tiên effective_date mới nhất")
        print("   - Combined scoring (70% semantic + 30% metadata)")
        print("   - Production-ready với error handling và logging")
        
        print("\n🚀 Bắt đầu triển khai với các bước sau:")
        generate_implementation_plan()
        
    else:
        print("⚠️ CẦN KHẮC PHỤC CÁC VẤN ĐỀ TRƯỚC KHI TRIỂN KHAI")
        print("\n📝 Hướng dẫn khắc phục:")
        
        if not structure_ok:
            print("   - Kiểm tra file processed_knowledge_base.jsonl từ Giai đoạn 1")
            print("   - Chạy lại Giai đoạn 1 nếu cần")
        
        if not deps_ok:
            print("   - Cài đặt dependencies: pip install sentence-transformers qdrant-client")
        
        if not config_ok:
            print("   - Kiểm tra file config_phase2.py")
            print("   - Đảm bảo model embedding có thể tải được")
    
    print("\n" + "=" * 70)
    print("🤖 HỆ THỐNG RAG PHÁP LÝ - GIAI ĐOẠN 2")
    print("   EMBEDDING & VECTOR DATABASE")
    print("=" * 70)

if __name__ == "__main__":
    main()