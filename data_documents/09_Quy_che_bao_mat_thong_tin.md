---
doc_id: POL-09
title: Quy chế Bảo mật Thông tin, NDA và An toàn Dữ liệu Điện toán Đám mây
document_type: internal_policy_template
company: "[TÊN CÔNG TY]"
version: "1.0"
effective_date: "[DD/MM/YYYY]"
classification: Nội bộ
owner: "[Giám đốc CNTT / CISO / Cán bộ bảo vệ dữ liệu]"
legal_references:
  - Luật Sở hữu trí tuệ (bảo hộ bí mật kinh doanh)
  - Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân
  - Luật Bảo vệ dữ liệu cá nhân 2025 (hiệu lực 01/01/2026)
  - Luật Dữ liệu 2024
  - Luật Giao dịch điện tử 2023
  - Nghị định 53/2022/NĐ-CP (lưu trữ dữ liệu trong nước)
keywords: [NDA, bảo mật, cloud, dữ liệu khách hàng, phân loại dữ liệu, sự cố]
---

# QUY CHẾ BẢO MẬT THÔNG TIN VÀ AN TOÀN DỮ LIỆU

> **Lưu ý:** Các văn bản pháp luật tham chiếu và nghị định hướng dẫn thường xuyên thay đổi. Cần rà soát với pháp chế trước khi ban hành.

## PHẦN A. QUY ĐỊNH CHUNG

### Điều 1. Mục đích và phạm vi
1. Bảo vệ **bí mật kinh doanh, dữ liệu khách hàng, dữ liệu cá nhân** và tài sản thông tin của Công ty.
2. Quy định **trách nhiệm** của NLĐ, nhà thầu, đối tác tiếp cận thông tin của Công ty.
3. Áp dụng cho mọi **hệ thống on-premise, đám mây (cloud), thiết bị cá nhân, kênh liên lạc**.

### Điều 2. Định nghĩa
- **Thông tin mật:** thông tin chưa công khai, có giá trị thương mại/chiến lược, Công ty đã áp dụng biện pháp bảo mật.
- **Dữ liệu cá nhân:** thông tin gắn với một con người cụ thể hoặc giúp xác định một con người cụ thể.
- **Dữ liệu cá nhân nhạy cảm:** dữ liệu cá nhân gắn với quyền riêng tư mà khi bị xâm phạm sẽ gây ảnh hưởng trực tiếp đến quyền và lợi ích hợp pháp của cá nhân (ví dụ: sức khỏe, tài chính, sinh trắc học, vị trí).
- **Điện toán đám mây (Cloud):** mô hình cung cấp tài nguyên CNTT (IaaS, PaaS, SaaS) qua mạng.
- **Nhà cung cấp dịch vụ đám mây (CSP):** bên thứ ba cung cấp dịch vụ cloud cho Công ty.

### Điều 3. Nguyên tắc cơ bản
1. **Đặc quyền tối thiểu (Least Privilege):** chỉ cấp quyền truy cập cần thiết cho công việc.
2. **Cần biết (Need-to-know):** chỉ chia sẻ thông tin cho người cần biết.
3. **Bảo vệ nhiều lớp (Defense-in-depth).**
4. **Mặc định an toàn (Secure by default / by design).**
5. **Truy vết được (Accountability):** mọi truy cập vào dữ liệu quan trọng phải ghi nhật ký.
6. **Hợp pháp, tối thiểu hóa dữ liệu** khi thu thập và xử lý dữ liệu cá nhân.

## PHẦN B. THỎA THUẬN BẢO MẬT (NDA)

