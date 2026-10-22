# Legal AI RAG Backend

Backend FastAPI đọc tài liệu trong `data_documents`, tạo embeddings, lưu Qdrant và dùng Ollama để sinh câu trả lời có nguồn.

Chạy các lệnh sau từ thư mục gốc repository:

```powershell
python -m pip install -r backend/requirements.txt
python backend/sync_documents.py
python -m uvicorn --app-dir backend api:app --host 127.0.0.1 --port 8000
```

Kiểm tra:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
python -m pytest -q
```

Các test tích hợp cũ cần Ollama/Qdrant nằm trong `tests/integration` và có thể chạy riêng khi cần.

Các biến môi trường được đọc từ `.env.local` ở root repository. Khi deploy backend độc lập, cấu hình chúng trực tiếp trên nền tảng deploy hoặc đặt file `.env.local` cạnh thư mục `backend` theo chính sách secret của nền tảng.
