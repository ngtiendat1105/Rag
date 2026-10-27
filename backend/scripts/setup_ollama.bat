@echo off
setlocal
set "MODELS=%RAG_BENCHMARK_MODELS%"
if "%MODELS%"=="" set "MODELS=llama3.2:latest llama3.1:latest mistral:latest"
where ollama >nul 2>&1 || (echo Ollama is required & exit /b 1)
where nvidia-smi >nul 2>&1 && nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
for %%M in (%MODELS%) do ollama pull %%M
ollama list
echo Ollama models are ready. Restart the backend to apply RAG_LLM_MODEL.
endlocal
