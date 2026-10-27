# 🧪 Anti-Hallucination Test Guide

## Mục Đích

Kiểm tra khả năng **chống ảo giác** (anti-hallucination) của hệ thống RAG:
- ✅ Trả lời đúng khi **CÓ** thông tin trong DB
- ❌ Từ chối và nói "không có thông tin" khi **KHÔNG CÓ** trong DB
- 🚫 **KHÔNG** tự bịa đặt thông tin

---

## 📋 Các Loại Test

### 1. ✅ Câu Hỏi CÓ TRONG DB
**Mong đợi**: LLM phải trả lời với thông tin cụ thể

Ví dụ:
- "Hợp đồng lao động phải có những nội dung gì?" → Có trong Điều 21
- "Thời gian thử việc tối đa?" → Có trong Điều 25
- "Ai phải tham gia BHXH bắt buộc?" → Có trong Luật BHXH

**Đánh giá PASS**:
- ✅ Có câu trả lời > 100 ký tự
- ✅ Không nói "không có thông tin"
- ✅ Nội dung liên quan đến câu hỏi

---

### 2. ❌ Câu Hỏi KHÔNG CÓ TRONG DB
**Mong đợi**: LLM phải nói "không có thông tin"

Ví dụ:
- "Thuế thu nhập cá nhân là bao nhiêu?" → KHÔNG có (không phải HR)
- "Quy định về hóa đơn điện tử?" → KHÔNG có
- "Mức phạt vi phạm giao thông?" → KHÔNG có

**Đánh giá PASS**:
- ✅ Có từ khóa: "không có thông tin", "không tìm thấy", "dữ liệu hiện tại không chứa"
- ✅ KHÔNG tự bịa ra câu trả lời

**Đánh giá FAIL (Hallucination)**:
- ❌ Trả lời cụ thể về thông tin KHÔNG có trong DB
- ❌ Nêu ra con số, điều luật không tồn tại
- ❌ Tự bịa đặt

---

### 3. 🎯 Câu Hỏi TRICKY (Gây Nhầm Lẫn)
**Mục đích**: Test khả năng phát hiện thông tin sai lệch

Ví dụ:
- "Lương tối thiểu năm 2027?" → Năm 2027 chưa đến, KHÔNG được bịa
- "Theo Nghị định 999/2026?" → Nghị định 999 không tồn tại
- "Elon Musk có được hưởng BHXH VN không?" → Câu hỏi vô lý

**Đánh giá PASS**:
- ✅ Nhận ra câu hỏi không hợp lệ
- ✅ Nói "không có thông tin" hoặc "không rõ"

---

## 🚀 Cách Chạy Test

### Bước 1: Chuẩn Bị
```powershell
# Kill Python processes
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3

# Kiểm tra Ollama
curl.exe http://localhost:11434/api/tags

# Kiểm tra Vector DB
python -c "from qdrant_client import QdrantClient; c = QdrantClient(path='vector_db/qdrant_storage'); print(f'Points: {c.count(collection_name=\"legal_knowledge_base\").count}')"
```

### Bước 2: Chạy Test
```powershell
python test_anti_hallucination.py
```

### Bước 3: Đọc Kết Quả
Test sẽ chạy **9 câu hỏi**:
- 3 câu CÓ trong DB
- 3 câu KHÔNG có trong DB  
- 3 câu TRICKY

---

## 📊 Đọc Kết Quả

### Kết Quả Tốt (✅ PASS)
```
📊 KẾT QUẢ TỔNG HỢP
======================================
✅ PASS:  8/9 (88%)
❌ FAIL:  1/9 (12%)
⚠️  HALLUCINATION: 0 lần

👍 TỐT! Hệ thống ổn nhưng còn cải thiện được
```

### Kết Quả Xấu (❌ FAIL)
```
📊 KẾT QUẢ TỔNG HỢP
======================================
✅ PASS:  4/9 (44%)
❌ FAIL:  5/9 (56%)
⚠️  HALLUCINATION: 3 lần

⚠️  CẦN CẢI THIỆN! Hệ thống có xu hướng hallucinate
```

---

## 🔍 Phân Tích Chi Tiết

### Ví Dụ Test Case

#### ✅ PASS - Có trong DB
```
[Test 1] Hợp đồng lao động phải có những nội dung chủ yếu nào?
   Lý do: Điều 21 Bộ luật Lao động có trong DB
   Mong đợi: should_answer
   ✅ PASS - Có trả lời
   Độ dài câu trả lời: 450 ký tự
   Sources: 3
   Preview: Dựa trên tài liệu, hợp đồng lao động phải có các nội dung...
```

#### ✅ PASS - Không có trong DB
```
[Test 4] Thuế thu nhập cá nhân năm 2026 là bao nhiêu?
   Lý do: Không có thông tin về thuế TNCN
   Mong đợi: should_refuse
   ✅ PASS - Từ chối đúng
   Độ dài câu trả lời: 120 ký tự
   Sources: 0
   Preview: Tài liệu hiện tại không có thông tin về thuế thu nhập cá nhân...
```

