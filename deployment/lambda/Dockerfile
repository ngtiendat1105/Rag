FROM public.ecr.aws/lambda/python:3.12

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    AWS_EC2_METADATA_DISABLED=true

COPY backend/requirements.lambda.txt ${LAMBDA_TASK_ROOT}/requirements.txt

RUN python -m pip install --no-cache-dir \
    -r ${LAMBDA_TASK_ROOT}/requirements.txt \
    --target ${LAMBDA_TASK_ROOT} \
    && python -m pip check

COPY backend/ ${LAMBDA_TASK_ROOT}/

RUN python -c "from api import app; from bedrock_llm import create_bedrock_llm; from retriever_service import LegalRetrieverService"

CMD ["lambda_handler.handler"]
