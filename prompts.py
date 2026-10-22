"""
prompts.py - System Prompt và templates cho hệ thống RAG pháp lý
Prompt engineering chặt chẽ với các quy tắc chống hallucination và trích dẫn
"""

from typing import List, Dict, Any
from langchain_core.prompts import ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage


class LegalPrompts:
    """
    Class quản lý prompts cho hệ thống RAG pháp lý
    """
    
    # ============ SYSTEM PROMPT - CHUYÊN GIA PHÁP CHẾ NHÂN SỰ ============
    
    SYSTEM_PROMPT_TEMPLATE = """Bạn là **Chuyên gia Pháp chế Nhân sự nội bộ** của doanh nghiệp, có nhiệm vụ tư vấn và giải đáp các vấn đề pháp lý liên quan đến lao động, hợp đồng, bảo hiểm, và chính sách nhân sự.

---

## 🚨 **QUY TẮC TRẢ LỜI BẮT BUỘC**

### 1. QUY TẮC CHỐNG ẢO GIÁC (ANTI-HALLUCINATION)
**BẠN CHỈ ĐƯỢC PHÉP TRẢ LỜI DỰA TRÊN PHẦN {context} ĐƯỢC CUNG CẤP.**
- **TUYỆT ĐỐI KHÔNG** sử dụng kiến thức bên ngoài, không tự bịa ra điều luật, không thêm thông tin không có trong {context}.
- Nếu trong {context} **không có** câu trả lời, bạn **PHẢI** nói rõ:
  > "**Dữ liệu hiện tại của hệ thống không chứa thông tin về vấn đề này.**"
- Nếu thông tin trong {context} **không đủ** để trả lời đầy đủ, bạn chỉ được phép trả lời dựa trên phần thông tin có sẵn và nêu rõ giới hạn.

### 2. QUY TẮC TRÍCH DẪN NGUỒN
**LUÔN NÊU RÕ CƠ SỞ PHÁP LÝ** ở cuối mỗi câu trả lời:
- **Định dạng**: [Tên văn bản - Điều số - Khoản số (nếu có)]
- **Ví dụ**: 
  - [Bộ luật Lao động 2019 - Điều 14 - Khoản 1]
  - [Luật Bảo hiểm xã hội 2024 - Điều 2]
  - [Nghị định 337/2025/NĐ-CP]

### 3. QUY TẮC FORMAT TRẢ LỜI
- **Rõ ràng, mạch lạc**: Sử dụng ngôn ngữ pháp lý chính xác nhưng dễ hiểu.
- **Có cấu trúc**: Có thể sử dụng bullet points, đánh số khi cần.
- **Trọng tâm**: Trả lời trực tiếp vào câu hỏi, không lan man.

---

## 📚 **NGUỒN DỮ LIỆU ({context})**
Hệ thống sẽ cung cấp cho bạn các đoạn trích từ:
- Bộ luật Lao động 2019 và các văn bản hướng dẫn
- Luật Bảo hiểm xã hội 2024
- Luật Bảo hiểm y tế
- Luật Việc làm 2025
- Các Nghị định, Thông tư hướng dẫn mới nhất

---

## 🎯 **MỤC TIÊU**
Cung cấp thông tin pháp lý **CHÍNH XÁC, CẬP NHẬT, và ÁP DỤNG ĐƯỢC** cho các tình huống nhân sự thực tế.
"""

    # ============ HUMAN PROMPT TEMPLATE ============
    
    HUMAN_PROMPT_TEMPLATE = """Câu hỏi: {question}

---

## 📄 **NGỮ CẢNH PHÁP LÝ (Context):**

{formatted_context}

---

**Hãy trả lời câu hỏi dựa trên ngữ cảnh pháp lý trên, tuân thủ đúng các quy tắc đã nêu.**"""
    
    # ============ CONTEXT FORMAT TEMPLATE ============
    
    CONTEXT_FORMAT_TEMPLATE = """**Tài liệu {index}: {title}**
- **Văn bản**: {doc_id}
- **Điều**: {article_number}
- **Hiệu lực từ**: {effective_date}
- **Trạng thái kiểm chứng**: {verification_status}
- **Trọng số**: {weight}

**Nội dung:**
{content}

---"""
    
    # ============ WARNING TEMPLATE ============
    
    UNVERIFIED_WARNING = """\n\n⚠️ **LƯU Ý QUAN TRỌNG**: Câu trả lời này được trích xuất từ các quy định có gắn thẻ **[ĐỐI CHIẾU]** hoặc chưa được pháp chế rà soát bản gốc. 

**VUI LÒNG KIỂM TRA LẠI VĂN BẢN PHÁP QUY CHÍNH THỨC TRƯỚC KHI ÁP DỤNG VÀO THỰC TẾ.**"""
    
    # ============ NO CONTEXT RESPONSE ============
    
    NO_CONTEXT_RESPONSE = """**Dữ liệu hiện tại của hệ thống không chứa thông tin về vấn đề này.**

Hệ thống pháp lý nhân sự của chúng tôi hiện chưa có thông tin về câu hỏi của bạn. Đề nghị:
1. Kiểm tra lại với phòng Pháp chế doanh nghiệp
2. Tham khảo văn bản pháp luật chính thống
3. Liên hệ cơ quan nhà nước có thẩm quyền"""
    
    # ============ METHODS ============
    
    @classmethod
    def create_system_message(cls) -> SystemMessage:
        """
        Tạo SystemMessage từ template
        
        Returns:
            SystemMessage với prompt chuyên gia pháp chế
        """
        return SystemMessage(content=cls.SYSTEM_PROMPT_TEMPLATE)
    
    @classmethod
    def create_chat_prompt(cls) -> ChatPromptTemplate:
        """
        Tạo ChatPromptTemplate cho RAG pipeline
        
        Returns:
            ChatPromptTemplate kết hợp system và human prompts
        """
        system_message_prompt = SystemMessagePromptTemplate.from_template(
            cls.SYSTEM_PROMPT_TEMPLATE
        )
        
        human_message_prompt = HumanMessagePromptTemplate.from_template(
            cls.HUMAN_PROMPT_TEMPLATE
        )
        
        chat_prompt = ChatPromptTemplate.from_messages([
            system_message_prompt,
            human_message_prompt
        ])
        
        return chat_prompt
    
    @classmethod
    def format_context_for_prompt(
        cls, 
        documents: List[Dict[str, Any]],
        include_warning: bool = False
    ) -> str:
        """
        Format context từ documents để đưa vào prompt
        
        Args:
            documents: List các document từ retriever
            include_warning: Có bao gồm warning không
            
        Returns:
            String context đã được format
        """
        if not documents:
            return "**Không có ngữ cảnh pháp lý liên quan.**"
        
        formatted_parts = []
        
        for i, doc in enumerate(documents, 1):
            # Lấy metadata từ document
            metadata = doc.get("metadata", {})
            
            # Xác định trạng thái kiểm chứng
            is_verified = metadata.get("is_verified", True)
            verification_status = "✅ Đã kiểm chứng" if is_verified else "⚠️ Cần đối chiếu"
            
            # Chuẩn bị data cho template
            context_data = {
                "index": i,
                "title": metadata.get("title", "Không rõ tiêu đề"),
                "doc_id": metadata.get("doc_id", "Không rõ mã văn bản"),
                "article_number": metadata.get("article_number", "Không rõ số Điều"),
                "effective_date": metadata.get("effective_date", "Không rõ ngày hiệu lực"),
                "verification_status": verification_status,
                "weight": metadata.get("weight", 1.0),
                "content": doc.get("content", "Không có nội dung")
            }
            
            # Format context phần
            formatted_part = cls.CONTEXT_FORMAT_TEMPLATE.format(**context_data)
            formatted_parts.append(formatted_part)
        
        # Kết hợp tất cả parts
        formatted_context = "\n".join(formatted_parts)
        
        # Thêm warning nếu cần
        if include_warning:
            formatted_context += cls.UNVERIFIED_WARNING
        
        return formatted_context
    
    @classmethod
    def format_document_for_display(cls, document: Dict[str, Any]) -> str:
        """
        Format một document để hiển thị cho người dùng
        
        Args:
            document: Document từ retriever
            
        Returns:
            String document đã được format đẹp
        """
        metadata = document.get("metadata", {})
        content = document.get("content", "")
        
        # Cắt content nếu quá dài
        if len(content) > 500:
            content = content[:500] + "..."
        
        output = [
            f"📄 **{metadata.get('title', 'Không rõ tiêu đề')}**",
            f"   - Mã văn bản: {metadata.get('doc_id', 'N/A')}",
            f"   - Điều: {metadata.get('article_number', 'N/A')}",
            f"   - Hiệu lực từ: {metadata.get('effective_date', 'N/A')}",
            f"   - Kiểm chứng: {'✅' if metadata.get('is_verified', True) else '⚠️'}",
            f"   - Trọng số: {metadata.get('weight', 1.0)}",
            f"",
            f"**Nội dung:**",
            f"{content}"
        ]
        
        return "\n".join(output)
    
    @classmethod
    def create_no_context_response(cls, question: str) -> str:
        """
        Tạo response khi không có context
        
        Args:
            question: Câu hỏi của người dùng
            
        Returns:
            Response khi không có context
        """
        return f"""**Câu hỏi:** {question}

{cls.NO_CONTEXT_RESPONSE}"""
    
    @classmethod
    def extract_citation_from_document(cls, document: Dict[str, Any]) -> str:
        """
        Trích xuất citation từ document
        
        Args:
            document: Document từ retriever
            
        Returns:
            String citation theo định dạng chuẩn
        """
        metadata = document.get("metadata", {})
        
        title = metadata.get("title", "")
        article = metadata.get("article_number", "")
        doc_id = metadata.get("doc_id", "")
        
        # Xây dựng citation
        parts = []
        if title:
            parts.append(title)
        if article:
            parts.append(f"Điều {article}")
        if doc_id and doc_id != "Không rõ mã văn bản":
            parts.append(f"({doc_id})")
        
        if parts:
            return " - ".join(parts)
        else:
            return "Nguồn không xác định"
    
    @classmethod
    def create_citation_footer(cls, documents: List[Dict[str, Any]]) -> str:
        """
        Tạo footer với citations cho response
        
        Args:
            documents: List các document được sử dụng
            
        Returns:
            String footer với citations
        """
        if not documents:
            return ""
        
        citations = []
        for doc in documents:
            citation = cls.extract_citation_from_document(doc)
            if citation and citation != "Nguồn không xác định":
                citations.append(citation)
        
        if citations:
            # Loại bỏ trùng lặp
            unique_citations = list(dict.fromkeys(citations))
            citation_text = "\n".join([f"- {citation}" for citation in unique_citations])
            
            return f"\n\n**📚 Nguồn tham khảo:**\n{citation_text}"
        
        return ""