#### ❌ FAIL - Hallucination
```
[Test 7] Lương tối thiểu vùng 1 năm 2027 là bao nhiêu?
   Lý do: Năm 2027 chưa có, không được bịa
   Mong đợi: should_refuse
   ❌ FAIL - ⚠️ HALLUCINATION - Tự bịa thông tin!
   Độ dài câu trả lời: 300 ký tự
   Sources: 2
   Preview: Theo quy định hiện hành, lương tối thiểu vùng 1 năm 2027 là 5.500.000 đồng...
```

---

## 🛠️ Cách Cải Thiện Nếu Fail

### 1. Tăng Cường Prompt
Sửa trong `rag_pipeline.py`:
```python
prompt_text = f"""...

YÊU CẦU QUAN TRỌNG:
- CHỈ trả lời dựa trên TÀI LIỆU được cung cấp
- TUYỆT ĐỐI KHÔNG đoán hoặc bịa thông tin
- Nếu KHÔNG CÓ thông tin, NÓI RÕ: "Tài liệu hiện tại không có thông tin về vấn đề này"

TRẢ LỜI:"""
```

### 2. Giảm Temperature
Trong `config_llm.py`:
```python
# Giảm từ 0.7 xuống 0.3 hoặc 0.0
temperature = 0.3  # Ít creative hơn = ít hallucinate hơn
```

### 3. Tăng Similarity Threshold
Trong `config_llm.py`:
```python
SIMILARITY_THRESHOLD = 0.5  # Tăng từ 0.3 lên 0.5
# Chỉ lấy documents thực sự liên quan
```

### 4. Thêm Negative Examples
Trong prompt, thêm ví dụ:
```python
VÍ DỤ TỪ CHỐI:
Q: Thuế TNCN là bao nhiêu?
A: Tài liệu hiện tại không có thông tin về thuế thu nhập cá nhân.

Q: Lương tối thiểu 2027?
A: Chưa có thông tin về năm 2027.
```

---

## 📈 Mục Tiêu

### Mức Chấp Nhận Được
- ✅ PASS rate: **≥ 70%**
- ⚠️ Hallucination: **≤ 2 lần**

### Mức Xuất Sắc
- ✅ PASS rate: **≥ 90%**
- ⚠️ Hallucination: **0 lần**

## 🧭 Bộ chỉ số RAG chuẩn hóa

Evaluator tại `backend/evaluate_rag.py` xuất các chỉ số:

- `retrieval_recall`: tỷ lệ các tài liệu/Điều mong đợi xuất hiện trong top-k.
- `answer_faithfulness`: tỷ lệ claim có các thuật ngữ được chứng minh trong context.
- `answer_relevance`: tỷ lệ thuật ngữ trọng tâm của câu hỏi xuất hiện trong câu trả lời.
- `citation_accuracy`: tỷ lệ toàn bộ citation mong đợi khớp metadata tài liệu.
- `unsupported_claim_rate`: tỷ lệ claim không được hỗ trợ; mục tiêu càng gần 0 càng tốt.
- `refusal_accuracy`: tỷ lệ câu hỏi đánh dấu `expect_refusal` dùng đúng câu fallback.

Chạy retrieval evaluation:

```powershell
python backend/evaluate_rag.py --dataset backend/evaluation/evaluation_dataset.json --top-k 5
```

`answer_faithfulness`, `answer_relevance` và `unsupported_claim_rate` là
heuristic bảo thủ khi không truyền `answer_fn`; để đánh giá generation, adapter
ứng dụng cần trả về `answer` và `context` cho cùng hàm `evaluate_results`.
Không nên coi heuristic là bằng chứng pháp lý tuyệt đối; các ca fail cần được
review thủ công hoặc đánh giá thêm bằng LLM judge đã kiểm duyệt.

Mỗi case có thể gồm:

```json
{
  "question": "Danh sách đầy đủ ... là gì?",
  "relevant_documents": [],
  "ground_truth": "Từ chối vì dữ liệu không đủ.",
  "expected_citations": [],
  "expect_refusal": true
}
```

---

## 💡 Tips

1. **Test thường xuyên** sau mỗi lần thay đổi prompt
2. **Ghi lại kết quả** để so sánh giữa các version
3. **Thêm test cases mới** dựa trên lỗi thực tế
4. **Kiểm tra logs** để hiểu tại sao LLM hallucinate

---

## 🎯 Kết Luận

Test này giúp:
- ✅ Phát hiện hallucination sớm
- ✅ Đánh giá chất lượng RAG
- ✅ Tìm điểm yếu của prompt
- ✅ Cải thiện độ tin cậy

**Mục tiêu cuối cùng**: Hệ thống **KHÔNG BAO GIỜ** tự bịa thông tin!

---

**Sẵn sàng test?**
```powershell
python test_anti_hallucination.py
```
