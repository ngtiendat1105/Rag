# LegalAI RAG - Trợ lý pháp lý nội bộ

Hệ thống Retrieval-Augmented Generation (RAG) phục vụ tra cứu pháp luật lao động, bảo hiểm, doanh nghiệp và quy định nội bộ bằng tiếng Việt.

Hệ thống có thể:

- Đọc tài liệu Markdown, DOCX, PDF và hình ảnh giấy tờ.
- Trích xuất văn bản từ PDF/DOCX.
- OCR ảnh hoặc PDF scan bằng Tesseract.
- Chia tài liệu thành các chunk theo Điều, mục, trang hoặc heading.
- Tạo vector embedding tiếng Việt.
- Lưu và tìm kiếm vector bằng Qdrant.
- Hiểu câu hỏi có dấu, không dấu, từ viết tắt và cách diễn đạt tự nhiên.
- Trả lời bằng Ollama local hoặc các LLM provider được hỗ trợ.
- Hiển thị nguồn, Điều, Khoản và cảnh báo đối chiếu.
- Tự động phát hiện file mới/thay đổi và re-index dữ liệu.
- Cung cấp API FastAPI để kết nối website.

> Đây là hệ thống hỗ trợ tra cứu. Nội dung pháp lý, đặc biệt dữ liệu OCR hoặc tài liệu chưa xác minh, cần được đối chiếu với văn bản gốc trước khi áp dụng thực tế.

---

## 1. Kiến trúc tổng thể

```text
Tài liệu nguồn
    |
    |  Markdown / DOCX / PDF / ảnh
    v
Document Loader + OCR
    |
    v
Chunking + Metadata normalization
    |
    v
processed_output/processed_knowledge_base.jsonl
    |
    v
Sentence Transformer Embedding
    |
    v
Qdrant Vector Database
    |
    v
Query Understanding
    |
    v
Semantic Retrieval + reranking
    |
    v
Context budget
    |
    v
Ollama / OpenAI / Gemini
    |
    v
Câu trả lời + nguồn trích dẫn + cảnh báo
```

Khi triển khai website:

```text
legalai.id.vn
    |
    v
FastAPI: api.legalai.id.vn
    |
    +-- RAG Pipeline
    +-- Qdrant
    +-- Ollama hoặc LLM API
```

---

## 2. Mô hình và công nghệ đang sử dụng

| Thành phần | Công nghệ/model hiện tại | Công dụng |
|---|---|---|
| LLM mặc định cho local | `llama3.2:latest` qua Ollama | Sinh câu trả lời tiếng Việt từ context |
| LLM local thay thế | `mistral:latest`, `llama3.1:latest` | Có thể chọn khi chạy chatbot |
| LLM cloud tùy chọn | OpenAI, Google Gemini | Dùng khi không muốn chạy LLM local |
| Embedding | `sentence-transformers/paraphrase-multilingual-mpnet-base-v2` | Chuyển câu hỏi và tài liệu thành vector |
| Embedding dimension | `768` | Kích thước vector trong Qdrant |
| Vector database | Qdrant local | Lưu và tìm kiếm vector semantic |
| Distance metric | Cosine similarity | Đo độ tương đồng giữa câu hỏi và chunk |
| Reranker tùy chọn | `CrossEncoder`, ví dụ `BAAI/bge-reranker-v2-m3` | Xếp hạng lại các kết quả retrieval |
| Framework pipeline | LangChain | Kết nối retriever, prompt và LLM |
| API backend | FastAPI + Uvicorn | Cung cấp API chat cho website |
| OCR | Tesseract + `pytesseract` | Đọc chữ trong ảnh và PDF scan |
| DOCX reader | `python-docx` | Đọc đoạn văn và bảng trong Word |
| PDF reader | `pypdf` | Đọc PDF có lớp text |
| PDF OCR | PyMuPDF + Pillow + Tesseract | OCR PDF scan theo từng trang |
| Test | pytest | Unit, integration và E2E mock tests |

### Cấu hình LLM hiện tại

Trong [config_llm.py](./config_llm.py):

```text
Temperature: 0.0
Max output tokens: 2000
Top K: 4
Timeout: 120 giây
Max retries: 2
```

Provider mặc định trong cấu hình là OpenAI, nhưng chatbot và API hiện được cấu hình chạy Ollama local:

```text
OLLAMA_MODEL=llama3.2:latest
OLLAMA_BASE_URL=http://localhost:11434
```

---

## 3. Cấu trúc thư mục và chức năng file

