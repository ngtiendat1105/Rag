"""AWS Lambda entry point for the FastAPI RAG service."""

from mangum import Mangum

from api import app


# API Gateway HTTP API payloads are translated to ASGI by Mangum.
handler = Mangum(app, lifespan="off")
