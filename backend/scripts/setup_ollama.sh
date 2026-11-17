#!/usr/bin/env sh
set -eu

OLLAMA_URL="${OLLAMA_BASE_URL:-http://127.0.0.1:11434}"
MODELS="${RAG_BENCHMARK_MODELS:-llama3.2:latest llama3.1:latest mistral:latest}"

command -v ollama >/dev/null 2>&1 || { echo "ollama is required"; exit 1; }
if command -v nvidia-smi >/dev/null 2>&1; then nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
else echo "No NVIDIA GPU detected; Ollama will use CPU/available accelerator."
fi
until curl --fail --silent "$OLLAMA_URL/api/tags" >/dev/null; do sleep 2; done
for model in $MODELS; do ollama pull "$model"; done
ollama list
if command -v systemctl >/dev/null 2>&1 && systemctl is-enabled ollama >/dev/null 2>&1; then
  sudo systemctl restart ollama
fi