### Điều 4. Đối tượng ký NDA
| Đối tượng | Hình thức |
|---|---|
| NLĐ chính thức, thử việc, thực tập | NDA tích hợp trong hợp đồng hoặc **phụ lục riêng** (ký khi nhận việc) |
| Cộng tác viên, tư vấn, freelancer | NDA độc lập trước khi tiếp cận thông tin |
| Nhà thầu, đối tác, nhà cung cấp, CSP | NDA song phương hoặc điều khoản bảo mật + **Thỏa thuận xử lý dữ liệu (DPA)** |
| Ứng viên (tuyển dụng cấp cao), nhà đầu tư | NDA trước khi trao đổi thông tin nhạy cảm |

### Điều 5. Mẫu Thỏa thuận bảo mật (NDA) chuẩn

---
**THỎA THUẬN BẢO MẬT THÔNG TIN**

Số: [.../NDA/...]

Hôm nay, ngày [DD/MM/YYYY], tại [Địa điểm], chúng tôi gồm:

**BÊN TIẾT LỘ THÔNG TIN (Bên A): [TÊN CÔNG TY]**
- Mã số doanh nghiệp: [...]
- Địa chỉ: [...]
- Người đại diện: [Họ tên], Chức danh: [...]

**BÊN NHẬN THÔNG TIN (Bên B): [Họ tên cá nhân / Tên tổ chức]**
- CCCD/Mã số doanh nghiệp: [...]
- Địa chỉ: [...]

Hai bên thống nhất ký Thỏa thuận với các điều khoản sau:

**Điều 1. Mục đích**
Bên B được tiếp cận Thông tin mật của Bên A **chỉ nhằm** mục đích [mô tả: thực hiện công việc theo hợp đồng số ... / đánh giá hợp tác ...] (**"Mục đích"**).

**Điều 2. Thông tin mật**
2.1. "Thông tin mật" gồm mọi thông tin, dưới mọi hình thức (văn bản, điện tử, lời nói, hình ảnh, mẫu vật), liên quan đến: (a) kế hoạch kinh doanh, chiến lược, tài chính, giá, chi phí; (b) danh sách khách hàng, nhà cung cấp, hợp đồng; (c) công nghệ, mã nguồn, thuật toán, thiết kế, quy trình, bí quyết; (d) dữ liệu cá nhân của khách hàng, nhân viên; (e) thông tin được đánh dấu "Mật" hoặc bản chất rõ ràng là bí mật.
2.2. **Ngoại lệ:** thông tin (i) đã được công bố hợp pháp không do vi phạm của Bên B; (ii) Bên B đã biết hợp pháp trước khi nhận, có chứng cứ; (iii) Bên B nhận hợp pháp từ bên thứ ba không có nghĩa vụ bảo mật; (iv) Bên B tự phát triển độc lập không sử dụng Thông tin mật; (v) phải tiết lộ theo yêu cầu của cơ quan nhà nước có thẩm quyền theo luật, với điều kiện **thông báo ngay** cho Bên A (khi pháp luật cho phép) và chỉ tiết lộ phạm vi tối thiểu bắt buộc.

**Điều 3. Nghĩa vụ của Bên B**
3.1. Giữ **bí mật tuyệt đối**; chỉ dùng cho Mục đích.
3.2. **Không** sao chép, lưu trữ, chuyển giao, tiết lộ cho bên thứ ba khi chưa có **chấp thuận bằng văn bản** của Bên A.
3.3. Áp dụng **biện pháp bảo vệ** không thấp hơn mức Bên B áp dụng với thông tin mật của chính mình và **không thấp hơn mức hợp lý** theo chuẩn ngành.
3.4. Giới hạn truy cập cho những cá nhân **thực sự cần biết** và đã ký cam kết bảo mật tương đương.
3.5. **Không** nạp, nhập Thông tin mật vào **công cụ AI công cộng** hoặc dịch vụ đám mây không được Bên A phê duyệt.
3.6. **Thông báo ngay** (tối đa [24] giờ) cho Bên A khi phát hiện hoặc nghi ngờ rò rỉ, truy cập trái phép, mất thiết bị chứa Thông tin mật.
3.7. **Hoàn trả hoặc tiêu hủy** toàn bộ Thông tin mật khi Bên A yêu cầu hoặc khi chấm dứt quan hệ, và **xác nhận bằng văn bản** trong [07] ngày.

