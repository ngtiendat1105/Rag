# 🔧 ĐÃ SỬA LỖI - Hướng Dẫn Test

## ✅ Vấn Đề Đã Sửa

**Lỗi cũ**: LLM sinh ra hàng trăm dòng citation [503], [504], [505]... thay vì trả lời nội dung

**Nguyên nhân**: 
1. Context format quá phức tạp với metadata
2. Prompt không rõ ràng về cách trả lời
3. System prompt quá dài làm LLM confused

**Đã sửa** trong file `rag_pipeline.py`:
- ✅ Đơn giản hóa context format (chỉ giữ title và article)
- ✅ Viết lại prompt ngắn gọn, rõ ràng
- ✅ Giảm k=3 thay vì k=4 (ít context hơn, focused hơn)
- ✅ Loại bỏ system prompt dài dòng

---

## 🧪 Cách Test

### Bước 1: Kill Python Processes
```powershell
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3
```

### Bước 2: Chạy Test
```powershell
python test_single_query.py
```

### Bước 3: Kiểm Tra Kết Quả

**Kết quả ĐÚNG**:
- Answer có nội dung tiếng Việt (100+ ký tự)
- Không phải toàn citation numbers
- Có trả lời câu hỏi với thông tin cụ thể
- Ví dụ: "Hợp đồng lao động phải có các nội dung sau: 1. Tên địa chỉ..."

**Kết quả SAI (như trước)**:
- Toàn [503] [504] [505]...
- Hoặc "I can't fulfill that request"

---

## 🎯 Test Với Chat Thực Tế

### Khởi động lại chat:
```powershell
# Kill processes
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3

# Start chat
python backend/main_chat.py --provider ollama --model "llama3.2:latest"
```

### Test với câu hỏi:
```
Hợp đồng lao động phải có những nội dung gì?
```

**Mong đợi**:
```
Dựa trên tài liệu, hợp đồng lao động phải có các nội dung chủ yếu sau:

1. Tên, địa chỉ của người sử dụng lao động và họ tên, chức danh của người giao kết
2. Họ tên, ngày tháng năm sinh, giới tính, nơi cư trú, số căn cước công dân
3. Công việc và địa điểm làm việc
4. Thời hạn của hợp đồng lao động
5. Mức lương theo công việc, hình thức trả lương, thời hạn trả lương
... (và các nội dung khác)

Nguồn: Bộ luật Lao động 2019, Điều 21
```

---

## 🔍 Debug Nếu Vẫn Sai

### Kiểm tra logs:
Nếu vẫn thấy citations dài, có thể:

1. **Ollama model cũ**: 
```powershell
ollama pull llama3.2:latest  # Pull lại model mới
```

2. **Cache cũ**:
```powershell
# Xóa __pycache__
Remove-Item -Recurse -Force __pycache__
```

3. **Kiểm tra file đã sửa chưa**:
```powershell
# Mở file và tìm dòng này:
# "Bạn là chuyên gia pháp lý về luật lao động Việt Nam"
notepad rag_pipeline.py
```

---

## 📝 So Sánh Trước/Sau

### ❌ TRƯỚC (SAI):
```
[503] [Nghị định 161/2026/NĐ-CP]
[504] [Nghị định 374/2025/NĐ-CP]
[505] [Nghị định 337/2025/NĐ-CP]
... (hàng trăm dòng)
I can't fulfill that request.
```

### ✅ SAU (ĐÚNG):
```
Dựa trên tài liệu, hợp đồng lao động phải có các nội dung chủ yếu sau:

1. Tên, địa chỉ của người sử dụng lao động
2. Họ tên, ngày sinh của người lao động
3. Công việc và địa điểm làm việc
4. Thời hạn hợp đồng
5. Mức lương và hình thức trả lương
...

(Nguồn: Bộ luật Lao động 2019, Điều 21)
```

---

## ⚠️ Lưu Ý

1. **Luôn kill Python processes** trước khi test mới
2. **Ollama phải đang chạy** (kiểm tra: `curl.exe http://localhost:11434/api/tags`)
3. **Similarity threshold** = 0.3 có thể cao, nếu không retrieve được docs, giảm xuống 0.0

---

## 🎉 Kết Luận

File `rag_pipeline.py` đã được sửa với:
- Prompt đơn giản hơn
- Context sạch hơn
- Giảm confusion cho LLM

Hãy test lại và xem kết quả!