# ============ TEST PROMPTS ============

if __name__ == "__main__":
    print("🧪 Testing LegalPrompts...")
    print("=" * 70)
    
    # Test system prompt
    system_msg = LegalPrompts.create_system_message()
    print("✅ System Message created")
    print(f"   Length: {len(system_msg.content)} characters")
    
    # Test chat prompt template
    chat_prompt = LegalPrompts.create_chat_prompt()
    print(f"✅ Chat Prompt Template created")
    print(f"   Input variables: {chat_prompt.input_variables}")
    
    # Test context formatting với mock data
    mock_documents = [
        {
            "content": "**Khoản 1:** Hợp đồng lao động phải được giao kết bằng văn bản...",
            "metadata": {
                "title": "Bộ luật Lao động 2019",
                "doc_id": "45/2019/QH14",
                "article_number": "14",
                "effective_date": "2021-01-01",
                "is_verified": True,
                "weight": 1.0
            }
        },
        {
            "content": "**Khoản 2:** Mức lương làm căn cứ đóng BHXH... [ĐỐI CHIẾU]",
            "metadata": {
                "title": "Luật Bảo hiểm xã hội 2024",
                "doc_id": "41/2024/QH15",
                "article_number": "31",
                "effective_date": "2025-07-01",
                "is_verified": False,
                "weight": 0.5
            }
        }
    ]
    
    # Format context
    formatted_context = LegalPrompts.format_context_for_prompt(
        mock_documents, 
        include_warning=True
    )
    print(f"\n✅ Formatted context (with warning):")
    print(f"   Length: {len(formatted_context)} characters")
    print(f"   First 200 chars: {formatted_context[:200]}...")
    
    # Test document display
    print(f"\n✅ Document display formatting:")
    for i, doc in enumerate(mock_documents[:1], 1):
        display = LegalPrompts.format_document_for_display(doc)
        print(f"   Document {i}:")
        lines = display.split('\n')
        for line in lines[:5]:
            print(f"     {line}")
        print("     ...")
    
    # Test citation extraction
    print(f"\n✅ Citation extraction:")
    for i, doc in enumerate(mock_documents, 1):
        citation = LegalPrompts.extract_citation_from_document(doc)
        print(f"   Document {i}: {citation}")
    
    # Test citation footer
    citation_footer = LegalPrompts.create_citation_footer(mock_documents)
    print(f"\n✅ Citation footer:")
    print(citation_footer)
    
    print("\n" + "=" * 70)
    print("✅ LegalPrompts test completed successfully")


# ============ ALIASES FOR BACKWARD COMPATIBILITY ============

# Alias để duy trì backward compatibility với các module khác
LegalPromptManager = LegalPrompts
PromptTemplates = LegalPrompts