**Điều 4. Sở hữu và quyền sử dụng**
4.1. Mọi Thông tin mật thuộc quyền sở hữu của Bên A; Thỏa thuận này **không cấp** bất kỳ quyền sở hữu, giấy phép nào cho Bên B.
4.2. Sản phẩm công việc, sáng kiến, tài liệu do Bên B tạo ra trong quá trình thực hiện công việc cho Bên A thuộc về Bên A, theo thỏa thuận tại hợp đồng chính và quy định pháp luật về sở hữu trí tuệ.

**Điều 5. Thời hạn**
5.1. Thỏa thuận có hiệu lực từ ngày ký và nghĩa vụ bảo mật kéo dài **trong thời gian hợp tác và [03 – 05] năm** sau khi chấm dứt.
5.2. Đối với **bí mật kinh doanh, bí mật công nghệ, dữ liệu cá nhân**: nghĩa vụ bảo mật kéo dài **cho đến khi thông tin trở thành công khai** không do lỗi của Bên B, hoặc theo quy định pháp luật.

**Điều 6. Dữ liệu cá nhân**
6.1. Trường hợp Bên B xử lý dữ liệu cá nhân thay mặt Bên A, Bên B chỉ xử lý **theo chỉ dẫn bằng văn bản** của Bên A, áp dụng biện pháp bảo vệ phù hợp, tuân thủ pháp luật về bảo vệ dữ liệu cá nhân, và ký **Thỏa thuận xử lý dữ liệu** kèm theo.

**Điều 7. Vi phạm và bồi thường**
7.1. Bên B vi phạm phải **chấm dứt hành vi vi phạm, khắc phục hậu quả** và **bồi thường toàn bộ thiệt hại thực tế** cho Bên A, gồm chi phí khắc phục, chi phí pháp lý, thiệt hại trực tiếp và lợi ích trực tiếp bị mất.
7.2. [Tùy chọn] **Phạt vi phạm** [x]% giá trị hợp đồng chính hoặc số tiền cố định [VND ...], nhưng không vượt quá mức pháp luật cho phép.
7.3. Bên A có quyền áp dụng **biện pháp khẩn cấp tạm thời** và yêu cầu cơ quan có thẩm quyền xử lý theo quy định.
7.4. Vi phạm của NLĐ còn bị **xử lý kỷ luật** theo Nội quy Công ty, và có thể bị **truy cứu trách nhiệm hình sự** nếu đủ yếu tố cấu thành tội phạm.

**Điều 8. Luật áp dụng và giải quyết tranh chấp**
8.1. Thỏa thuận chịu sự điều chỉnh của **pháp luật Việt Nam**.
8.2. Tranh chấp được giải quyết bằng **thương lượng**; nếu không thành, đưa ra [**Trung tâm Trọng tài Quốc tế Việt Nam (VIAC)** / **Tòa án nhân dân có thẩm quyền tại [...]**].

**Điều 9. Điều khoản chung**
9.1. Thỏa thuận lập thành [02] bản có giá trị như nhau, mỗi bên giữ [01] bản; hoặc ký dưới dạng **hợp đồng điện tử** bằng chữ ký điện tử/chữ ký số hợp lệ.
9.2. Sửa đổi, bổ sung phải bằng văn bản, có chữ ký hai bên.

| **BÊN A** | **BÊN B** |
|---|---|
| [Chữ ký, dấu] | [Chữ ký] |

---

## PHẦN C. PHÂN LOẠI VÀ XỬ LÝ THÔNG TIN

