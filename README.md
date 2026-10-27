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

## Retrieve-and-rerank

The retriever performs a wide Qdrant search before sending only the best
documents to the LLM. The default configuration retrieves 8 candidates and
keeps 3 after reranking:

```env
RAG_TOP_K=8
RAG_RETRIEVAL_TOP_K=8
RAG_RERANK_TOP_N=3
RAG_RERANKER_MODEL=
RAG_RERANKER_MAX_LENGTH=512
```

Set `RAG_RERANKER_MODEL` to a locally available Sentence Transformers
CrossEncoder to enable reranking. `BAAI/bge-reranker-v2-m3` is the preferred
multilingual starting point for Vietnamese queries, at the cost of additional
RAM and model download. Leave it empty for lower latency; if reranking fails,
the service automatically falls back to Qdrant/lexical ranking.

## Benchmark LLM local

Benchmark Ollama trên cùng bộ câu hỏi pháp lý:

```powershell
# Dừng backend FastAPI trước vì Qdrant local chỉ cho một process truy cập.
python backend/benchmark_llm.py --models llama3.2:latest llama3.1:latest mistral:latest
```

Model chưa cài sẽ được bỏ qua. Để tự động tải model:

```powershell
python backend/benchmark_llm.py --pull
```

Kết quả được ghi vào `llm_benchmark_results.json` và
`llm_benchmark_report.md`. Benchmark đo các proxy chất lượng
faithfulness/relevance/citation/unsupported-claim cùng TTFT, TPS và kích
thước model Ollama đang resident. Các proxy không thay thế review pháp lý thủ
công.

Chuyển model chạy local bằng `.env.local`, sau đó restart FastAPI:

```env
RAG_LLM_PROVIDER=ollama
RAG_LLM_MODEL=llama3.1:latest
OLLAMA_BASE_URL=http://127.0.0.1:11434
```

### Model selection matrix

| Phần cứng | Model nên thử | Ghi chú |
|---|---|---|
| RAM 8 GB, CPU | `llama3.2:latest` | Nhanh, context ngắn; phù hợp baseline |
| RAM 16 GB, CPU/GPU 6 GB | `llama3.1:latest`, `mistral:latest` | Cân bằng chất lượng và tốc độ |
| RAM 16–32 GB, VRAM 8 GB | `qwen2.5:7b` | Nên benchmark tiếng Việt thực tế trước khi dùng |
| VRAM 12 GB trở lên | `vistral:7b` hoặc model 7B multilingual | Chất lượng tiềm năng cao hơn, phụ thuộc tag Ollama |

Không pull model chỉ dựa trên tên ví dụ; hãy xác nhận tag tồn tại bằng
`ollama search`/Ollama registry và đo trên đúng phần cứng production.

### Production Ollama

Trên server Linux:

```bash
RAG_BENCHMARK_MODELS="llama3.1:latest mistral:latest" \
  sh backend/scripts/setup_ollama.sh
```

Script sẽ kiểm tra Ollama, GPU NVIDIA nếu có, pull model và restart service
đã được systemd enable. Sau đó đặt `RAG_LLM_MODEL` trên backend production,
restart FastAPI một worker, rồi kiểm tra `/health` và chạy benchmark smoke test.

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
