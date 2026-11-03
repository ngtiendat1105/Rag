FROM public.ecr.aws/lambda/python:3.12

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HF_HOME=/opt/huggingface \
    TRANSFORMERS_CACHE=/opt/huggingface

COPY backend/requirements.lambda.txt ${LAMBDA_TASK_ROOT}/requirements.txt

RUN python -m pip install --no-cache-dir \
    -r ${LAMBDA_TASK_ROOT}/requirements.txt \
    --target ${LAMBDA_TASK_ROOT}

COPY backend/ ${LAMBDA_TASK_ROOT}/

# Bake the embedding model into the image to avoid downloading it on cold start.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/paraphrase-multilingual-mpnet-base-v2')"

CMD ["lambda_handler.handler"]