### Điều 6. Phân loại dữ liệu
| Cấp độ | Mô tả | Ví dụ | Biện pháp tối thiểu |
|---|---|---|---|
| **Công khai (Public)** | Có thể công bố | Website, tài liệu marketing | Kiểm duyệt trước khi đăng |
| **Nội bộ (Internal)** | Chỉ dùng trong Công ty | Thông báo nội bộ, quy trình | Truy cập theo tài khoản công ty |
| **Mật (Confidential)** | Ảnh hưởng đáng kể nếu rò rỉ | Hợp đồng, giá, danh sách khách hàng, mã nguồn | Phân quyền, mã hóa, ghi log |
| **Tối mật (Restricted)** | Ảnh hưởng nghiêm trọng, dữ liệu nhạy cảm | Dữ liệu cá nhân nhạy cảm, thông tin tài chính chưa công bố, khóa mã hóa, M&A | MFA bắt buộc, mã hóa đầu cuối/at-rest, danh sách truy cập hạn chế, phê duyệt từng lần |

### Điều 7. Ghi nhãn và xử lý
1. Tài liệu **Mật / Tối mật** phải có **nhãn** rõ ràng trong header/footer hoặc metadata.
2. **Không** gửi tài liệu Mật/Tối mật qua kênh cá nhân (email cá nhân, ứng dụng chat không được phê duyệt, thiết bị lưu trữ cá nhân).
3. **In ấn** tài liệu mật phải thu hồi, tiêu hủy bằng máy hủy giấy; **hủy dữ liệu điện tử** theo quy trình xóa an toàn.
4. **Thời hạn lưu trữ** theo Chính sách lưu giữ hồ sơ; hết hạn phải xóa hoặc ẩn danh hóa dữ liệu (đặc biệt dữ liệu cá nhân).

## PHẦN D. AN TOÀN ĐIỆN TOÁN ĐÁM MÂY

### Điều 8. Nguyên tắc sử dụng cloud
1. Chỉ sử dụng **dịch vụ cloud đã được Bộ phận CNTT/An ninh thông tin phê duyệt** (danh mục phê duyệt do [CISO] quản lý). **Cấm "Shadow IT"**: tự ý dùng dịch vụ cloud/SaaS ngoài danh mục để lưu hoặc xử lý dữ liệu Công ty.
2. **Phân tách môi trường:** Production, Staging, Development/Test; **không** dùng dữ liệu khách hàng thật cho môi trường test (trừ khi đã **ẩn danh hóa/giả lập**).
3. **Mô hình trách nhiệm chia sẻ (Shared Responsibility):** CSP chịu trách nhiệm hạ tầng; **Công ty chịu trách nhiệm** cấu hình, quản lý danh tính, dữ liệu, ứng dụng.

### Điều 9. Đánh giá và lựa chọn nhà cung cấp đám mây
Trước khi sử dụng CSP phải thực hiện **thẩm định (due diligence)**:

| Hạng mục | Yêu cầu tối thiểu |
|---|---|
| **Chứng nhận an ninh** | ISO/IEC 27001; ưu tiên ISO 27017, 27018, SOC 2 Type II, hoặc tương đương |
| **Vị trí lưu trữ dữ liệu** | Khai báo rõ **quốc gia/khu vực**; tuân thủ yêu cầu lưu trữ dữ liệu theo pháp luật Việt Nam (nếu thuộc diện) |
| **Hợp đồng và DPA** | Có **Thỏa thuận xử lý dữ liệu**, cam kết bảo mật, quyền kiểm toán, SLA |
| **Quyền sở hữu dữ liệu** | Dữ liệu thuộc Công ty; CSP không sử dụng dữ liệu cho mục đích khác (như huấn luyện AI) |
| **Nhà thầu phụ** | CSP công khai danh sách nhà thầu phụ và thông báo khi thay đổi |
| **Xử lý sự cố** | CSP cam kết **thông báo sự cố** trong thời hạn [24–72] giờ |
| **Thoát dịch vụ (Exit)** | Cam kết trả dữ liệu theo định dạng chuẩn và **xóa an toàn** sau khi chấm dứt |
| **Dự phòng và BCP** | Khả năng phục hồi, RPO/RTO phù hợp |

