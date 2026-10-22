"""Quick test to verify the fix"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from config_llm import LLMConfig, LLMProvider
from rag_pipeline import create_rag_pipeline

print("=" * 70)
print("QUICK TEST - Fixed RAG Pipeline")
print("=" * 70)

# Kill any existing processes first
import subprocess
subprocess.run("taskkill /F /IM python.exe 2>nul", shell=True, capture_output=True)
import time
time.sleep(2)

print("\n1. Initializing pipeline...")
try:
    pipeline = create_rag_pipeline(
        provider=LLMProvider.OLLAMA,
        model_name="llama3.2:latest"
    )
    print("   OK - Pipeline ready")
except Exception as e:
    print(f"   ERROR: {e}")
    sys.exit(1)

print("\n2. Testing Vietnamese query...")
question = "Hop dong lao dong phai co nhung noi dung chinh nao?"
print(f"   Q: {question}")

try:
    result = pipeline.query(question)
    
    if 'error' in result:
        print(f"   ERROR: {result['error']}")
    else:
        answer = result.get('answer', '')
        print(f"\n3. Answer ({len(answer)} chars):")
        print("   " + "-" * 66)
        
        # Print answer lines
        lines = answer.split('\n')
        for line in lines[:20]:  # First 20 lines
            print(f"   {line}")
        
        if len(lines) > 20:
            print(f"   ... (+{len(lines)-20} more lines)")
        
        print("   " + "-" * 66)
        
        # Check if answer looks good
        if len(answer) > 100 and answer.count('[') < 5:
            print("\n   Result: GOOD - Answer has content, not just citations")
        else:
            print("\n   Result: CHECK - Answer may have issues")
        
        print(f"\n4. Stats:")
        print(f"   Sources: {result.get('num_sources', 0)}")
        print(f"   Warning: {result.get('has_warning', False)}")
        
except Exception as e:
    print(f"   ERROR: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
print("Test complete")
print("=" * 70)
