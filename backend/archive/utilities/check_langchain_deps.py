"""
check_langchain_deps.py - Kiểm tra dependencies cần thiết cho LangChain và LLM
"""

import sys

def check_package(package_name, import_name=None):
    """Kiểm tra package có được cài đặt không"""
    if import_name is None:
        import_name = package_name
    
    try:
        __import__(import_name)
        return True
    except ImportError:
        return False

def main():
    print("🧪 Kiểm tra dependencies LangChain và LLM...")
    print("=" * 70)
    
    # Các package cần thiết
    required_packages = [
        ("langchain", "langchain", "LangChain core"),
        ("langchain-community", "langchain_community", "LangChain community packages"),
        ("langchain-openai", "langchain_openai", "OpenAI integration"),
        ("langchain-google-genai", "langchain_google_genai", "Google Gemini integration"),
        ("openai", "openai", "OpenAI API"),
        ("google-generativeai", "google.generativeai", "Google Gemini API"),
    ]
    
    optional_packages = [
        ("langchain-huggingface", "langchain_huggingface", "HuggingFace models (optional)"),
        ("ollama", "ollama", "Ollama local models (optional)"),
        ("langchain-ollama", "langchain_ollama", "Ollama integration (optional)"),
    ]
    
    print("📦 REQUIRED PACKAGES:")
    missing_required = []
    for package, import_name, description in required_packages:
        installed = check_package(package, import_name)
        status = "✅" if installed else "❌"
        print(f"  {status} {package}: {description}")
        if not installed:
            missing_required.append(package)
    
    print("\n📦 OPTIONAL PACKAGES:")
    for package, import_name, description in optional_packages:
        installed = check_package(package, import_name)
        status = "✅" if installed else "⚠️"
        print(f"  {status} {package}: {description}")
    
    print("\n" + "=" * 70)
    
    if missing_required:
        print("❌ THIẾU DEPENDENCIES BẮT BUỘC:")
        for package in missing_required:
            print(f"  - {package}")
        
        print("\n💡 CÀI ĐẶT:")
        print(f"  pip install {' '.join(missing_required)}")
        
        # Kiểm tra phiên bản Python
        print(f"\n🐍 Python version: {sys.version}")
        print(f"   Python path: {sys.executable}")
        
        return False
    else:
        print("✅ TẤT CẢ DEPENDENCIES BẮT BUỘC ĐÃ ĐƯỢC CÀI ĐẶT")
        print("\n💡 Có thể chạy hệ thống với các LLM:")
        print("   1. OpenAI GPT (cần API key)")
        print("   2. Google Gemini (cần API key)")
        print("   3. Local Ollama (cần cài đặt Ollama)")
        print("   4. HuggingFace models (local inference)")
        return True

if __name__ == "__main__":
    main()