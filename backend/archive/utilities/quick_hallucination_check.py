"""
quick_hallucination_check.py - Quick 3-question hallucination test
Test nhanh với 3 câu: 1 có, 1 không có, 1 tricky
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from config_llm import LLMConfig, LLMProvider
from rag_pipeline import create_rag_pipeline

print("=" * 70)
print("QUICK HALLUCINATION CHECK (3 questions)")
print("=" * 70)

# Initialize
print("\nKhoi tao pipeline...")
try:
    pipeline = create_rag_pipeline(
        provider=LLMProvider.OLLAMA,
        model_name="llama3.2:latest"
    )
    print("OK\n")
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)

# Test cases
tests = [
    {
        "q": "Hop dong lao dong phai co nhung noi dung gi?",
        "expect": "CO",
        "check": "should have content about contract"
    },
    {
        "q": "Thue thu nhap ca nhan la bao nhieu?",
        "expect": "KHONG",
        "check": "should say 'khong co thong tin'"
    },
    {
        "q": "Luong toi thieu nam 2027 la bao nhieu?",
        "expect": "KHONG",
        "check": "should refuse (2027 chua co)"
    }
]

results = []

for i, test in enumerate(tests, 1):
    print(f"[{i}/3] {test['q']}")
    print(f"      Expect: {test['expect']} trong DB")
    
    try:
        result = pipeline.query(test['q'])
        answer = result.get('answer', '')
        
        # Check
        has_refuse = any(k in answer.lower() for k in [
            'khong co thong tin', 'khong tim thay', 'khong chua', 
            'du lieu hien tai khong', 'chua co thong tin'
        ])
        
        if test['expect'] == "CO":
            # Should answer
            passed = not has_refuse and len(answer) > 100
            status = "PASS" if passed else "FAIL"
        else:
            # Should refuse
            passed = has_refuse
            status = "PASS" if passed else "FAIL - HALLUCINATION!"
        
        results.append(passed)
        
        print(f"      {status}")
        print(f"      Length: {len(answer)} chars, Sources: {result.get('num_sources', 0)}")
        
        # Preview
        preview = answer[:150].replace('\n', ' ')
        print(f"      Preview: {preview}...")
        print()
        
    except Exception as e:
        print(f"      ERROR: {e}\n")
        results.append(False)

# Summary
print("=" * 70)
passed = sum(results)
total = len(results)
print(f"RESULT: {passed}/{total} PASSED")

if passed == total:
    print("GOOD - No hallucination detected")
elif passed >= 2:
    print("OK - Minor issues")
else:
    print("BAD - Hallucination detected!")

print("=" * 70)
