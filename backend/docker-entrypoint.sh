#!/bin/sh
set -eu

echo "Waiting for Ollama at ${OLLAMA_BASE_URL:-http://ollama:11434}..."
until curl --fail --silent "${OLLAMA_BASE_URL:-http://ollama:11434}/api/tags" >/dev/null; do
  sleep 2
done

MODEL_NAME="${RAG_LLM_MODEL:-llama3.2:3b}"
echo "Ensuring Ollama model ${MODEL_NAME} is available..."
curl --fail --silent --show-error \
  "${OLLAMA_BASE_URL:-http://ollama:11434}/api/pull" \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"${MODEL_NAME}\",\"stream\":false}" >/dev/null

if [ ! -f /app/vector_db/qdrant_storage/meta.json ]; then
  echo "Building the document index for the first deployment..."
  python /app/sync_documents.py
else
  echo "Using the existing persistent document index."
fi

exec python -m uvicorn api:app --host 0.0.0.0 --port 8000 --workers 1
