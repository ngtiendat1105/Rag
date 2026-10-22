# GIAI ĐOẠN 2: EMBEDDING & VECTOR DATABASE
## Hệ thống RAG cho dữ liệu pháp lý nội bộ doanh nghiệp

## 📋 TỔNG QUAN HỆ THỐNG

Hệ thống Giai đoạn 2 xử lý dữ liệu từ file `processed_knowledge_base.jsonl` (đầu ra của Giai đoạn 1) bằng cách:
1. **Embedding**: Chuyển đổi văn bản tiếng Việt thành vector embeddings
2. **Vector Database**: Lưu trữ vectors với metadata vào Qdrant
3. **Intelligent Retrieval**: Truy xuất thông minh với semantic search + metadata filtering

## 🏗️ KIẾN TRÚC MODULE (6 FILE PYTHON)

### **1. config_phase2.py** - Cấu hình hệ thống
- **Đường dẫn**: File JSONL, thư mục Vector DB
- **Model**: `KeepitIreal/Vietnamese-sbert` (768 dimensions)
- **Batch size**: 100 chunks/batch
- **Từ khóa tiền**: 24 từ khóa nhận diện câu hỏi về mức tiền
- **Bộ lọc mặc định**: `is_verified=True`, `weight=1.0`

### **2. embedder.py** - Class VietnameseEmbedder
- **Sử dụng**: sentence-transformers với model tiếng Việt tối ưu
- **Chức năng**: 
  - `embed_text()`: Embedding single text
  - `embed_batch()`: Batch embedding hiệu quả
  - `calculate_similarity()`: Tính cosine similarity
  - `validate_embeddings()`: Kiểm tra chất lượng embeddings

### **3. vector_db_manager.py** - Class VectorDBManager
- **Database**: Qdrant (local mode) - hỗ trợ metadata filtering mạnh
- **Chức năng**:
  - `create_collection()`: Tạo collection với HNSW index
  - `upsert_vectors()`: Thêm/cập nhật vectors với metadata
  - `search_vectors()`: Tìm kiếm với filter conditions
  - `_build_qdrant_filter()`: Xây dựng filter từ conditions

### **4. indexer.py** - Class DataIndexer
- **Logic batch processing**: Đọc JSONL, chia batch, embedding, indexing
- **Chức năng**:
  - `read_jsonl_file()`: Đọc file theo batch
  - `prepare_batch_for_indexing()`: Chuẩn bị payloads
  - `process_batch()`: Xử lý embedding + indexing
  - `run_indexing_pipeline()`: Chạy toàn bộ pipeline

### **5. retriever_demo.py** - Class LegalRetriever
- **Semantic Search + Metadata Filtering**: Truy xuất thông minh
- **Chức năng chính**:
  - `search_legal_context()`: Hàm chính với phân tích câu hỏi
  - `analyze_query()`: Phát hiện money queries và yêu cầu
  - `build_filter_conditions()`: Xây dựng bộ lọc thích hợp
  - `rerank_by_combined_score()`: Tái xếp hạng với semantic + metadata scores
  - `sort_by_effective_date()`: Sắp xếp theo ngày hiệu lực

### **6. main_phase2.py** - Class Phase2Pipeline
- **Điều phối toàn bộ Giai đoạn 2**
- **Chế độ chạy**:
  - `--test`: Test mode với model nhỏ hơn
  - `--components`: Test từng component
  - `--interactive`: Chế độ interactive search
  - `--skip-indexing`: Chỉ test retrieval
  - `--query "text"`: Test query cụ thể

## 🔧 CÀI ĐẶT DEPENDENCIES

```bash
# Cài đặt dependencies cần thiết
pip install sentence-transformers
pip install qdrant-client
pip install numpy
pip install tqdm  # Optional: for progress bars
```

**Lưu ý**: 
- Model `KeepitIreal/Vietnamese-sbert` (~450MB) sẽ tự động tải về khi chạy lần đầu
- Qdrant local mode không cần server riêng

## 🚀 CÁCH CHẠY HỆ THỐNG

### 1. Test các components
```bash
python main_phase2.py --components
```

### 2. Chạy toàn bộ pipeline (test mode với model nhỏ)
```bash
python main_phase2.py --test
```

### 3. Chạy pipeline đầy đủ
```bash
python main_phase2.py
```

### 4. Interactive search mode
```bash
python main_phase2.py --interactive
```

### 5. Test query cụ thể
```bash
python main_phase2.py --query "lương cơ sở hiện tại là bao nhiêu?"
```

## 🎯 NGHIỆP VỤ XỬ LÝ THÔNG MINH

### **Bộ lọc mặc định**
```python
DEFAULT_FILTER_CONDITIONS = {
    "is_verified": True,    # Chỉ lấy content đã kiểm chứng
    "weight": 1.0          # Chỉ lấy content có trọng số cao
}
```

### **Phát hiện câu hỏi về tiền (Money Queries)**
- **Từ khóa**: "lương", "tiền", "mức tham chiếu", "trợ cấp", "thai sản", etc.
- **Xử lý đặc biệt**: Ưu tiên `effective_date` mới nhất
- **Ví dụ**: Câu hỏi "lương cơ sở hiện tại" sẽ ưu tiên chunk có `effective_date="2026-07-01"` thay vì `"2021-01-01"`

### **Combined Scoring**
```python
combined_score = (
    base_score * SEARCH_WEIGHT_SEMANTIC +  # Semantic similarity (70%)
    metadata_score * SEARCH_WEIGHT_METADATA  # Metadata quality (30%)
)
```