### Điều 10. Quản lý danh tính và truy cập (IAM)
1. **Xác thực đa yếu tố (MFA)** bắt buộc đối với: tài khoản quản trị, truy cập Production, truy cập dữ liệu Mật/Tối mật, truy cập từ xa.
2. **Phân quyền theo vai trò (RBAC)**, rà soát quyền **[03 tháng/lần]** (tài khoản đặc quyền: [01 tháng/lần]).
3. **Không dùng chung tài khoản**; tài khoản dịch vụ (service account) phải có người chịu trách nhiệm và xoay vòng khóa định kỳ.
4. **Thu hồi quyền ngay** khi NLĐ nghỉ việc/chuyển bộ phận (trong vòng [24] giờ).
5. **Chính sách mật khẩu:** tối thiểu [12] ký tự, không dùng lại, quản lý bằng **trình quản lý mật khẩu** được duyệt.
6. **Truy cập đặc quyền (PAM):** quyền quản trị cấp theo **thời gian giới hạn (just-in-time)**, ghi lại phiên làm việc.

### Điều 11. Mã hóa và quản lý khóa
| Phạm vi | Yêu cầu |
|---|---|
| **Dữ liệu lưu trữ (at-rest)** | Mã hóa bằng thuật toán mạnh (ví dụ **AES-256**) với dữ liệu Mật/Tối mật; ưu tiên mã hóa toàn bộ |
| **Dữ liệu truyền (in-transit)** | **TLS 1.2 trở lên**; cấm giao thức lỗi thời |
| **Quản lý khóa** | Dùng **KMS/HSM**; phân tách quyền quản lý khóa với quyền quản trị dữ liệu; xoay vòng khóa định kỳ [12] tháng; cân nhắc **khóa do khách hàng quản lý (CMK/BYOK)** cho dữ liệu Tối mật |
| **Bí mật (secrets)** | Lưu trong **secrets manager**; **cấm** hard-code khóa, mật khẩu trong mã nguồn/kho mã |

### Điều 12. Bảo vệ hạ tầng và cấu hình cloud
1. **Cấu hình an toàn (hardening)** theo chuẩn (ví dụ CIS Benchmarks); **quét cấu hình sai** liên tục (CSPM).
2. **Mặc định đóng:** cấm mở công khai kho lưu trữ (bucket), cơ sở dữ liệu, cổng quản trị ra Internet trừ khi được phê duyệt.
3. **Phân đoạn mạng** (VPC/VNet, subnet, security group), nguyên tắc **Zero Trust**.
4. **Quản lý lỗ hổng:** quét định kỳ; vá lỗi **nghiêm trọng trong [07] ngày**, **cao trong [30] ngày**.
5. **Bảo vệ ứng dụng:** WAF, chống DDoS, kiểm thử xâm nhập (penetration test) tối thiểu [01 lần/năm] và sau thay đổi lớn.
6. **Quy trình DevSecOps:** quét mã nguồn (SAST/DAST), quét phụ thuộc (SCA), kiểm soát thay đổi, phê duyệt trước khi triển khai Production.

### Điều 13. Nhật ký, giám sát và sao lưu
1. **Bật nhật ký** (audit log) cho mọi dịch vụ cloud, lưu tối thiểu [12] tháng, bảo vệ khỏi sửa/xóa.
2. **Giám sát** bất thường (SIEM/SOC), cảnh báo truy cập đặc quyền, tải xuống dữ liệu hàng loạt.
3. **Sao lưu theo nguyên tắc 3-2-1**: 3 bản sao, 2 loại phương tiện, 1 bản ngoại tuyến/khác vùng; **mã hóa** bản sao lưu; **kiểm thử khôi phục** tối thiểu [06 tháng/lần].
4. Xác định **RPO/RTO** cho từng hệ thống và có **Kế hoạch liên tục kinh doanh/khôi phục thảm họa (BCP/DRP)**.

