# Deploy Legal AI

Kiến trúc production:

- Vercel chạy ứng dụng Next.js.
- Một VPS Linux chạy FastAPI, Ollama và Qdrant local bằng Docker Compose.
- Caddy chỉ công khai FastAPI qua HTTPS; Ollama không mở ra Internet.
- Docker volumes giữ model embedding, model Ollama và vector database sau khi restart.

## 1. Chuẩn bị máy chủ

Khuyến nghị Ubuntu 24.04, tối thiểu 4 CPU, 8 GB RAM và 30 GB SSD. Máy có GPU NVIDIA sẽ phản hồi nhanh hơn đáng kể. Cài Git, Docker Engine và Docker Compose plugin.

Clone repository lên máy chủ rồi chuyển vào thư mục dự án:

```bash
git clone https://github.com/ngtiendat1105/Rag.git
cd Rag
```

## 2. Cấu hình DNS

Tại nơi quản lý DNS của `legalai.id.vn`, tạo bản ghi:

```text
Type: A
Name: api
Value: IP_PUBLIC_CUA_VPS
Proxy: DNS only trong lần cấp chứng chỉ đầu tiên
```

Mở inbound TCP 80 và 443 trong firewall hoặc security group. Không mở cổng 8000 và 11434.

## 3. Cấu hình backend

```bash
cd deployment
cp .env.example .env
nano .env
```

Thay `LEGALAI_API_KEY` bằng chuỗi bí mật dài. Giá trị này phải giống hệt biến cùng tên trên Vercel. Không commit file `deployment/.env`.

Khởi động hệ thống:

```bash
docker compose up -d --build
docker compose logs -f rag-api
```

Lần đầu có thể mất nhiều phút vì Docker tải model Ollama, model embedding và tạo vector index. Kiểm tra khi hoàn tất:

```bash
curl https://api.legalai.id.vn/health
```

Kết quả mong đợi:

```json
{"status":"ok","service":"legalai-rag"}
```

## 4. Cấu hình Vercel

Trong Project Settings > Environment Variables, đặt cho Production, Preview và Development nếu cần:

```text
RAG_API_URL=https://api.legalai.id.vn
LEGALAI_API_KEY=<cùng giá trị trong deployment/.env>
RAG_REQUEST_TIMEOUT_MS=180000
```

Giữ các biến Supabase, Resend và `AUTH_SESSION_SECRET` hiện có. Sau khi thay biến, Redeploy dự án Vercel.

## 5. Cập nhật tài liệu

Sau khi thay file trong `backend/data_documents`, chạy trên VPS:

```bash
cd deployment
docker compose exec rag-api python /app/sync_documents.py
docker compose restart rag-api
```

## 6. Vận hành

```bash
docker compose ps
docker compose logs --tail=200 rag-api
docker compose restart rag-api
docker compose pull
docker compose up -d --build
```

Sao lưu các volume `rag_vectors` và `rag_processed`, hoặc đảm bảo có thể dựng lại chúng từ `backend/data_documents`.
