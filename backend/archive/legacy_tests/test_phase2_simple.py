"""
test_phase2_simple.py - Test đơn giản hệ thống Giai đoạn 2
Kiểm tra các module có import được không và logic cơ bản
"""

import sys
import os

def test_imports():
    """Test import các module"""
    print("🧪 Testing imports of Phase 2 modules...")
    
    modules_to_test = [
        "config_phase2",
        "embedder", 
        "vector_db_manager",
        "indexer",
        "retriever_demo",
        "main_phase2"
    ]
    
    all_imports_passed = True
    
    for module_name in modules_to_test:
        try:
            __import__(module_name)
            print(f"  ✅ {module_name}: imported successfully")
        except ImportError as e:
            print(f"  ❌ {module_name}: import failed - {e}")
            all_imports_passed = False
        except Exception as e:
            print(f"  ⚠️ {module_name}: other error - {e}")
    
    return all_imports_passed

def test_config_module():
    """Test module config_phase2"""
    print("\n🧪 Testing config_phase2 module...")
    
    try:
        from config_phase2 import (
            WORKSPACE_ROOT,
            INPUT_JSONL_PATH,
            VIETNAMESE_EMBEDDING_MODEL,
            BATCH_SIZE,
            MONEY_RELATED_KEYWORDS,
            detect_money_query,
            check_input_file
        )
        
        print(f"  ✅ Config imports successful")
        print(f"     Model: {VIETNAMESE_EMBEDDING_MODEL}")
        print(f"     Batch size: {BATCH_SIZE}")
        print(f"     Money keywords: {len(MONEY_RELATED_KEYWORDS)}")
        
        # Test file check
        file_exists = check_input_file()
        print(f"     JSONL file exists: {file_exists}")
        
        # Test money detection
        test_query = "lương cơ sở hiện tại là bao nhiêu?"
        is_money = detect_money_query(test_query)
        print(f"     Money query detection: '{test_query}' -> {is_money}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Config test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_basic_logic():
    """Test logic cơ bản của các class"""
    print("\n🧪 Testing basic class logic...")
    
    try:
        # Test config detection logic
        from config_phase2 import detect_money_query
        
        test_cases = [
            ("lương cơ sở hiện tại", True),
            ("hợp đồng lao động", False),
            ("mức tham chiếu", True),
            ("thời gian thử việc", False),
            ("trợ cấp thai sản", True)
        ]
        
        print("  Testing money query detection:")
        all_passed = True
        for query, expected in test_cases:
            result = detect_money_query(query)
            status = "✅" if result == expected else "❌"
            print(f"    {status} '{query}' -> expected: {expected}, got: {result}")
            if result != expected:
                all_passed = False
        
        return all_passed
        
    except Exception as e:
        print(f"  ❌ Basic logic test failed: {e}")
        return False

def check_dependencies():
    """Kiểm tra dependencies cần thiết"""
    print("\n📦 Checking required dependencies...")
    
    dependencies = [
        ("sentence-transformers", "pip install sentence-transformers"),
        ("qdrant-client", "pip install qdrant-client"),
        ("numpy", "pip install numpy"),
        ("tqdm", "pip install tqdm (optional for progress bars)")
    ]
    
    missing_deps = []
    
    for dep, install_cmd in dependencies:
        try:
            __import__(dep.replace("-", "_"))
            print(f"  ✅ {dep}: installed")
        except ImportError:
            print(f"  ❌ {dep}: NOT installed")
            print(f"     Install with: {install_cmd}")
            missing_deps.append(dep)
    
    if missing_deps:
        print(f"\n⚠️ Missing dependencies: {', '.join(missing_deps)}")
        print("   Please install them before running full pipeline")
        return False
    else:
        print("\n✅ All dependencies are installed")
        return True

def simulate_pipeline_steps():
    """Mô phỏng các bước pipeline mà không thực sự chạy"""
    print("\n🔄 Simulating pipeline steps...")
    
    steps = [
        "1. Read JSONL file (51 chunks from Phase 1)",
        "2. Create VietnameseEmbedder with KeepitIreal/Vietnamese-sbert",
        "3. Initialize VectorDBManager with Qdrant local",
        "4. Create collection 'legal_knowledge_base'",
        "5. Process in batches (100 chunks/batch)",
        "6. Embed each chunk (768-dimensional vectors)",
        "7. Upsert to Vector DB with metadata",
        "8. Initialize LegalRetriever for search",
        "9. Test queries with smart filtering"
    ]
    
    for step in steps:
        print(f"  {step}")
    
    print("\n📊 Expected pipeline output:")
    print("  - Total chunks: 51")
    print("  - Embedding dimension: 768")
    print("  - Vector DB: Qdrant with metadata filtering")
    print("  - Smart filtering: auto-detect money queries")
    print("  - Priority: verified chunks with latest effective_date for money queries")

def main():
    """Hàm chính test"""
    print("=" * 70)
    print("🧪 COMPREHENSIVE TEST: GIAI ĐOẠN 2 - EMBEDDING & VECTOR DB")
    print("=" * 70)
    
    # Test 1: Imports
    imports_ok = test_imports()
    
    # Test 2: Config module
    config_ok = test_config_module()
    
    # Test 3: Basic logic
    logic_ok = test_basic_logic()
    
    # Test 4: Dependencies
    deps_ok = check_dependencies()
    
    # Test 5: Pipeline simulation
    simulate_pipeline_steps()
    
    # Tổng kết
    print("\n" + "=" * 70)
    print("📊 TEST SUMMARY")
    print("=" * 70)
    
    results = [
        ("Module imports", imports_ok),
        ("Config module", config_ok),
        ("Basic logic", logic_ok),
        ("Dependencies", deps_ok)
    ]
    
    all_passed = True
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"  {test_name}: {status}")
        if not passed:
            all_passed = False
    
    if all_passed:
        print("\n🎉 All tests passed! System is ready for Phase 2.")
        print("\n💡 Next steps:")
        print("   1. Install missing dependencies if any")
        print("   2. Run: python main_phase2.py --test (test mode with smaller model)")
        print("   3. Run: python main_phase2.py (full pipeline)")
        print("   4. Run: python main_phase2.py --interactive (interactive search)")
    else:
        print("\n⚠️ Some tests failed. Please fix the issues before proceeding.")
    
    print("=" * 70)

if __name__ == "__main__":
    main()