```text
.
├── README.md
├── requirements.txt
├── config.py
├── config_llm.py
├── config_phase2.py
├── document_loader.py
├── markdown_chunker.py
├── metadata_utils.py
├── query_understanding.py
├── sync_documents.py
├── embedder.py
├── indexer.py
├── vector_db_manager.py
├── retriever_service.py
├── retriever_demo.py
├── rag_pipeline.py
├── prompts.py
├── main_chat.py
├── api.py
├── main_phase2.py
├── evaluate_rag.py
├── evaluation_dataset.json
├── test_rag.py
├── data_documents/
├── processed_output/
└── vector_db/
```

### Nhóm cấu hình

| File | Công dụng |
|---|---|
| [config.py](./config.py) | Thư mục input, output, định dạng file hỗ trợ và chunk size |
| [config_phase2.py](./config_phase2.py) | Model embedding, dimension, Qdrant collection, batch size |
| [config_llm.py](./config_llm.py) | Provider, model LLM, timeout, retry, temperature và top-k |

### Nhóm đọc và xử lý tài liệu

| File | Công dụng |
|---|---|
| [document_loader.py](./document_loader.py) | Đọc Markdown, DOCX, PDF, ảnh và OCR |
| [markdown_chunker.py](./markdown_chunker.py) | Chia văn bản theo Điều, heading, Khoản và Điểm |
| [metadata_utils.py](./metadata_utils.py) | Chuẩn hóa metadata dùng chung |
| [sync_documents.py](./sync_documents.py) | Build JSONL, theo dõi file mới và kích hoạt re-index |

### Nhóm embedding và vector database

| File | Công dụng |
|---|---|
| [embedder.py](./embedder.py) | Tải Sentence Transformer và tạo embedding |
| [indexer.py](./indexer.py) | Batch embedding và upsert vector vào Qdrant |
| [vector_db_manager.py](./vector_db_manager.py) | Tạo collection, lưu, tìm kiếm và thống kê vector |
| [retriever_service.py](./retriever_service.py) | Retrieval production cho RAG pipeline |
| [retriever_demo.py](./retriever_demo.py) | Demo retrieval và scoring metadata |
| [query_understanding.py](./query_understanding.py) | Mở rộng từ đồng nghĩa, từ viết tắt, Điều/Khoản và tên văn bản |

### Nhóm sinh câu trả lời

| File | Công dụng |
|---|---|
| [rag_pipeline.py](./rag_pipeline.py) | Luồng retrieve một lần, tạo context, gọi LLM, citation và retry |
| [prompts.py](./prompts.py) | Quy tắc anti-hallucination và format câu trả lời |
| [main_chat.py](./main_chat.py) | Chatbot CLI tương tác |
| [api.py](./api.py) | API `/health` và `/api/chat` cho website |

### Nhóm đánh giá và kiểm thử

| File | Công dụng |
|---|---|
| [test_rag.py](./test_rag.py) | Unit, integration, API và E2E mock tests |
| [evaluation_dataset.json](./evaluation_dataset.json) | Bộ câu hỏi đánh giá retrieval |
| [evaluate_rag.py](./evaluate_rag.py) | Đo Recall@K, MRR và citation accuracy |
| [main_phase2.py](./main_phase2.py) | Index dữ liệu và test retrieval |

---

## 4. Các định dạng tài liệu

### Markdown

Đặt tài liệu pháp lý và tài liệu upload vào thư mục:

```text
data_documents/
```

### DOCX, PDF và hình ảnh

Đặt file mới vào:

```text
data_documents/
```

Tất cả tài liệu nguồn được gom vào `data_documents/`. File `00_MANIFEST.md` là
tài liệu quản lý danh mục và được giữ ở thư mục gốc, không đưa vào index.

Định dạng hỗ trợ:

```text
.md
.markdown
.docx
.pdf
.png
.jpg
.jpeg
.tif
.tiff
```

DOCX hỗ trợ đoạn văn và bảng. PDF có text được đọc bằng `pypdf`. PDF scan và ảnh được OCR nếu Tesseract đã cài đúng.

---

## 5. Metadata và mức độ tin cậy

Metadata chuẩn gồm các trường chính:

```text
doc_id
title
document_name
article_number
article
clause_number
clause
effective_date
issued_date
last_verified
status
domain
is_verified
weight
source_url
source_file
article_title
chunk_id
document_type
```

Tài liệu upload mới mặc định:

```text
is_verified: false
weight: 0.5
```

Điều này khiến câu trả lời có thể hiển thị cảnh báo cần đối chiếu. Sau khi pháp chế xác minh tài liệu, có thể cập nhật metadata thành:

```text
is_verified: true
weight: 1.0
```

---

