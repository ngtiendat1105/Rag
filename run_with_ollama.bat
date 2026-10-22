@echo off
echo ========================================
echo  RUN RAG SYSTEM WITH OLLAMA (Windows)
echo ========================================
echo.

REM 1. Check Ollama installation
echo [1] Checking Ollama installation...
ollama --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Ollama not found!
    echo Please install from: https://ollama.com/download/windows
    pause
    exit /b 1
)
echo ✅ Ollama is installed

REM 2. Check if model exists
echo [2] Checking Llama model...
ollama list | findstr "llama3" >nul
if errorlevel 1 (
    echo ⚠️  Llama model not found. Pulling llama3.1:latest...
    ollama pull llama3.1:latest
) else (
    echo ✅ Llama model found
)

REM 3. Check vector database
echo [3] Checking vector database...
if not exist "vector_db\qdrant_storage" (
    echo ⚠️  Vector database not found. Running Phase 2...
    python main_phase2.py
    if errorlevel 1 (
        echo ERROR: Phase 2 failed!
        pause
        exit /b 1
    )
) else (
    echo ✅ Vector database found
)

REM 4. Run the system
echo [4] Starting RAG system with Ollama...
echo.
echo ========================================
echo  LEGAL RAG CHATBOT - OLLAMA MODE
echo ========================================
echo.
python main_chat.py --provider ollama --model llama3.1:latest

pause