### **Metadata Score Components**
1. **Verified content**: +0.3 điểm
2. **Weight score**: `weight * 0.2` (1.0 → +0.2, 0.5 → +0.1)
3. **Date recency** (cho money queries): Ưu tiên năm gần current_year

## 📊 DỮ LIỆU ĐẦU VÀO/ĐẦU RA

### **Input**: `processed_knowledge_base.jsonl`
- **51 chunks** từ 4 file pháp luật nhân sự
- **Cấu trúc mỗi chunk**:
  ```json
  {
    "chunk_id": "45_2019_QH14_Dieu_14",
    "metadata": {
      "title": "Bộ luật Lao động 2019",
      "doc_id": "45/2019/QH14",
      "effective_date": "2021-01-01",
      "last_verified": "2026-10-01",
      "status": "Còn hiệu lực",
      "domain": "Nhân sự (HR)",
      "is_verified": true,
      "weight": 1.0
    },
    "content": "### Điều 14. Hình thức hợp đồng..."
  }
  ```

### **Output**: Vector Database (Qdrant)
- **Collection**: `legal_knowledge_base`
- **Vectors**: 51 vectors (768 dimensions)
- **Metadata**: Đầy đủ các trường từ JSONL
- **Index**: HNSW với cosine distance

## 🧪 TEST CASES MẪU

### **Câu hỏi về tiền (Money Queries)**
```python
test_queries = [
    "lương cơ sở hiện tại là bao nhiêu?",
    "mức tham chiếu để tính bảo hiểm xã hội năm 2026",
    "trợ cấp thai sản được quy định như thế nào?"
]
```

### **Câu hỏi thông thường**
```python
test_queries = [
    "hợp đồng lao động cần có những nội dung gì?",
    "thời gian thử việc tối đa là bao lâu?",
    "người sử dụng lao động không được làm gì?"
]
```

## 🔍 KẾT QUẢ MONG ĐỢI

### **Với money query "lương cơ sở hiện tại"**
1. **Phát hiện**: `is_money_query=True`, keywords=["lương", "lương cơ sở"]
2. **Filter**: `is_verified=True`, `weight=1.0`
3. **Sorting**: Ưu tiên `effective_date` mới nhất (2026 > 2025 > 2024)
4. **Kết quả**: Chứa thông tin "2.530.000 đồng/tháng (từ 01/07/2026)"

### **Với query thông thường "hợp đồng lao động"**
1. **Phát hiện**: `is_money_query=False`
2. **Filter**: `is_verified=True`, `weight=1.0`
3. **Sorting**: Theo combined score (semantic + metadata)
4. **Kết quả**: Các Điều 14, 20, 21 về hợp đồng lao động

## 🛠️ DEBUG & TROUBLESHOOTING

### **Lỗi thiếu dependencies**
```bash
# Kiểm tra dependencies
python test_phase2_simple.py

# Cài đặt thiếu
pip install sentence-transformers qdrant-client
```

### **Lỗi model không tải được**
- **Model thay thế**: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` (384D)
- **Cách sửa**: Đổi `VIETNAMESE_EMBEDDING_MODEL` trong `config_phase2.py`

### **Lỗi Qdrant connection**
- **Local mode**: Sử dụng in-memory storage (đã cấu hình sẵn)
- **Remote mode**: Cần chạy Qdrant server `docker run -p 6333:6333 qdrant/qdrant`

## 📈 THỐNG KÊ HIỆU NĂNG DỰ KIẾN

- **Embedding time**: ~0.5-1.0 giây/100 chunks (CPU)
- **Indexing time**: ~2-5 giây cho 51 chunks
- **Search time**: < 0.1 giây/query
- **Memory usage**: < 500MB cho toàn bộ pipeline

## 🎓 CHO SINH VIÊN ĐỒ ÁN

### **Ưu điểm kiến trúc module**
1. **Dễ debug**: Mỗi module độc lập, có thể test riêng
2. **Dễ nâng cấp**: Thay model, database mà không ảnh hưởng module khác
3. **Tái sử dụng**: Các class có thể dùng cho dự án khác

### **Các điểm có thể cải tiến**
1. **Thêm caching**: Cache embeddings để tăng tốc
2. **Hybrid search**: Kết hợp keyword search với semantic search
3. **Multi-model**: Hỗ trợ nhiều model embedding
4. **API server**: Đóng gói thành REST API

### **Ứng dụng thực tế**
- **HR Chatbot**: Trả lời câu hỏi pháp lý nhân sự
- **Legal Research**: Tra cứu văn bản pháp luật
- **Compliance Check**: Kiểm tra tuân thủ quy định

---

## ✅ KẾT LUẬN

Hệ thống Giai đoạn 2 đã hoàn thành các yêu cầu:
1. **✅ Module architecture**: 6 file Python tách biệt chức năng
2. **✅ Vietnamese embedding**: Model tối ưu cho tiếng Việt
3. **✅ Vector database**: Qdrant với metadata filtering mạnh
4. **✅ Batch processing**: Xử lý 100 chunks/batch tránh tràn RAM
5. **✅ Intelligent retrieval**: `search_legal_context()` với phân tích câu hỏi
6. **✅ Money query handling**: Ưu tiên `effective_date` mới nhất
7. **✅ Combined scoring**: Semantic (70%) + Metadata (30%)
8. **✅ Production-ready**: Error handling, logging, progress bars

Hệ thống sẵn sàng tích hợp với Giai đoạn 3 (LLM Generation) để hoàn thiện pipeline RAG đầy đủ.