## 6. Cài đặt

### Python dependencies

```powershell
cd "C:\Xây dựng Hệ thống Trợ lý ảo Nội bộ (Business Information System) ứng dụng kỹ thuật RAG  Luận án tốt nghiệp"

python -m pip install -r requirements.txt
```

### Ollama

Cài Ollama, sau đó tải model:

```powershell
ollama pull llama3.2:latest
```

Kiểm tra:

```powershell
ollama list
```

Nếu đọc ảnh hoặc PDF scan, cần cài Tesseract OCR và language data `vie`:

```powershell
tesseract --version
tesseract --list-langs
```

Kết quả nên có:

```text
eng
vie
```

---

## 7. Chạy hệ thống

### Đồng bộ và index tài liệu

```powershell
$env:PYTHONIOENCODING="utf-8"
python sync_documents.py
```

Lệnh này tạo:

```text
processed_output/processed_knowledge_base.jsonl
vector_db/qdrant_storage/
```

### Tự động phát hiện file mới

```powershell
python sync_documents.py --watch
```

Watcher phát hiện file mới hoặc file bị sửa trong thư mục `data_documents`, sau đó:

```text
đợi upload hoàn tất
→ đọc/OCR
→ chunk
→ embedding
→ re-index Qdrant
```

### Chạy chatbot CLI

```powershell
$env:PYTHONIOENCODING="utf-8"
python main_chat.py --provider ollama --model llama3.2:latest
```

Đồng bộ tài liệu trước khi mở chatbot:

```powershell
python main_chat.py `
    --provider ollama `
    --model llama3.2:latest `
    --sync
```

Lệnh trong chatbot:

```text
/help
/history
/clear
/export
/quit
```

### Chạy model Ollama khác

```powershell
python main_chat.py --provider ollama --model mistral:latest
python main_chat.py --provider ollama --model llama3.1:latest
```

### Chạy API

Thiết lập API key:

```powershell
$env:LEGALAI_API_KEY="thay-bang-api-key-dai-va-ngau-nhien"
$env:OLLAMA_MODEL="llama3.2:latest"
```

Chạy:

```powershell
uvicorn api:app --host 127.0.0.1 --port 8000
```

Kiểm tra:

```powershell
Invoke-WebRequest http://127.0.0.1:8000/health
```

API:

```text
GET  /health
POST /api/chat
```

Ví dụ gọi API bằng PowerShell:

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "X-API-Key" = $env:LEGALAI_API_KEY
}
$body = @{
    question = "Doanh nghiệp có nghĩa vụ gì khi lưu trữ hợp đồng điện tử?"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://127.0.0.1:8000/api/chat" `
    -Method Post `
    -Headers $headers `
    -Body $body