### Điều 14. Dữ liệu xuyên biên giới và lưu trữ dữ liệu
1. **Chuyển dữ liệu cá nhân ra nước ngoài** (gồm lưu trữ trên cloud đặt tại nước ngoài) phải được **đánh giá tác động**, lập **hồ sơ** và thực hiện thủ tục theo pháp luật về bảo vệ dữ liệu cá nhân.
2. Với dữ liệu thuộc diện **yêu cầu lưu trữ trong nước** theo pháp luật hiện hành, phải tuân thủ nghĩa vụ lưu trữ và (nếu có) đặt chi nhánh/văn phòng đại diện theo quy định.
3. Mọi quyết định chọn **vùng lưu trữ (region)** cho dữ liệu khách hàng phải được **phê duyệt** bởi [CISO/Pháp chế].

## PHẦN E. BẢO VỆ DỮ LIỆU KHÁCH HÀNG VÀ DỮ LIỆU CÁ NHÂN

### Điều 15. Nguyên tắc xử lý dữ liệu cá nhân
1. **Hợp pháp, minh bạch:** có **căn cứ pháp lý** (sự đồng ý của chủ thể dữ liệu hoặc căn cứ khác theo luật) và **thông báo** rõ ràng về mục đích xử lý.
2. **Giới hạn mục đích:** chỉ xử lý đúng mục đích đã thông báo.
3. **Tối thiểu hóa dữ liệu:** chỉ thu thập dữ liệu cần thiết.
4. **Chính xác** và **cập nhật** khi cần thiết.
5. **Giới hạn lưu trữ:** xóa hoặc ẩn danh khi hết mục đích.
6. **Toàn vẹn và bảo mật:** biện pháp kỹ thuật và tổ chức phù hợp.
7. **Trách nhiệm giải trình:** lưu hồ sơ chứng minh tuân thủ.

### Điều 16. Quyền của chủ thể dữ liệu và quy trình đáp ứng
| Quyền | Thời hạn xử lý nội bộ |
|---|---|
| Được biết, truy cập, chỉnh sửa, cung cấp bản sao | [Tối đa theo quy định pháp luật; mục tiêu nội bộ 10 ngày làm việc] |
| Rút lại sự đồng ý, hạn chế/phản đối xử lý | Theo yêu cầu |
| Yêu cầu xóa dữ liệu | Theo quy định pháp luật |
| Khiếu nại, tố cáo, khởi kiện | Tiếp nhận qua [email/biểu mẫu DPO] |

### Điều 17. Quy tắc xử lý dữ liệu khách hàng
1. Dữ liệu khách hàng được lưu **trong hệ thống được phê duyệt** (CRM/ERP/cloud); **cấm** lưu trên máy cá nhân, USB, email cá nhân, ứng dụng nhắn tin cá nhân.
2. **Ẩn danh/giả danh hóa (masking)** dữ liệu trong môi trường phát triển, kiểm thử, phân tích.
3. **Hạn chế xuất dữ liệu hàng loạt**: yêu cầu phê duyệt của chủ sở hữu dữ liệu và ghi log.
4. **Dữ liệu nhạy cảm** (sinh trắc học, tài chính, sức khỏe, vị trí...) áp dụng biện pháp bảo vệ ở mức **Tối mật** và **đánh giá tác động** trước khi xử lý.
5. **Chia sẻ với bên thứ ba** chỉ khi có **căn cứ pháp lý**, **thỏa thuận xử lý dữ liệu** và **ghi nhận** trong sổ đăng ký hoạt động xử lý.
6. **Marketing:** chỉ gửi khi có **đồng ý hợp lệ**; có cơ chế **hủy đăng ký (opt-out)** dễ dàng.

