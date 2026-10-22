# Hướng dẫn nhanh chạy hệ thống RAG với Ollama

## 📋 Yêu cầu hệ thống
- Windows 10/11
- Python 3.8+
- Ollama (cho LLM local)
- 8GB+ RAM (khuyến nghị)

## 🚀 Các bước chạy nhanh

### Định dạng tài liệu được hỗ trợ

Hệ thống có thể ingest:

- Markdown: `.md`, `.markdown`
- Word: `.docx`
- PDF có lớp text: `.pdf`
- Ảnh giấy tờ: `.png`, `.jpg`, `.jpeg`, `.tif`, `.tiff` bằng OCR tiếng Việt/Anh

Đặt file upload vào thư mục `data_documents` ở thư mục dự án, sau đó chạy:

```powershell
python backend/sync_documents.py
```

Để tự động phát hiện file mới hoặc file được sửa:

```powershell
python backend/sync_documents.py --watch
```

Watcher đợi file upload ghi xong, tạo lại knowledge base, embedding và Qdrant.
Chạy watcher trong một terminal riêng và không mở đồng thời một tiến trình khác
đang ghi Qdrant local.

PDF scan không có lớp text sẽ được OCR theo từng trang. Ảnh cũng cần cài Tesseract OCR và ngôn ngữ `vie`.

### Bước 1: Cài đặt Ollama
1. Tải về: https://ollama.com/download/windows
2. Chạy installer
3. Mở PowerShell/CMD và kiểm tra:
```bash
ollama --version
```

### Bước 2: Pull model Llama
```bash
ollama pull llama3.1:latest
```

### Bước 3: Chạy vector database
```powershell
cd "c:\Xây dựng Hệ thống Trợ lý ảo Nội bộ (Business Information System) ứng dụng kỹ thuật RAG  Luận án tốt nghiệp"
python backend/main_phase2.py
```

### Bước 4: Chạy hệ thống RAG
```powershell
python backend/main_chat.py --provider ollama
```

## 📝 Các lệnh hữu ích

### Chạy với model cụ thể:
```bash
python backend/main_chat.py --provider ollama --model llama3.1:latest
python backend/main_chat.py --provider ollama --model mistral:latest
```

### Chạy test mode (không cần Ollama):
```bash
python backend/main_chat.py --test
```

### Test retrieval:
```bash
python retriever_demo.py
```

### Đánh giá hệ thống:
```bash
python main_eval.py --test
```

## 🔧 Các model Ollama khuyên dùng

| Model | Kích thước | Chất lượng | Tốc độ |
|-------|------------|------------|---------|
| `llama3.1:latest` | 8B | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| `mistral:latest` | 7B | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| `llama3.2:latest` | 3B | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| `gemma2:2b` | 2B | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## ⚠️ Xử lý lỗi thường gặp

### Lỗi: "Ollama not found"
```bash
# Kiểm tra PATH
echo %PATH%
# Thêm Ollama vào PATH nếu cần
```

### Lỗi: "Model not found"
```bash
# Pull model lại
ollama pull llama3.1:latest
```

### Lỗi: Vector database empty
```bash
# Chạy Phase 2
python backend/main_phase2.py
```

### Lỗi: Qdrant locked
```bash
# Đóng tất cả Python processes
taskkill /f /im python.exe
# Chạy lại
```

## 🎯 Chạy tự động với script
```bash
# Chạy file batch
run_with_ollama.bat

# Hoặc tạo alias trong PowerShell
New-Alias -Name rag-ollama -Value "python backend/main_chat.py --provider ollama"
```

## 📞 Hỗ trợ
Nếu gặp vấn đề:
1. Kiểm tra Ollama đang chạy: `ollama serve`
2. Kiểm tra model: `ollama list`
3. Kiểm tra logs: xem file `chat_history.json` hoặc console output

## 🎉 Bắt đầu chat!
Sau khi chạy thành công, bạn sẽ thấy:
```
========================================
 LEGAL RAG CHATBOT - OLLAMA MODE  
========================================

Bạn là: Chuyên gia Pháp chế Nhân sự
Chế độ: Local với Ollama
Model: llama3.1:latest
Temperature: 0.0 (độ chính xác cao)

Nhập câu hỏi pháp lý (hoặc 'quit' để thoát):
> 
```

## Đánh giá chất lượng retrieval

Bộ dữ liệu đánh giá nằm trong `evaluation_dataset.json`. Chạy:

```powershell
python backend/evaluate_rag.py --top-k 5
```

Kết quả gồm `recall_at_5`, `mrr` và `citation_accuracy`.

## Cấu hình nâng cao

Các biến môi trường tùy chọn:

```powershell
$env:RAG_RERANKER_MODEL="BAAI/bge-reranker-v2-m3"
$env:RAG_MAX_CONTEXT_CHARS="12000"
$env:RAG_MAX_CONTEXT_DOCUMENTS="4"
$env:LLM_REQUEST_TIMEOUT_SECONDS="120"
$env:LLM_MAX_RETRIES="2"
$env:LLM_RETRY_BACKOFF_SECONDS="1"
```

Không đặt `RAG_RERANKER_MODEL` nếu muốn dùng scoring semantic + metadata mặc định.
Reranker sẽ được tải từ Hugging Face ở lần chạy đầu và làm tăng thời gian khởi động.
