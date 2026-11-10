FROM public.ecr.aws/lambda/python:3.12

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HF_HOME=/opt/huggingface \
    TRANSFORMERS_CACHE=/opt/huggingface \
    TOKENIZERS_PARALLELISM=false \
    OMP_NUM_THREADS=2 \
    MKL_NUM_THREADS=2 \
    OPENBLAS_NUM_THREADS=2

COPY backend/requirements.lambda.txt ${LAMBDA_TASK_ROOT}/requirements.txt

RUN python -m pip install --no-cache-dir \
    -r ${LAMBDA_TASK_ROOT}/requirements.txt \
    --target ${LAMBDA_TASK_ROOT} \
    && python -m pip check

# Store a complete local model; code-only changes reuse this expensive layer.
RUN python -c "from sentence_transformers import SentenceTransformer; m=SentenceTransformer('sentence-transformers/paraphrase-multilingual-mpnet-base-v2'); m.save('/opt/embedding-model'); assert m.encode(['kiem tra'], normalize_embeddings=True).shape == (1, 768)" \
    && chmod -R a+rX /opt/embedding-model \
    && rm -rf /opt/huggingface

# The model is present in the image; prevent runtime cold starts from waiting
# on Hugging Face network calls.
ENV HF_HUB_OFFLINE=1 \
    TRANSFORMERS_OFFLINE=1 \
    EMBEDDING_MODEL_PATH=/opt/embedding-model

COPY backend/ ${LAMBDA_TASK_ROOT}/

RUN python -c "from api import app; from bedrock_llm import create_bedrock_llm; from retriever_service import LegalRetrieverService"

# Lambda runs with a least-privilege user. Test a fresh offline load using that
# permission model, rather than encoding with the original in-memory model.
RUN python -c "import os; os.setgid(10001); os.setuid(10001); from sentence_transformers import SentenceTransformer; m=SentenceTransformer('/opt/embedding-model', local_files_only=True, trust_remote_code=False); assert m.encode(['kiem tra'], normalize_embeddings=True).shape == (1, 768)"

CMD ["lambda_handler.handler"]
