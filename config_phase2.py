"""
config_phase2.py - Cấu hình hệ thống Giai đoạn 2: Embedding và Vector Database
Chứa model, đường dẫn DB, batch_size, và từ khóa nhận diện câu hỏi về "mức tiền"
"""

import os
from pathlib import Path

# ============ CẤU HÌNH ĐƯỜNG DẪN ============

# Đường dẫn gốc workspace
WORKSPACE_ROOT = Path(__file__).parent

# Đường dẫn đến file JSONL đầu vào từ Giai đoạn 1
INPUT_JSONL_PATH = WORKSPACE_ROOT / "processed_output" / "processed_knowledge_base.jsonl"

# Thư mục chứa Vector Database (Qdrant local)
VECTOR_DB_DIR = WORKSPACE_ROOT / "vector_db"
VECTOR_DB_DIR.mkdir(exist_ok=True)

# Qdrant collection name
COLLECTION_NAME = "legal_knowledge_base"

# ============ CẤU HÌNH MODEL EMBEDDING ============

# Model sentence-transformers tối ưu cho tiếng Việt
# Các lựa chọn tốt:
# 1. "bkai-foundation-models/vietnamese-bi-encoder" - Model của BKAI
# 2. "KeepitIreal/Vietnamese-sbert" - Model Sentence-BERT cho tiếng Việt
# 3. "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2" - Multilingual
VIETNAMESE_EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"

# Kích thước vector embedding (phụ thuộc vào model)
# KeepitIreal/Vietnamese-sbert: 768 dimensions
EMBEDDING_DIMENSION = 768

# Device cho inference (cuda nếu có GPU, cpu nếu không)
EMBEDDING_DEVICE = "cpu"  # Có thể đổi thành "cuda" nếu có GPU

# ============ CẤU HÌNH BATCH PROCESSING ============

# Kích thước batch để xử lý (tránh tràn RAM)
# 100 chunks/batch là hợp lý cho RAM 8-16GB
BATCH_SIZE = 100

# Số kết quả tối đa trả về khi search
MAX_SEARCH_RESULTS = 5

# ============ TỪ KHÓA NHẬN DIỆN CÂU HỎI VỀ "MỨC TIỀN" ============

# Các từ khóa liên quan đến tiền bạc - để áp dụng bộ lọc "Mốc hiệu lực mới nhất"
MONEY_RELATED_KEYWORDS = [
    "lương", "tiền", "mức", "thang", "bảng", 
    "lương cơ sở", "lương tối thiểu", "mức tham chiếu",
    "trợ cấp", "phụ cấp", "tiền thưởng", "tiền công",
    "thai sản", "ốm đau", "tai nạn", "hưu trí",
    "bảo hiểm", "đóng bảo hiểm", "mức đóng",
    "tiền lương", "lương cơ bản", "lương tối đa",
    "lương vùng", "lương khu vực"
]

# Trọng số ưu tiên cho semantic search vs metadata filtering
# 0.0 = chỉ dựa vào metadata filter, 1.0 = chỉ dựa vào semantic similarity
SEARCH_WEIGHT_SEMANTIC = 0.7
SEARCH_WEIGHT_METADATA = 0.3

# ============ CẤU HÌNH METADATA FILTERING ============

# Metadata keys quan trọng cho filtering
METADATA_KEYS_FOR_FILTERING = [
    "is_verified",
    "weight", 
    "effective_date",
    "doc_id",
    "title",
    "domain",
    "status"
]

# Bộ lọc mặc định: luôn ưu tiên chunk đã kiểm chứng và có trọng số cao
# Lưu ý: weight sử dụng integer thay vì float để tương thích với Qdrant MatchValue
DEFAULT_FILTER_CONDITIONS = {
    "is_verified": True,
    "weight": 1
}

# Ngưỡng similarity tối thiểu (cosine similarity)
MIN_SIMILARITY_THRESHOLD = 0.3

# ============ CẤU HÌNH LOGGING & DEBUG ============

