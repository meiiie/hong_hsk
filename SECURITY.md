# Security Policy

## Phạm vi

Ứng dụng hiện là PWA tĩnh chạy trên Cloudflare Pages. Dữ liệu học của người dùng được lưu trong IndexedDB trên thiết bị, chưa có backend tài khoản riêng.

## Báo cáo vấn đề

Nếu phát hiện lỗi bảo mật, vui lòng không mở issue công khai với chi tiết khai thác. Gửi mô tả tối thiểu cho maintainer của repo trước, gồm:

- URL hoặc màn hình liên quan;
- cách tái hiện;
- mức ảnh hưởng dự kiến;
- trình duyệt/thiết bị.

## Lưu ý thiết kế

- Không lưu mật khẩu hoặc token trong frontend.
- Cloudflare Access, nếu bật, phải được cấu hình ở lớp Cloudflare trước khi app tải xuống.
- File `_headers` cấu hình CSP, X-Frame-Options và Permissions-Policy cho bản Pages.
