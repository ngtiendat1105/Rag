# LegalAI

LegalAI là trợ lý tra cứu pháp lý nội bộ, dùng Next.js, Supabase, Resend,
Amazon Bedrock, Qdrant Cloud, API Gateway và AWS Lambda.

## Kiến trúc

```text
Browser → Amplify (Next.js) → API Gateway → Lambda (FastAPI)
                                                    ├─ Titan Embeddings V2
                                                    ├─ Qdrant Cloud
                                                    └─ Nova Lite Converse API

Supabase: users, profiles và metadata ứng dụng
Resend: OTP email
```

| Thành phần | Vai trò |
|---|---|
| Next.js | Chat, đăng nhập, hồ sơ, admin |
| Supabase | User và dữ liệu ứng dụng |
| Resend | Gửi OTP |
| Amplify | Deploy frontend theo branch |
| Lambda + API Gateway | Backend FastAPI serverless |
| Bedrock Nova Lite | Sinh câu trả lời |
| Bedrock Titan V2 | Embedding |
| Qdrant Cloud | Vector search |

## Cấu trúc

```text
src/                    # Next.js frontend và API routes
backend/                # FastAPI, RAG pipeline và Bedrock adapters
backend/data_documents/ # Tài liệu nguồn local
deployment/lambda/      # Dockerfile và IAM policy
deployment/scripts/     # Smoke tests
supabase/               # Schema và migrations
docs/                   # Tài liệu setup
```

## Chạy local

```powershell
npm install
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
```

Backend:

```powershell
python -m uvicorn --app-dir backend api:app --host 127.0.0.1 --port 8000
```

Frontend:

```powershell
npm run dev
```

## Environment

Không commit `.env.local`. Cấu hình chính:

```dotenv
RAG_LLM_PROVIDER=bedrock
RAG_LLM_MODEL=us.amazon.nova-lite-v1:0
BEDROCK_REGION=us-east-1
RAG_EMBEDDING_PROVIDER=bedrock
RAG_EMBEDDING_MODEL=amazon.titan-embed-text-v2:0
RAG_EMBEDDING_DIMENSION=1024
QDRANT_COLLECTION=legal_knowledge_base_titan_v2_1024
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-key
LEGALAI_API_KEY=your-internal-api-key
RAG_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com
```

Lambda dùng IAM execution role để gọi Bedrock, không đặt AWS access key trong
image. Secret Supabase, Resend, Qdrant và API key phải để server-side.

## Qdrant và indexing

Production dùng collection `legal_knowledge_base_titan_v2_1024`, embedding
`amazon.titan-embed-text-v2:0`, dimension 1024 và khoảng cách Cosine.
Collection cũ `legal_knowledge_base` vẫn giữ để rollback; không trộn vector
768 chiều với collection Titan 1024 chiều.

```powershell
.\.venv\Scripts\python.exe backend\sync_documents.py
.\.venv\Scripts\python.exe backend\payload_indexes.py --apply
```

## Upload tài liệu

Để file người dùng được dùng trong RAG, nên triển khai:

```text
Frontend → S3 presigned URL → S3 → SQS → Lambda worker
                                      ↓
                        PDF/DOCX parser hoặc Textract
                                      ↓
                           Chunking → Titan Embeddings
                                      ↓
                                 Qdrant Cloud
```

Vector cần metadata `user_id`, `document_id`, `file_name`, `page`. Supabase
lưu trạng thái `uploaded`, `processing`, `ready`, `failed`. Retriever phải lọc
theo `user_id` để bảo vệ tài liệu riêng.

## Kiểm thử

```powershell
npm run build
.\.venv\Scripts\python.exe -m pytest backend\tests\unit -q
.\.venv\Scripts\python.exe deployment\scripts\verify_bedrock_rag.py
```

```powershell
.\.venv\Scripts\python.exe deployment\scripts\verify_bedrock_rag.py --lambda-function legalai-rag
.\.venv\Scripts\python.exe deployment\scripts\verify_bedrock_rag.py --api-url https://your-api-id.execute-api.us-east-1.amazonaws.com
```

## Deploy Lambda

```powershell
$ecrUri="ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/legalai-rag"
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ecrUri
docker buildx build --platform linux/amd64 --provenance=false -f deployment/lambda/Dockerfile -t "${ecrUri}:latest" --push .
aws lambda update-function-code --function-name legalai-rag --image-uri "${ecrUri}:latest" --publish --region us-east-1
```

## Git và Amplify

```text
feature/* → dev → main
```

| Branch | Mục đích | Domain |
|---|---|---|
| `main` | Production | `legalai.id.vn` |
| `dev` | Staging | Amplify branch domain |
| `feature/*` | Preview | Amplify preview domain |

```powershell
git checkout dev
git pull origin dev
git checkout -b feature/ten-chuc-nang
git add .
git commit -m "Describe the change"
git push -u origin feature/ten-chuc-nang
```

Sau khi kiểm thử `dev`, tạo Pull Request `dev → main`. Amplify tự chạy
`npm ci` và `npm run build`; mỗi branch cần có `RAG_API_URL` đúng.

## Bảo mật

- Không commit `.env.local`, Supabase service-role key, Resend key hoặc Qdrant key.
- Bật RLS cho bảng Supabase.
- Lọc Qdrant theo `user_id` và `document_id`.
- Giới hạn loại file và dung lượng upload.
- Theo dõi Lambda, Bedrock, API Gateway, SQS và worker bằng CloudWatch.
- Giữ Lambda version ổn định để rollback.

## Tài liệu liên quan

- [deployment/lambda/BEDROCK.md](deployment/lambda/BEDROCK.md)
- [docs/rag/RAG_SYSTEM.md](docs/rag/RAG_SYSTEM.md)
- [docs/setup/SUPABASE_SETUP.md](docs/setup/SUPABASE_SETUP.md)
- [docs/setup/RESEND_SETUP.md](docs/setup/RESEND_SETUP.md)
- [docs/testing/TEST_INSTRUCTIONS.md](docs/testing/TEST_INSTRUCTIONS.md)
