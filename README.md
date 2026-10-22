# Legal AI

Ứng dụng hỏi đáp pháp lý gồm giao diện Next.js, quản lý người dùng bằng Supabase và dịch vụ RAG Python sử dụng Qdrant + Ollama.

## Cấu trúc dự án

```text
webRag/
├── src/                    # Frontend Next.js và API routes
├── backend/                # FastAPI và toàn bộ RAG pipeline
│   ├── data_documents/     # Tài liệu nguồn Markdown, PDF, DOCX
│   ├── evaluation/         # Bộ dữ liệu đánh giá retrieval
│   ├── tests/              # Kiểm thử Python
│   ├── processed_output/   # JSONL sinh tự động, không commit
│   ├── vector_db/          # Qdrant local, không commit
│   ├── api.py              # FastAPI entrypoint
│   ├── sync_documents.py   # Đồng bộ và lập chỉ mục tài liệu
│   └── requirements.txt
├── docs/                   # Hướng dẫn setup, testing và RAG
├── scripts/                # Tiện ích frontend/Node.js
├── supabase/               # Schema và migration Supabase
└── .env.local              # Biến môi trường local, không commit
```

## Chạy local

Cài frontend và backend:

```powershell
npm install
python -m pip install -r backend/requirements.txt
```

Đồng bộ tài liệu khi mới cài hoặc sau khi thay đổi file trong `backend/data_documents`:

```powershell
$env:HF_HUB_OFFLINE='1' # chỉ dùng khi model embedding đã có trong cache
python backend/sync_documents.py
```

Chạy FastAPI tại thư mục gốc dự án:

```powershell
python -m uvicorn --app-dir backend api:app --host 127.0.0.1 --port 8000
```

Hoặc dùng script ngắn:

```powershell
npm run rag:api
```

Chạy Next.js trong terminal khác:

```powershell
npm run dev
```

Mở địa chỉ Next.js in ra terminal, thường là `http://localhost:3000` hoặc `http://localhost:3001`.

## Hồ sơ người dùng

Người dùng đã đăng nhập có thể mở `/profile` từ menu tài khoản trên trang chat để cập nhật họ tên, số điện thoại và ảnh đại diện. Trước khi sử dụng, chạy migration `supabase/migrations/20261022_add_profile_fields.sql` trong Supabase SQL Editor.

## Deploy

- Frontend: deploy thư mục gốc lên Vercel.
- Backend: deploy FastAPI, Ollama và Qdrant lên VPS bằng Docker Compose trong `deployment/`.
- `RAG_API_URL` trên Vercel phải trỏ tới URL FastAPI public.
- Qdrant local chỉ phù hợp cho một tiến trình; production nên dùng Qdrant Cloud hoặc Qdrant server.
- Không commit `.env.local`, `backend/vector_db` hoặc `backend/processed_output`.

Hướng dẫn từng bước: [deployment/README.md](deployment/README.md).

Xem thêm:

- [Kiến trúc và vận hành RAG](docs/rag/RAG_SYSTEM.md)
- [Thiết lập Supabase](docs/setup/SUPABASE_SETUP.md)
- [Thiết lập Resend](docs/setup/RESEND_SETUP.md)
- [Hướng dẫn kiểm thử](docs/testing/TEST_INSTRUCTIONS.md)
