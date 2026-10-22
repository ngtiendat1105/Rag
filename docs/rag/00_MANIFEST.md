---
title: "Manifest – Knowledge Base Pháp luật Nhân sự (HR) Việt Nam"
type: "Manifest"
domain: "Nhân sự (HR)"
last_verified: "2026-10-01"
---

# MANIFEST – KNOWLEDGE BASE NHÂN SỰ (HR)

## Danh mục tài liệu

| File | Văn bản | Số hiệu | Hiệu lực | Tình trạng (01/10/2026) |
|---|---|---|---|---|
| 01_Bo_luat_Lao_dong_2019.md | Bộ luật Lao động 2019 | 45/2019/QH14 | 01/01/2021 | Còn hiệu lực |
| 02_Luat_Bao_hiem_xa_hoi_2024.md | Luật Bảo hiểm xã hội 2024 | 41/2024/QH15 | 01/07/2025 | Còn hiệu lực |
| 03_Luat_Bao_hiem_y_te.md | Luật Bảo hiểm y tế (hợp nhất) | 25/2008/QH12; 46/2014/QH13; 51/2024/QH15 | 51/2024: từ 01/07/2025 | Còn hiệu lực |
| 04_Luat_Viec_lam_2025.md | Luật Việc làm 2025 | 74/2025/QH15 | 01/01/2026 | Còn hiệu lực |

## Văn bản dưới luật đã tích hợp (chú thích blockquote)

| Số hiệu | Nội dung | Hiệu lực | Ghi chú |
|---|---|---|---|
| NĐ 145/2020/NĐ-CP | Điều kiện lao động, quan hệ lao động | 01/02/2021 | Còn hiệu lực; dự thảo sửa đổi đang lấy ý kiến (07/2026) |
| NĐ 135/2020/NĐ-CP | Tuổi nghỉ hưu | 01/03/2021 | Còn hiệu lực |
| NĐ 293/2025/NĐ-CP | Lương tối thiểu vùng | 01/01/2026 | Vùng I 5.310.000; II 4.730.000; III 4.140.000; IV 3.700.000 |
| NĐ 337/2025/NĐ-CP, TT 08/2026/TT-BNV | Hợp đồng lao động điện tử | 01/01/2026 | Còn hiệu lực |
| NĐ 158/2025/NĐ-CP | Hướng dẫn BHXH bắt buộc | 01/07/2025 | Còn hiệu lực |
| NĐ 161/2026/NĐ-CP | Mức lương cơ sở 2.530.000 đồng | 01/07/2026 | Mức tham chiếu BHXH = 2.530.000; trần đóng 50.600.000 |
| NĐ 188/2025/NĐ-CP | Hướng dẫn Luật BHYT | 01/07/2025 | Còn hiệu lực |
| NĐ 374/2025/NĐ-CP | Hướng dẫn BHTN (Luật Việc làm) | 01/01/2026 | Còn hiệu lực |
| NĐ 352/2025/NĐ-CP | Dịch vụ việc làm | 01/01/2026 | Thay NĐ 23/2021/NĐ-CP |
| NĐ 283/2026/NĐ-CP | Xử phạt vi phạm hành chính lao động, BHXH | 10/09/2026 | **Thay thế NĐ 12/2022/NĐ-CP** |

## Quy ước dữ liệu

**Khoản 1:** Cấu trúc heading: `#` tên văn bản; `##` Chương (file 01) hoặc Nhóm chủ đề (file 02–04); `###` Điều hoặc mục chế độ.
**Khoản 2:** Thẻ `[ĐỐI CHIẾU]` / `[ĐỐI CHIẾU SỐ ĐIỀU]` đánh dấu nội dung có số Điều/Khoản/chi tiết chưa xác nhận hoàn toàn với bản gốc. Khuyến nghị lọc hoặc gắn trọng số thấp các chunk có thẻ này cho đến khi được pháp chế rà soát.
**Khoản 3:** Nội dung là **tóm lược có cấu trúc**, không phải toàn văn điều luật; không dùng làm trích dẫn nguyên văn.
**Khoản 4:** Mọi con số tiền, tỷ lệ gắn mốc thời gian (lương cơ sở, lương tối thiểu vùng) cần cập nhật khi có nghị định mới.

## Lưu ý khi chunking cho RAG

**Khoản 1:** Chunk theo `###` (một Điều/chế độ một chunk); giữ nguyên blockquote hướng dẫn trong cùng chunk với Điều mẹ.
**Khoản 2:** Gắn metadata từ YAML đầu file (`doc_id`, `effective_date`, `last_verified`) vào mọi chunk.
**Khoản 3:** Khi câu hỏi liên quan đến mức tiền, ưu tiên chunk có mốc hiệu lực mới nhất (ví dụ: lương cơ sở 01/07/2026).

## Việc cần làm tiếp theo

**Khoản 1:** Pháp chế đối chiếu toàn bộ thẻ `[ĐỐI CHIẾU]` với bản gốc trên cơ sở dữ liệu pháp luật chính thức.
**Khoản 2:** Bổ sung nhóm còn lại: Quản trị & Vận hành, Tài chính – Kế toán, Giao thương.
**Khoản 3:** Theo dõi Nghị định sửa đổi NĐ 145/2020/NĐ-CP và văn bản hướng dẫn Nghị định 283/2026/NĐ-CP.
