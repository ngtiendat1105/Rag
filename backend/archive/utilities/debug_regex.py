"""
debug_regex.py - Debug regex pattern cho việc chunking
"""

import re
from pathlib import Path

# Test với pattern hiện tại
ARTICLE_SPLIT_PATTERN_OLD = r'(^### Điều \d+\..*?(?=^###|$))'

# Pattern mới: thử không có capture group và sửa lookahead
ARTICLE_SPLIT_PATTERN_NEW = r'^### Điều \d+\..*?(?=^### Điều|\Z)'

# Pattern đơn giản hơn: chỉ tìm tiêu đề và lấy mọi thứ đến tiêu đề tiếp theo
ARTICLE_SPLIT_PATTERN_SIMPLE = r'(^### Điều \d+\.[^\n]*(?:\n(?!^### Điều)[^\n]*)*)'

# Đọc nội dung mẫu
sample_file = Path("01_Bo_luat_Lao_dong_2019.md")
with open(sample_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Tách phần nội dung (sau frontmatter)
# Tìm vị trí sau frontmatter
frontmatter_end = content.find('---\n', content.find('---\n') + 4)
if frontmatter_end != -1:
    content = content[frontmatter_end + 4:].strip()

print(f"Độ dài nội dung: {len(content)} ký tự")
print(f"200 ký tự đầu: {content[:200]}")

# Test với pattern cũ
print("\n=== TEST VỚI PATTERN CŨ ===")
pattern_old = re.compile(ARTICLE_SPLIT_PATTERN_OLD, re.MULTILINE | re.DOTALL)
matches_old = list(pattern_old.finditer(content))
print(f"Số match: {len(matches_old)}")

if matches_old:
    for i, match in enumerate(matches_old[:2]):
        print(f"\nMatch {i+1}:")
        print(f"  Vị trí: {match.start()} - {match.end()}")
        matched_text = match.group(1)
        print(f"  Độ dài: {len(matched_text)}")
        print(f"  Preview: {matched_text[:100]}...")

# Test với pattern mới
print("\n=== TEST VỚI PATTERN MỚI ===")
pattern_new = re.compile(ARTICLE_SPLIT_PATTERN_NEW, re.MULTILINE | re.DOTALL)
matches_new = list(pattern_new.finditer(content))
print(f"Số match: {len(matches_new)}")

if matches_new:
    for i, match in enumerate(matches_new[:2]):
        print(f"\nMatch {i+1}:")
        print(f"  Vị trí: {match.start()} - {match.end()}")
        matched_text = match.group(0)
        print(f"  Độ dài: {len(matched_text)}")
        print(f"  Preview: {matched_text[:100]}...")

# Test với pattern đơn giản
print("\n=== TEST VỚI PATTERN ĐƠN GIẢN ===")
pattern_simple = re.compile(ARTICLE_SPLIT_PATTERN_SIMPLE, re.MULTILINE)
matches_simple = list(pattern_simple.finditer(content))
print(f"Số match: {len(matches_simple)}")

if matches_simple:
    for i, match in enumerate(matches_simple[:2]):
        print(f"\nMatch {i+1}:")
        print(f"  Vị trí: {match.start()} - {match.end()}")
        matched_text = match.group(1)
        print(f"  Độ dài: {len(matched_text)}")
        print(f"  Preview: {matched_text[:100]}...")
        
        # Phân tích cấu trúc
        lines = matched_text.split('\n')
        print(f"  Số dòng: {len(lines)}")
        print(f"  Dòng 1: {lines[0] if lines else 'N/A'}")
        print(f"  Dòng 2: {lines[1] if len(lines) > 1 else 'N/A'}")

# Test fallback logic: tìm các dòng bắt đầu bằng "### Điều"
print("\n=== TEST FALLBACK LOGIC ===")
lines = content.split('\n')
article_lines = [i for i, line in enumerate(lines) if line.strip().startswith('### Điều')]
print(f"Số dòng bắt đầu bằng '### Điều': {len(article_lines)}")
print(f"Vị trí các dòng: {article_lines[:10]}")

if article_lines:
    # Hiển thị một article mẫu
    start_line = article_lines[0]
    end_line = article_lines[1] if len(article_lines) > 1 else len(lines)
    
    print(f"\nArticle mẫu (dòng {start_line} đến {end_line}):")
    article_content = '\n'.join(lines[start_line:end_line])
    print(f"Độ dài: {len(article_content)}")
    print(f"Nội dung:\n{article_content[:200]}...")