```

---

## 8. Cải thiện độ hiểu câu hỏi và retrieval

`query_understanding.py` hỗ trợ:

- Câu hỏi tiếng Việt có dấu hoặc không dấu.
- Từ viết tắt như `cty`, `DN`, `BHXH`, `BHYT`, `BHTN`, `KPI`.
- Từ đồng nghĩa như “nghỉ phép”, “nghỉ hằng năm”.
- Nhận diện `Điều` và `Khoản`.
- Nhận diện tên văn bản.
- Tạo nhiều query variant để tăng recall.

`retriever_service.py` thực hiện:

1. Embed các query variant.
2. Gộp kết quả trùng lặp.
3. Tìm kiếm thêm theo `source_file` khi người dùng nhắc rõ văn bản.
4. Tăng điểm cho title, article title, source file và từ khóa trùng.
5. Có thể dùng CrossEncoder reranker.
6. Giới hạn kết quả cuối theo `TOP_K`.

Bật reranker tùy chọn:

```powershell
$env:RAG_RERANKER_MODEL="BAAI/bge-reranker-v2-m3"
python main_chat.py --provider ollama --model llama3.2:latest
```

Reranker có thể làm tốc độ chậm hơn, đặc biệt trên CPU.

---

## 9. Cấu hình context và độ ổn định LLM

Các biến môi trường:

```powershell
$env:RAG_MAX_CONTEXT_CHARS="12000"
$env:RAG_MAX_CONTEXT_DOCUMENTS="4"
$env:LLM_REQUEST_TIMEOUT_SECONDS="120"
$env:LLM_MAX_RETRIES="2"
$env:LLM_RETRY_BACKOFF_SECONDS="1"
```

Pipeline:

- Chỉ retrieval một lần cho mỗi câu hỏi.
- Tái sử dụng cùng documents cho prompt, warning và citation.
- Giới hạn context theo số ký tự và số tài liệu.
- Retry lỗi timeout, rate limit, HTTP 429 và temporary unavailable.
- Phân biệt retrieval failure với trường hợp không có tài liệu.

---

## 10. Đánh giá chất lượng

Chạy evaluation:

```powershell
python evaluate_rag.py --top-k 5
```

Các metric:

| Metric | Ý nghĩa |
|---|---|
| Recall@K | Tài liệu đúng có xuất hiện trong top K không |
| MRR | Tài liệu đúng đứng ở vị trí nào |
| Citation accuracy | Citation document/article có khớp kỳ vọng không |

Chạy test:

```powershell
python -m pytest -q test_rag.py
```

Test bao gồm:

- Chunking.
- Metadata normalization.
- Query understanding.
- DOCX/PDF/image loader validation.
- Embedding dimension.
- Qdrant upsert và similarity search.
- RAG pipeline E2E với LLM mock.
- API authentication và rate limit.

---

## 11. Lưu trữ dữ liệu

| Dữ liệu | Vị trí local hiện tại | Công dụng |
|---|---|---|
| Tài liệu nguồn đánh số | Thư mục gốc | Các văn bản pháp luật chính |
| File upload | `data_documents/` | DOCX, PDF, ảnh và tài liệu mới |
| JSONL trung gian | `processed_output/processed_knowledge_base.jsonl` | Danh sách chunk đã xử lý |
| Vector Qdrant | `vector_db/qdrant_storage/` | Vector embedding và payload |
| Lịch sử CLI | `chat_history.json` | Lịch sử câu hỏi/trả lời |

Khi triển khai production:

```text
File gốc       → Azure Blob Storage/S3/MinIO
Metadata file  → PostgreSQL
Vector         → Qdrant Server hoặc Qdrant Cloud
LLM            → Ollama trên VPS hoặc OpenAI/Gemini
```

Không expose trực tiếp Ollama hoặc thư mục Qdrant ra Internet.

---

## 12. Triển khai website

Kiến trúc đề xuất:

```text
legalai.id.vn
    ↓ HTTPS
api.legalai.id.vn
    ↓
FastAPI
    ├── RAG Pipeline
    ├── Qdrant
    └── Ollama
```

Frontend gọi:

```text
POST https://api.legalai.id.vn/api/chat
```

API hiện có:

- API key qua header `X-API-Key`.
- CORS cho `legalai.id.vn`.
- Rate limit mặc định 20 request/60 giây/IP.
- Error mapping cho retrieval và LLM.

Khi chạy nhiều worker hoặc upload/index đồng thời, nên chuyển từ Qdrant local file sang Qdrant server. Local Qdrant không phù hợp cho nhiều tiến trình cùng mở `vector_db/qdrant_storage`.

---

## 13. Lưu ý an toàn

- Không commit API key, token hoặc thông tin bí mật.
- Không để API key cố định trong JavaScript frontend.
- Kiểm tra kích thước, extension và nội dung file upload.
- Dùng antivirus/sandbox khi nhận file từ người dùng ngoài.
- Giới hạn quyền truy cập thư mục upload.
- OCR có thể sai với chữ viết tay, dấu mộc, chữ ký và ảnh mờ.
- Tài liệu `is_verified=false` phải được đối chiếu bản gốc.
- Sao lưu thư mục dữ liệu và Qdrant trước khi re-index lớn.
- Khi deploy public, dùng HTTPS, reverse proxy và secret manager.

---

## 14. Trạng thái hiện tại

Các chức năng đã có:

- [x] RAG pipeline end-to-end.
- [x] Sentence Transformer embedding 768 chiều.
- [x] Qdrant vector search.
- [x] Metadata normalization.
- [x] Citation và source display.
- [x] Context limit.
- [x] LLM timeout/retry/backoff.
- [x] Query understanding tiếng Việt.
- [x] Reranker tùy chọn.
- [x] Markdown ingestion.
- [x] DOCX extraction.
- [x] PDF text extraction.
- [x] PDF/image OCR integration.
- [x] Automatic document watcher.
- [x] FastAPI API key và rate limit.
- [x] Unit/integration/E2E tests.
- [x] Evaluation Recall@K, MRR và citation accuracy.

Các bước production tiếp theo:

- Chuyển Qdrant local sang Qdrant server hoặc Qdrant Cloud.
- Dùng PostgreSQL quản lý document status và upload history.
- Dùng object storage cho file gốc.
- Dùng Redis cho rate limit nhiều worker.
- Thêm background queue cho OCR và indexing.
- Mở rộng evaluation dataset theo từng lĩnh vực pháp luật.
