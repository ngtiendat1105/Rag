@echo off
cd /d "%~dp0.."
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
echo [2] Checking configured Llama model...
set "RAG_MODEL=%RAG_LLM_MODEL%"
if "%RAG_MODEL%"=="" set "RAG_MODEL=llama3.2:latest"
ollama list | findstr /I "%RAG_MODEL%" >nul
if errorlevel 1 (
    echo Model %RAG_MODEL% not found. Pulling...
    ollama pull %RAG_MODEL%
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
python main_chat.py --provider ollama --model %RAG_MODEL%

pause
