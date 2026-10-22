#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Quick test of retriever and RAG fixes"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

def test_retriever():
    """Test retriever service"""
    print("Starting retriever test...")
    
    try:
        from retriever_service import LegalRetrieverService
        print("Step 1: LegalRetrieverService imported OK")
        
        # Initialize
        retriever = LegalRetrieverService()
        print("Step 2: LegalRetrieverService initialized OK")
        
        # Test retrieval
        query = "hop dong lao dong can co gi"
        docs = retriever.retrieve_documents(query, k=2)
        print(f"Step 3: Retrieved {len(docs)} documents OK")
        
        if docs:
            print("\nFirst document:")
            print(f"  Content: {docs[0].page_content[:100]}...")
            print(f"  Metadata: {docs[0].metadata.get('title', 'N/A')}")
        
        print("\n✓ All tests passed!")
        return True
        
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_retriever()
    sys.exit(0 if success else 1)
