"""
RAG Pipeline Module - Giai đoạn 3: Xây dựng Pipeline RAG với LangChain LCEL
Module này tạo pipeline RAG hoàn chỉnh tích hợp retrieval, context checking và LLM generation.
"""
import logging
import os
import time
from typing import List, Dict, Any, Optional, Tuple
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda

from config_llm import LLMConfig, LLMProvider
from prompts import LegalPrompts
from retriever_service import (
    LegalRetrieverService as RetrieverService,
    RetrievalError,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
MAX_CONTEXT_CHARS = int(os.getenv("RAG_MAX_CONTEXT_CHARS", "12000"))
MAX_CONTEXT_DOCUMENTS = int(os.getenv("RAG_MAX_CONTEXT_DOCUMENTS", "4"))
LLM_RETRY_BACKOFF_SECONDS = float(os.getenv("LLM_RETRY_BACKOFF_SECONDS", "1"))


class RAGPipeline:
    """
    Pipeline RAG chính tích hợp LangChain LCEL.
    Xử lý retrieval, context checking, và generation với warning handling.
    """
    
    def __init__(self, config: Optional[LLMConfig] = None, retriever_service: Optional[RetrieverService] = None):
        """
        Khởi tạo pipeline RAG.
        
        Args:
            config: Cấu hình LLM (mặc định: OpenAI)
            retriever_service: Service retrieval (nếu None sẽ tạo mới)
        """
        self.config = config or LLMConfig(provider=LLMProvider.OPENAI)
        self.llm = self.config.get_llm()
        self.prompt_class = LegalPrompts
        
        if retriever_service:
            self.retriever_service = retriever_service
        else:
            try:
                self.retriever_service = RetrieverService()
            except Exception as e:
                logger.error(f"Không thể khởi tạo RetrieverService: {e}")
                raise
        
        # Tạo chain LCEL
        self.rag_chain = self._build_lcel_chain()
        
    def _build_lcel_chain(self):
        """
        Xây dựng chain LCEL đơn giản:
        question -> retrieve -> format -> prompt -> llm -> answer
        """
        
        # Retrieval is performed once in query(); this chain only generates an answer.
        chain = (
            RunnableLambda(lambda prompt: prompt)
            | self.llm
            | StrOutputParser()
        )
        
        return chain

    def _build_prompt(self, question: str, raw_docs: List[Any]) -> str:
        """Build a bounded prompt from the documents returned by one retrieval."""
        context_parts = []
        remaining = MAX_CONTEXT_CHARS
        for i, doc in enumerate(raw_docs[:MAX_CONTEXT_DOCUMENTS], 1):
            if remaining <= 0:
                break
            metadata = doc.metadata or {}
            title = metadata.get("title", metadata.get("document_name", "Văn bản pháp luật"))
            article = metadata.get("article_number", metadata.get("article", ""))
            header = f"--- TÀI LIỆU {i} ---"
            if title:
                header += f"\nNguồn: {title}"
            if article:
                header += f", Điều {article}"
            block = f"{header}\n{doc.page_content}\n"
            context_parts.append(block[:remaining])
            remaining -= len(block)

        context = "\n".join(context_parts)
        return f"""Bạn là chuyên gia pháp lý về luật lao động Việt Nam.

CÂU HỎI: {question}

TÀI LIỆU THAM KHẢO:
{context}

YÊU CẦU:
- Trả lời DỰA TRÊN tài liệu trên
- Sử dụng tiếng Việt rõ ràng, dễ hiểu
- Nêu nguồn văn bản nếu có
- NẾU không có thông tin, nói rõ "Tài liệu hiện tại không có thông tin về vấn đề này"

TRẢ LỜI:"""

    def _invoke_with_retry(self, prompt: str) -> str:
        attempts = int(getattr(self.config, "MAX_RETRIES", 2)) + 1
        for attempt in range(attempts):
            try:
                return self.rag_chain.invoke(prompt)
            except Exception as exc:
                message = str(exc).lower()
                retryable = (
                    isinstance(exc, TimeoutError)
                    or "timeout" in message
                    or "rate limit" in message
                    or "429" in message
                    or "temporarily unavailable" in message
                )
                if not retryable or attempt == attempts - 1:
                    raise
                time.sleep(LLM_RETRY_BACKOFF_SECONDS * (2 ** attempt))
    
    def _check_warning_required(self, documents: List[Dict[str, Any]]) -> bool:
        """
        Kiểm tra xem có cần thêm warning [ĐỐI CHIẾU] không.
        
        Args:
            documents: Danh sách documents đã retrieve
            
        Returns:
            True nếu cần warning (có [ĐỐI CHIẾU] hoặc is_verified==False)
        """
        for doc in documents:
            metadata = doc.get("metadata", {})
            content = doc.get("page_content", "")
            
            # Kiểm tra [ĐỐI CHIẾU] trong content
            if "[ĐỐI CHIẾU]" in content:
                return True
            
            # Kiểm tra is_verified trong metadata
            if not metadata.get("is_verified", True):
                return True
        
        return False
    
    def query(self, question: str) -> Dict[str, Any]:
        """
        Thực hiện query trên pipeline RAG.
        
        Args:
            question: Câu hỏi cần trả lời
            
        Returns:
            Dictionary với keys: answer, sources, has_warning
        """
        try:
            logger.info(f"Đang xử lý câu hỏi: {question}")
            
            # Retrieve once and reuse the same documents for prompt, warnings, and sources.
            raw_docs = self.retriever_service.retrieve_documents(
                question,
                k=MAX_CONTEXT_DOCUMENTS
            )
            docs = [{"page_content": d.page_content, "metadata": d.metadata} for d in raw_docs]
            has_warning = self._check_warning_required(docs)

            if not raw_docs:
                answer = (
                    "Dữ liệu hiện tại không chứa thông tin về câu hỏi này. "
                    "Vui lòng tham khảo văn bản pháp luật chính thức hoặc liên hệ phòng pháp chế."
                )
            else:
                answer = self._invoke_with_retry(self._build_prompt(question, raw_docs))
            
            # Extract sources từ documents
            sources = []
            for doc in docs:
                metadata = doc.get("metadata", {})
                source_info = {
                    "document": metadata.get(
                        "document_name",
                        metadata.get("title", metadata.get("doc_id", "Unknown"))
                    ),
                    "article": metadata.get(
                        "article",
                        metadata.get("article_number", "N/A")
                    ),
                    "clause": metadata.get(
                        "clause",
                        metadata.get("clause_number", "N/A")
                    ),
                    "chunk_id": metadata.get("chunk_id", "N/A"),
                    "doc_id": metadata.get("doc_id", "N/A"),
                    "effective_date": metadata.get("effective_date", "N/A"),
                    "status": metadata.get("status", "N/A"),
                    "is_verified": metadata.get("is_verified", True)
                }
                sources.append(source_info)
            
            result = {
                "question": question,
                "answer": answer,
                "sources": sources,
                "has_warning": has_warning,
                "num_sources": len(sources)
            }
            
            logger.info(f"Query hoàn thành. Tìm thấy {len(sources)} nguồn.")
            if has_warning:
                logger.warning("Câu trả lời chứa cảnh báo [ĐỐI CHIẾU] hoặc thông tin chưa xác minh.")
            
            return result
            
        except RetrievalError:
            raise
        except Exception as e:
            logger.error(f"Lỗi khi xử lý query: {e}")
            return {
                "question": question,
                "answer": f"Lỗi hệ thống: {str(e)}",
                "sources": [],
                "has_warning": False,
                "error": str(e)
            }
    
    def batch_query(self, questions: List[str]) -> List[Dict[str, Any]]:
        """
        Thực hiện batch query trên pipeline RAG.
        
        Args:
            questions: Danh sách câu hỏi
            
        Returns:
            List các kết quả
        """
        results = []
        for question in questions:
            result = self.query(question)
            results.append(result)
        return results


def create_rag_pipeline(
    provider: LLMProvider = LLMProvider.OPENAI,
    model_name: Optional[str] = None
) -> RAGPipeline:
    """
    Factory function để tạo RAG pipeline với cấu hình tùy chỉnh.
    
    Args:
        provider: Loại LLM provider
        model_name: Tên model cụ thể (None để dùng default)
        
    Returns:
        RAGPipeline instance
    """
    config = LLMConfig(provider=provider, model_name=model_name)
    retriever_service = RetrieverService()
    
    return RAGPipeline(config=config, retriever_service=retriever_service)


if __name__ == "__main__":
    """
    Test pipeline với các câu hỏi mẫu.
    """
    print("=== Kiểm tra RAG Pipeline ===")
    
    try:
        # Tạo pipeline với OpenAI (mặc định)
        pipeline = create_rag_pipeline()
        print("✓ Pipeline đã được khởi tạo")
        
        # Câu hỏi test
        test_questions = [
            "Nghỉ phép năm được quy định như thế nào?",
            "Mức đóng bảo hiểm xã hội cho người lao động là bao nhiêu?",
            "Điều kiện hưởng bảo hiểm y tế là gì?"
        ]
        
        for i, question in enumerate(test_questions, 1):
            print(f"\n--- Câu hỏi {i}: {question} ---")
            result = pipeline.query(question)
            
            print(f"Trả lời: {result['answer'][:200]}...")
            print(f"Số nguồn: {result['num_sources']}")
            print(f"Có cảnh báo: {result['has_warning']}")
            
            if result['sources']:
                print("Nguồn tham khảo:")
                for src in result['sources'][:2]:  # Hiển thị 2 nguồn đầu
                    print(f"  - {src['document']} (Điều {src['article']}, Khoản {src['clause']})")
            
    except Exception as e:
        print(f"✗ Lỗi khi test pipeline: {e}")
        import traceback
        traceback.print_exc()