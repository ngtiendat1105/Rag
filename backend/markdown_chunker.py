"""
markdown_chunker.py - Logic chia nhỏ văn bản Markdown dựa trên thẻ Heading ###
Thực hiện chunking phức tạp với bảo toàn ngữ cảnh và blockquote
"""

import re
from typing import List, Dict, Any, Tuple
from pathlib import Path

from config import ARTICLE_SPLIT_PATTERN, KEEP_CONTEXT_HEADINGS, MAX_CHUNK_SIZE


class MarkdownChunker:
    """Lớp thực hiện chia nhỏ văn bản Markdown thành các chunk dựa trên Điều luật"""
    
    def __init__(self):
        """Khởi tạo chunker với regex pattern đã cấu hình"""
        # Compile regex pattern để tách các Điều
        # re.MULTILINE: ^ và $ khớp đầu/cuối mỗi dòng
        # re.DOTALL: . khớp cả newline (quan trọng để bắt nội dung nhiều dòng)
        self.article_pattern = re.compile(
            ARTICLE_SPLIT_PATTERN,
            re.MULTILINE | re.DOTALL
        )
        
        # Pattern để phát hiện thẻ heading cấp 1 và 2 (# và ##)
        # ^#+: bắt đầu dòng với một hoặc nhiều #
        # \s+: theo sau là khoảng trắng
        # .*: nội dung tiêu đề
        self.heading_pattern = re.compile(r'^(#+)\s+(.*)$', re.MULTILINE)
    
    def split_into_articles(self, markdown_content: str) -> List[Dict[str, Any]]:
        """
        Chia nội dung Markdown thành các Điều (article) riêng biệt
        
        Args:
            markdown_content: Nội dung Markdown đã loại bỏ frontmatter
            
        Returns:
            List[Dict]: Danh sách các chunk với keys: 'article_title', 'content'
        """
        # Tìm tất cả các Điều bằng regex
        articles = []
        
        # finditer tìm tất cả match không chồng lấn
        for match in self.article_pattern.finditer(markdown_content):
            article_text = match.group(1).strip()
            
            # Tách tiêu đề Điều và nội dung
            article_data = self._extract_article_data(article_text)
            if article_data:
                articles.append(article_data)
        
        # Một số tài liệu nội bộ dùng ### 1.1..., ### 2.4... thay vì ### Điều ...
        # Các heading này vẫn là ranh giới ngữ nghĩa phù hợp để retrieval.
        if not articles:
            articles = self._split_by_level_three_heading(markdown_content)
        
        return articles

    def _split_by_level_three_heading(self, markdown_content: str) -> List[Dict[str, Any]]:
        """Split generic sections and retain content under chapter headings."""
        matches = list(re.finditer(r"^##(?!#)\s+.+$|^###\s+.+$", markdown_content, re.MULTILINE))
        articles = []
        for index, match in enumerate(matches):
            end = matches[index + 1].start() if index + 1 < len(matches) else len(markdown_content)
            article_text = markdown_content[match.start():end].strip()
            article_data = self._extract_article_data(article_text)
            if article_data and article_data["content"]:
                articles.append(article_data)
        return articles
    
    def _extract_article_data(self, article_text: str) -> Dict[str, Any]:
        """
        Trích xuất thông tin từ text của một Điều
        
        Args:
            article_text: Toàn bộ text của một Điều (bao gồm tiêu đề và nội dung)
            
        Returns:
            Dict với 'article_title' và 'content'
        """
        if not article_text:
            return None
        
        # Tìm dòng đầu tiên (tiêu đề Điều)
        lines = article_text.split('\n')
        if not lines:
            return None
        
        article_title = lines[0].strip()
        
        # Nội dung là phần còn lại (có thể rỗng)
        content = '\n'.join(lines[1:]).strip()
        
        # Loại bỏ context headings nếu cấu hình yêu cầu
        if not KEEP_CONTEXT_HEADINGS:
            content = self._remove_context_headings(content)
        
        return {
            'article_title': article_title,
            'content': content,
            'raw_text': article_text  # Giữ raw text để debug
        }
    
    def _remove_context_headings(self, content: str) -> str:
        """
        Loại bỏ các thẻ heading cấp 1 và 2 (#, ##) khỏi nội dung
        
        Args:
            content: Nội dung Markdown
            
        Returns:
            Nội dung đã loại bỏ context headings
        """
        lines = content.split('\n')
        filtered_lines = []
        
        for line in lines:
            # Kiểm tra nếu line là heading (# hoặc ##)
            # nhưng không phải ### (cấp 3 - Điều luật)
            if line.startswith('#') and not line.startswith('###'):
                # Có thể giữ lại như comment hoặc bỏ hoàn toàn
                # Ở đây chúng ta bỏ hoàn toàn
                continue
            filtered_lines.append(line)
        
        return '\n'.join(filtered_lines)
    
    def _fallback_split(self, markdown_content: str) -> List[Dict[str, Any]]:
        """
        Fallback strategy khi regex không hoạt động
        Chia dựa trên dòng bắt đầu bằng "### Điều"
        
        Args:
            markdown_content: Nội dung Markdown
            
        Returns:
            List[Dict]: Danh sách các chunk
        """
        articles = []
        lines = markdown_content.split('\n')
        
        current_article = None
        current_content = []
        
        for line in lines:
            # Kiểm tra nếu dòng bắt đầu bằng "### Điều"
            if line.strip().startswith('### Điều'):
                # Lưu article trước đó nếu có
                if current_article is not None:
                    articles.append({
                        'article_title': current_article,
                        'content': '\n'.join(current_content).strip(),
                        'raw_text': f"{current_article}\n" + '\n'.join(current_content)
                    })
                
                # Bắt đầu article mới
                current_article = line.strip()
                current_content = []
            else:
                # Thêm dòng vào nội dung article hiện tại
                if current_article is not None:
                    current_content.append(line)
        
        # Lưu article cuối cùng
        if current_article is not None:
            articles.append({
                'article_title': current_article,
                'content': '\n'.join(current_content).strip(),
                'raw_text': f"{current_article}\n" + '\n'.join(current_content)
            })
        
        return articles
    
    def validate_chunk_integrity(self, chunk: Dict[str, Any]) -> bool:
        """
        Kiểm tra tính toàn vẹn của một chunk
        
        Args:
            chunk: Chunk cần kiểm tra
            
        Returns:
            True nếu chunk hợp lệ, False nếu không
        """
        # Kiểm tra có tiêu đề không
        if 'article_title' not in chunk or not chunk['article_title']:
            return False
        
        # Kiểm tra tiêu đề có đúng định dạng "### Điều" không
        title = chunk['article_title']
        if not title.startswith('### Điều'):
            return False
        
        # Kiểm tra có nội dung không (có thể rỗng nhưng vẫn hợp lệ)
        if 'content' not in chunk:
            return False
        
        # Kiểm tra blockquote được giữ nguyên (nếu có)
        content = chunk['content']
        lines = content.split('\n')
        in_blockquote = False
        
        for line in lines:
            stripped = line.strip()
            if stripped.startswith('>'):
                in_blockquote = True
            elif in_blockquote and not stripped:
                # Blockquote tiếp tục qua dòng trống
                continue
            elif in_blockquote and not stripped.startswith('>'):
                # Blockquote bị cắt ngang - không hợp lệ
                return False
        
        return True
    
    def analyze_chunk_structure(self, chunk: Dict[str, Any]) -> Dict[str, Any]:
        """
        Phân tích cấu trúc của một chunk
        
        Args:
            chunk: Chunk cần phân tích
            
        Returns:
            Dict với thông tin phân tích
        """
        content = chunk.get('content', '')
        
        # Đếm số dòng
        lines = content.split('\n')
        
        # Đếm số khoản (bắt đầu bằng **Khoản)
        khoan_count = len([l for l in lines if l.strip().startswith('**Khoản')])
        
        # Đếm số điểm (bắt đầu bằng - Điểm)
        diem_count = len([l for l in lines if l.strip().startswith('- Điểm')])
        
        # Đếm blockquote lines
        blockquote_lines = len([l for l in lines if l.strip().startswith('>')])
        
        # Tính độ dài
        char_count = len(content)
        word_count = len(content.split())
        
        return {
            'line_count': len(lines),
            'khoan_count': khoan_count,
            'diem_count': diem_count,
            'blockquote_lines': blockquote_lines,
            'char_count': char_count,
            'word_count': word_count,
            'has_blockquote': blockquote_lines > 0
        }
    
    def create_chunks_with_metadata(
        self, 
        markdown_content: str, 
        base_metadata: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Tạo các chunk hoàn chỉnh với metadata
        
        Args:
            markdown_content: Nội dung Markdown
            base_metadata: Metadata cơ bản từ file
            
        Returns:
            List[Dict]: Danh sách các chunk hoàn chỉnh
        """
        # Chia thành các article
        articles = self.split_into_articles(markdown_content)
        
        # Tạo chunks hoàn chỉnh
        chunks = []
        
        for article in articles:
            for part_index, content in enumerate(
                self._split_oversized_content(article['content']), 1
            ):
                chunk = {
                    'article_title': article['article_title'],
                    'content': content,
                    'metadata': {
                        **base_metadata,
                        'article_title': article['article_title'],
                        'chunk_part': part_index,
                    },
                }
                chunk['raw_text'] = f"{article['article_title']}\n{content}"
                chunk['analysis'] = self.analyze_chunk_structure(chunk)
                chunk['is_valid'] = self.validate_chunk_integrity(chunk)
                chunks.append(chunk)
        
        return chunks

    def _split_oversized_content(self, content: str) -> List[str]:
        """Split long articles at khoản/điểm boundaries while retaining labels."""
        if len(content) <= MAX_CHUNK_SIZE:
            return [content]
        lines = content.splitlines(keepends=True)
        parts, current = [], []
        current_size = 0
        for line in lines:
            starts_section = line.lstrip().startswith(("**Khoản", "- Điểm"))
            if current and current_size + len(line) > MAX_CHUNK_SIZE and starts_section:
                parts.append("".join(current).strip())
                current, current_size = [], 0
            current.append(line)
            current_size += len(line)
        if current:
            parts.append("".join(current).strip())
        return parts or [content[:MAX_CHUNK_SIZE]]


# ============ HÀM TIỆN ÍCH ============

def create_markdown_chunker() -> MarkdownChunker:
    """Factory function để tạo MarkdownChunker"""
    return MarkdownChunker()


def test_chunker():
    """Test chức năng chunker với nội dung mẫu"""
    from metadata_parser import MetadataParser
    
    # Tạo parser và chunker
    parser = MetadataParser()
    chunker = MarkdownChunker()
    
    # Lấy file mẫu
    from config import get_input_files
    input_files = get_input_files()
    
    if not input_files:
        print("Không tìm thấy file Markdown để test")
        return
    
    test_file = input_files[0]
    print(f"Testing chunker với file: {test_file.name}")
    
    try:
        # Parse metadata và nội dung
        metadata, content = parser.parse_file(test_file)
        
        print(f"\n✅ Đã parse metadata và nội dung")
        print(f"Độ dài nội dung: {len(content)} ký tự")
        
        # Chia thành chunks
        chunks = chunker.create_chunks_with_metadata(content, metadata)
        
        print(f"\n✅ Đã tạo được {len(chunks)} chunks:")
        
        for i, chunk in enumerate(chunks[:3]):  # Hiển thị 3 chunk đầu
            print(f"\n--- Chunk {i+1} ---")
            print(f"Tiêu đề: {chunk['article_title']}")
            print(f"Hợp lệ: {chunk['is_valid']}")
            
            analysis = chunk['analysis']
            print(f"Phân tích: {analysis['khoan_count']} khoản, {analysis['diem_count']} điểm, {analysis['blockquote_lines']} dòng blockquote")
            
            # Hiển thị preview nội dung
            content_preview = chunk['content'][:150] + "..." if len(chunk['content']) > 150 else chunk['content']
            print(f"Nội dung preview: {content_preview}")
        
        if len(chunks) > 3:
            print(f"\n... và {len(chunks) - 3} chunks khác")
        
        # Thống kê
        valid_chunks = sum(1 for c in chunks if c['is_valid'])
        total_blockquotes = sum(c['analysis']['blockquote_lines'] for c in chunks)
        
        print(f"\n📊 Thống kê:")
        print(f"  - Tổng số chunks: {len(chunks)}")
        print(f"  - Chunks hợp lệ: {valid_chunks}")
        print(f"  - Tổng dòng blockquote: {total_blockquotes}")
        
    except Exception as e:
        print(f"❌ Lỗi khi testing chunker: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # Test chức năng chunker
    test_chunker()