"""
config.py - Cấu hình hệ thống tiền xử lý dữ liệu RAG
Chứa đường dẫn thư mục, hằng số, và regex patterns cho việc xử lý Markdown
"""

import os
from pathlib import Path

# ============ CẤU HÌNH ĐƯỜNG DẪN ============

# Đường dẫn gốc workspace
WORKSPACE_ROOT = Path(__file__).parent

# Thư mục gốc của project; tài liệu nguồn nên đặt trong UPLOAD_DIR
INPUT_DIR = WORKSPACE_ROOT
UPLOAD_DIR = WORKSPACE_ROOT / "data_documents"
UPLOAD_DIR.mkdir(exist_ok=True)

# Thư mục đầu ra cho kết quả JSONL
OUTPUT_DIR = WORKSPACE_ROOT / "processed_output"
OUTPUT_DIR.mkdir(exist_ok=True)

# Tên file đầu ra JSONL
OUTPUT_FILE = OUTPUT_DIR / "processed_knowledge_base.jsonl"

# ============ HẰNG SỐ XỬ LÝ ============

# Regex pattern để trích xuất YAML frontmatter (giữa hai dòng ---)
# Phân tích cú pháp: ^---$ khớp dòng bắt đầu bằng ---
# .*? khớp nội dung giữa (non-greedy)
# ^---$ khớp dòng kết thúc bằng ---
YAML_FRONTMATTER_PATTERN = r'^---\s*\n(.*?)\n^---\s*\n'

# Regex pattern để phân tách chunk dựa trên thẻ ### (Điều luật)
# ^### Điều \d+\.: bắt đầu bằng ### và từ "Điều" theo sau số và dấu chấm
# (.*?): nội dung của Điều (non-greedy)
# (?=^###|$): lookahead để dừng khi gặp Điều tiếp theo hoặc kết thúc file
ARTICLE_SPLIT_PATTERN = r'(^### Điều \d+\..*?(?=^###|\Z))'

# Regex pattern để phát hiện các chunk chưa kiểm chứng
# [ĐỐI CHIẾU]: chuỗi chính xác này
# [ĐỐI CHIẾU SỐ ĐIỀU]: chuỗi chính xác này  
UNVERIFIED_MARKERS = [r'\[ĐỐI CHIẾU\]', r'\[ĐỐI CHIẾU SỐ ĐIỀU\]']

# Trọng số cho chunk đã kiểm chứng và chưa kiểm chứng
WEIGHT_VERIFIED = 1.0
WEIGHT_UNVERIFIED = 0.5

# ============ METADATA KEY BẮT BUỘC ============

# Các key metadata bắt buộc phải trích xuất từ YAML frontmatter
REQUIRED_METADATA_KEYS = [
    'doc_id',
    'effective_date', 
    'last_verified',
    'status',
    'title',
    'domain'
]

# Key metadata bổ sung sẽ được thêm trong quá trình xử lý
ADDITIONAL_METADATA_KEYS = [
    'is_verified',
    'weight'
]

# ============ TIỀN TỐ FILE ĐẦU VÀO ============

# Tên file mẫu của tài liệu nguồn (được giữ để tương thích cấu hình cũ)
INPUT_FILE_PATTERN = "*_*.md"

# ============ CẤU HÌNH XỬ LÝ CHUNK ============

# Kích thước chunk tối đa (ký tự) - để phòng trường hợp regex không hoạt động
MAX_CHUNK_SIZE = 10000

# Có giữ lại các thẻ heading (# và ##) như metadata ngữ cảnh không?
# True: giữ lại nhưng không tạo chunk từ chúng
# False: loại bỏ hoàn toàn
KEEP_CONTEXT_HEADINGS = True

# ============ TIỆN ÍCH ĐƯỜNG DẪN ============

def get_input_files():
    """Return supported source documents from the upload directory and root."""
    supported = {".md", ".markdown", ".docx", ".pdf", ".png", ".jpg", ".jpeg", ".tif", ".tiff"}
    input_files = []
    for file_path in INPUT_DIR.iterdir():
        if (
            file_path.is_file()
            and file_path.suffix.lower() in supported
            and file_path.name != "00_MANIFEST.md"
            and (
                file_path.suffix.lower() not in {".md", ".markdown"}
                or (file_path.stem[:2].isdigit() and file_path.stem[2:3] == "_")
            )
        ):
            input_files.append(file_path)
    input_files.extend(
        path for path in UPLOAD_DIR.iterdir()
        if (
            path.is_file()
            and path.name != "00_MANIFEST.md"
            and path.suffix.lower() in supported
        )
    )
    
    # Sắp xếp theo thứ tự số để xử lý tuần tự
    return sorted(set(input_files), key=lambda x: x.name.lower())

def print_config_summary():
    """In tóm tắt cấu hình hệ thống"""
    print("=" * 60)
    print("CẤU HÌNH HỆ THỐNG TIỀN XỬ LÝ DỮ LIỆU RAG")
    print("=" * 60)
    print(f"Thư mục đầu vào: {INPUT_DIR}")
    print(f"Thư mục đầu ra: {OUTPUT_DIR}")
    print(f"File đầu ra: {OUTPUT_FILE}")
    print(f"Số lượng regex pattern: 2 (YAML frontmatter, Article split)")
    print(f"Số lượng marker chưa kiểm chứng: {len(UNVERIFIED_MARKERS)}")
    print(f"Metadata bắt buộc: {REQUIRED_METADATA_KEYS}")
    print(f"Metadata bổ sung: {ADDITIONAL_METADATA_KEYS}")
    print("=" * 60)
    
if __name__ == "__main__":
    # Test cấu hình
    print_config_summary()
    
    # Kiểm tra file đầu vào
    input_files = get_input_files()
    print(f"\nTìm thấy {len(input_files)} file Markdown:")
    for f in input_files:
        print(f"  - {f.name}")