### Điều 18. Sử dụng công cụ AI và dịch vụ tạo sinh
1. **Chỉ sử dụng** công cụ AI **đã được Công ty phê duyệt** cho dữ liệu Nội bộ trở lên.
2. **Cấm** nhập dữ liệu **Mật/Tối mật**, dữ liệu cá nhân, mã nguồn nội bộ, thông tin hợp đồng vào **công cụ AI công cộng**.
3. Kết quả do AI tạo ra phải được **kiểm tra, xác minh** trước khi sử dụng; NLĐ chịu trách nhiệm về nội dung sử dụng.

### Điều 19. Đánh giá tác động và hồ sơ tuân thủ
1. Lập và lưu **hồ sơ đánh giá tác động xử lý dữ liệu cá nhân** từ thời điểm bắt đầu xử lý, và cập nhật khi có thay đổi.
2. Duy trì **sổ đăng ký hoạt động xử lý dữ liệu**: mục đích, loại dữ liệu, thời hạn, bên nhận, biện pháp bảo vệ, chuyển dữ liệu ra nước ngoài.
3. Chỉ định **bộ phận/người phụ trách bảo vệ dữ liệu cá nhân** (DPO).

## PHẦN F. THIẾT BỊ, MẠNG VÀ LÀM VIỆC TỪ XA

### Điều 20. Thiết bị
1. **Thiết bị Công ty:** cài đặt **chống mã độc/EDR**, mã hóa ổ đĩa, tự khóa màn hình sau [05] phút, quản lý bởi **MDM**.
2. **BYOD:** chỉ được phép khi đăng ký, cài **hồ sơ quản lý** và tách biệt dữ liệu công việc; Công ty có quyền **xóa từ xa dữ liệu công việc** khi mất thiết bị hoặc khi NLĐ nghỉ việc.
3. **Thiết bị lưu trữ di động (USB):** cấm sử dụng, trừ khi được phê duyệt và đã mã hóa.
4. **Không** cài đặt phần mềm **không bản quyền/không được phê duyệt**.

### Điều 21. Làm việc từ xa
1. Kết nối qua **VPN/ZTNA** của Công ty; **cấm** dùng mạng Wi-Fi công cộng không bảo mật khi truy cập dữ liệu Mật.
2. Không để người khác sử dụng thiết bị công việc; **khóa màn hình** khi rời vị trí.
3. Không chụp màn hình, ghi âm họp có chứa thông tin Mật khi chưa được phép.

### Điều 22. Email, trao đổi và tài liệu
1. Dùng **email công ty**; bật **chống thư rác, lừa đảo (phishing)**; không mở liên kết/tệp đính kèm đáng ngờ.
2. Gửi tài liệu Mật qua **kênh có mã hóa** hoặc **liên kết chia sẻ có hạn chế quyền và thời hạn**.
3. Họp trực tuyến dùng nền tảng được phê duyệt; bật **mật khẩu/phòng chờ** cho cuộc họp nhạy cảm.

## PHẦN G. QUẢN LÝ SỰ CỐ AN TOÀN THÔNG TIN

### Điều 23. Phân loại và phản ứng sự cố
| Mức | Mô tả | Thời gian phản ứng |
|---|---|---|
| **P1 – Nghiêm trọng** | Rò rỉ dữ liệu khách hàng/cá nhân quy mô lớn, mã độc tống tiền, hệ thống trọng yếu gián đoạn | Ngay lập tức, tối đa [01] giờ |
| **P2 – Cao** | Truy cập trái phép đã xác nhận, mất thiết bị chứa dữ liệu Mật | Trong [04] giờ |
| **P3 – Trung bình** | Vi phạm chính sách, lỗ hổng chưa bị khai thác | Trong [24] giờ |
| **P4 – Thấp** | Sự kiện nhỏ, cảnh báo giả | Trong [72] giờ |

**Quy trình (6 bước):** (1) **Phát hiện và báo cáo** → (2) **Phân loại và ưu tiên** → (3) **Ngăn chặn** → (4) **Loại bỏ nguyên nhân** → (5) **Khôi phục** → (6) **Rút kinh nghiệm (post-mortem)**.

