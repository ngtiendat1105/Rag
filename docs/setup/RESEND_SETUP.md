# Gửi OTP qua Resend

1. Sao chép `.env.example` thành `.env.local`.
2. Điền `RESEND_API_KEY` và `RESEND_FROM_EMAIL` (địa chỉ thuộc domain đã xác minh trong Resend).
3. Khởi động lại `npm run dev`.
4. Đăng nhập bằng email nhận thư thật, nhập mã từ email. Gửi lại được sau 60 giây; mã cũ bị hủy khi gửi lại thành công.

API key chỉ dùng phía máy chủ, không đặt tiền tố `NEXT_PUBLIC_`.

OTP lưu dưới dạng hash trong bộ nhớ của một tiến trình Node, sống 5 phút, dùng một lần, tối đa 5 lần thử. Khởi động lại máy chủ sẽ mất mã đang chờ. Khi triển khai nhiều instance hoặc serverless, thay bộ nhớ này bằng Redis/database dùng chung với TTL và cập nhật nguyên tử.

Thay đổi này tích hợp gửi và xác minh OTP thật; mật khẩu, phiên đăng nhập và cách phân quyền theo email vẫn là demo hiện có. Chưa phải hệ thống xác thực production.

Kiểm tra tự động (mock Resend, không gửi thư): `node scripts/test-otp.cjs`.
Tài liệu API: https://resend.com/docs/api-reference/emails/send-email