# Enable/disable verbose logging
VERBOSE_LOGGING = True

# Log file path
LOG_FILE_PATH = WORKSPACE_ROOT / "embedding_pipeline.log"

# ============ TIỆN ÍCH ĐƯỜNG DẪN ============

def get_qdrant_url() -> str:
    """Trả về URL kết nối Qdrant (local mode)"""
    # Qdrant local chạy trên HTTP
    return "http://localhost:6333"

def print_config_summary():
    """In tóm tắt cấu hình hệ thống"""
    print("=" * 70)
    print("CẤU HÌNH HỆ THỐNG GIAI ĐOẠN 2: EMBEDDING & VECTOR DATABASE")
    print("=" * 70)
    print(f"Đường dẫn file JSONL: {INPUT_JSONL_PATH}")
    print(f"Thư mục Vector DB: {VECTOR_DB_DIR}")
    print(f"Collection name: {COLLECTION_NAME}")
    print(f"Embedding model: {VIETNAMESE_EMBEDDING_MODEL}")
    print(f"Embedding dimension: {EMBEDDING_DIMENSION}")
    print(f"Batch size: {BATCH_SIZE}")
    print(f"Số từ khóa tiền: {len(MONEY_RELATED_KEYWORDS)}")
    print(f"Bộ lọc mặc định: {DEFAULT_FILTER_CONDITIONS}")
    print(f"Trọng số search: semantic={SEARCH_WEIGHT_SEMANTIC}, metadata={SEARCH_WEIGHT_METADATA}")
    print("=" * 70)

def check_input_file() -> bool:
    """Kiểm tra file JSONL đầu vào có tồn tại không"""
    if not INPUT_JSONL_PATH.exists():
        print(f"❌ File JSONL đầu vào không tồn tại: {INPUT_JSONL_PATH}")
        print(f"   Vui lòng chạy Giai đoạn 1 trước để tạo file processed_knowledge_base.jsonl")
        return False
    
    # Kiểm tra file không rỗng
    file_size = INPUT_JSONL_PATH.stat().st_size
    if file_size == 0:
        print(f"⚠️ File JSONL rỗng: {INPUT_JSONL_PATH}")
        return False
    
    print(f"✅ File JSONL đầu vào tồn tại: {INPUT_JSONL_PATH} ({file_size} bytes)")
    return True

def detect_money_query(query_text: str) -> bool:
    """
    Phát hiện câu hỏi có liên quan đến tiền bạc không
    
    Args:
        query_text: Câu hỏi người dùng
        
    Returns:
        True nếu câu hỏi liên quan đến tiền, False nếu không
    """
    if not query_text:
        return False
    
    query_lower = query_text.lower()
    
    for keyword in MONEY_RELATED_KEYWORDS:
        if keyword.lower() in query_lower:
            return True
    
    return False

def get_money_keywords_in_query(query_text: str) -> list:
    """
    Trích xuất các từ khóa tiền có trong câu hỏi
    
    Args:
        query_text: Câu hỏi người dùng
        
    Returns:
        List các từ khóa tiền tìm thấy trong câu hỏi
    """
    found_keywords = []
    query_lower = query_text.lower()
    
    for keyword in MONEY_RELATED_KEYWORDS:
        if keyword.lower() in query_lower:
            found_keywords.append(keyword)
    
    return found_keywords

if __name__ == "__main__":
    # Test cấu hình
    print_config_summary()
    
    # Kiểm tra file đầu vào
    check_input_file()
    
    # Test money query detection
    test_queries = [
        "lương cơ sở hiện tại là bao nhiêu?",
        "hợp đồng lao động cần có những nội dung gì?",
        "mức tham chiếu để tính bảo hiểm xã hội",
        "thời gian thử việc tối đa là bao lâu?"
    ]
    
    print("\n🧪 Test phát hiện câu hỏi về tiền:")
    for query in test_queries:
        is_money = detect_money_query(query)
        keywords = get_money_keywords_in_query(query)
        print(f"  '{query}' -> money: {is_money}, keywords: {keywords}")