### Điều 24. Nghĩa vụ báo cáo và thông báo
1. NLĐ **phải báo ngay** (tối đa [24] giờ, đối với P1/P2 là **ngay lập tức**) cho [security@congty.vn / đường dây nóng].
2. Khi xảy ra **vi phạm dữ liệu cá nhân**, Công ty thực hiện **thông báo cho cơ quan có thẩm quyền (Bộ Công an) trong vòng 72 giờ** kể từ khi phát hiện, theo quy định pháp luật về bảo vệ dữ liệu cá nhân; đồng thời đánh giá nghĩa vụ **thông báo cho chủ thể dữ liệu** và khách hàng bị ảnh hưởng.
3. **Bảo toàn chứng cứ:** không xóa log, không tắt máy trái quy trình.
4. **Không trả đũa** người báo cáo thiện chí.

## PHẦN H. TRÁCH NHIỆM VÀ CHẾ TÀI

### Điều 25. Trách nhiệm các bên
| Vai trò | Trách nhiệm chính |
|---|---|
| **Ban Giám đốc** | Phê duyệt chính sách, cấp nguồn lực, chịu trách nhiệm tổng thể |
| **CISO / Trưởng bộ phận ATTT** | Xây dựng, vận hành, giám sát; báo cáo định kỳ |
| **DPO / Pháp chế** | Tuân thủ pháp luật dữ liệu, NDA, DPA, đánh giá tác động |
| **Bộ phận CNTT** | Triển khai kỹ thuật, quản trị hệ thống |
| **Trưởng bộ phận** | Phân loại dữ liệu, phê duyệt quyền truy cập, giám sát nhân viên |
| **Toàn bộ NLĐ** | Tuân thủ, tham gia đào tạo, báo cáo sự cố |

### Điều 26. Đào tạo và kiểm tra
- **Đào tạo** ATTT khi nhận việc và **định kỳ [01 lần/năm]**; **diễn tập phishing** [02 lần/năm].
- **Kiểm toán/đánh giá nội bộ** tối thiểu [01 lần/năm].

### Điều 27. Chế tài
1. Vi phạm Quy chế tùy mức độ bị **xử lý kỷ luật** theo Nội quy (File 07), kể cả **sa thải**; **bồi thường** thiệt hại; **chuyển cơ quan có thẩm quyền** nếu có dấu hiệu vi phạm pháp luật.
2. Nghĩa vụ bảo mật **vẫn tiếp tục** sau khi NLĐ nghỉ việc theo NDA.
3. **Ngoại lệ chính sách** phải có **đề nghị bằng văn bản, đánh giá rủi ro** và **phê duyệt** của CISO.

## PHẦN I. PHỤ LỤC

### Phụ lục 1. Danh mục kiểm soát khi nghỉ việc (Offboarding)
- [ ] Thu hồi thiết bị, thẻ, tài liệu, khóa.
- [ ] Vô hiệu hóa tài khoản và chuyển quyền sở hữu dữ liệu.
- [ ] Thu hồi quyền truy cập cloud, VPN, SaaS, kho mã.
- [ ] Xóa dữ liệu công việc trên thiết bị cá nhân (BYOD).
- [ ] Nhắc lại nghĩa vụ NDA; ký **biên bản bàn giao và cam kết**.

### Phụ lục 2. Danh mục kiểm tra nhà cung cấp cloud (rút gọn)
- [ ] Chứng nhận ISO 27001/SOC 2 còn hiệu lực
- [ ] Vị trí lưu trữ, nhà thầu phụ
- [ ] DPA và điều khoản thông báo sự cố
- [ ] Mã hóa, quản lý khóa, nhật ký
- [ ] Quyền kiểm toán, kế hoạch thoát dịch vụ
- [ ] Bảo hiểm trách nhiệm và SLA