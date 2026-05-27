# Audit Kiến Trúc Thông Tin Các Trang

Ngày: 2026-05-26
Phạm vi: quyết định trong 7 `View` hiện tại, trang nào nên là điểm đến chính trong luồng ôn HSK4 của Hồng và trang nào chỉ nên là công cụ phụ.

## 7 Trang Hiện Tại

- `dashboard`: tổng quan hôm nay, trạng thái dữ liệu, xem nhanh hàng đợi học.
- `study`: luồng học chính, gõ chữ Hán, chấm đáp án, luyện nét.
- `lessons`: học theo Bài 1-20 của HSK4 4A/4B.
- `wrong`: danh sách từ đã trả lời sai.
- `mock`: thi thử HSK4.
- `plan`: lộ trình 30 ngày và thiết lập chỉ tiêu ôn.
- `data`: nhập/xuất dữ liệu, kiểm tra chất lượng dữ liệu.

## Nguyên Tắc Quyết Định

- Trang cấp 1 phải là nơi Hồng cần vào thường xuyên trong một phiên học thật.
- Mobile không nên hiển thị quá 5 điểm đến cùng lúc ở bottom navigation.
- Một trang có thể rất quan trọng nhưng vẫn không cần đứng ngang hàng với màn hình học chính.
- Chưa xóa trang hỗ trợ khi chưa có nơi chứa tốt hơn cho workflow của nó.
- App nên bắt đầu từ hành động tiếp theo của người học, không bắt đầu từ khái niệm kỹ thuật nội bộ.

## Kết Luận Từng Trang

| View | Nhiệm vụ của người học | Tần suất | Quyết định | Cấp điều hướng |
| --- | --- | --- | --- | --- |
| `study` | Ôn hôm nay, gõ chữ Hán, nhận phản hồi | Hằng ngày | Giữ | Chính |
| `lessons` | Học theo đúng thứ tự giáo trình HSK4 4A/4B | Hằng ngày/hằng tuần | Giữ | Chính |
| `mock` | Luyện cấu trúc đề, thời gian, tâm lý thi | Hằng tuần/giai đoạn nước rút | Giữ | Chính |
| `dashboard` | Hiểu hôm nay cần làm gì và dữ liệu đã sẵn chưa | Hằng ngày, xem nhanh | Giữ nhưng phải dẫn hành động rõ hơn | Chính |
| `wrong` | Sửa từ sai gần đây | Hằng ngày nhưng như một hàng đợi | Giữ route, hạ cấp thị giác | Công cụ phụ |
| `plan` | Xem/chỉnh lộ trình 30 ngày | Thỉnh thoảng | Giữ route, hạ cấp thị giác | Công cụ phụ |
| `data` | Nhập/xuất/kiểm tra dữ liệu | Hiếm, thiên về admin | Giữ route, hạ cấp thị giác | Công cụ/admin |

## Mô Hình Điều Hướng Đề Xuất

Desktop sidebar có thể vẫn hiển thị đủ 7 mục, nhưng nên chia nhóm rõ:

- Luyện tập: `dashboard`, `study`, `lessons`, `mock`
- Công cụ: `wrong`, `plan`, `data`

Trạng thái triển khai: đã áp dụng vào `app-shell-view.ts` và `styles.css` trong cùng nhánh PR. Route kỹ thuật vẫn giữ nguyên, nhưng desktop không còn trình bày cả 7 mục như 7 cấp ngang hàng.

Mobile giữ mô hình hiện tại:

- Tab hiển thị trực tiếp: `study`, `dashboard`, `lessons`, `mock`, `more`
- Sheet `Thêm`: `wrong`, `plan`, `data`

Cách này giữ các màn hình học thường xuyên ở một chạm, còn công cụ ít dùng vẫn tìm được mà không làm bottom bar quá chật.

## Thứ Tự Thiết Kế Lại Từng Trang

1. `study`: quan trọng nhất vì Hồng sẽ dùng lâu nhất mỗi ngày.
2. `lessons`: quan trọng thứ hai vì nhu cầu gốc là học đúng Bài 1-20 theo giáo trình chuẩn.
3. `mock`: cần để chuẩn bị thi thật, phải giống một ca thi hơn là một quiz từ vựng.
4. `dashboard`: nên thành trung tâm hành động hôm nay, không phải bảng chỉ số dày đặc.
5. `wrong`: nên nhóm lỗi theo nguyên nhân/tần suất và kéo thẳng vào phiên ôn.
6. `plan`: nên là roadmap/checkpoint, không phải màn hình phải mở hằng ngày.
7. `data`: nên là khu vực cài đặt/admin, có cảnh báo và khả năng khôi phục rõ ràng.

## Câu Hỏi Thiết Kế Còn Mở

- `dashboard` nên gọi là `Tổng quan`, `Hôm nay`, hay `Ôn`? Lab dashboard đã nghiêng về `Hôm nay` cho UX chính; `dashboard` chỉ nên là tên route kỹ thuật.
- Desktop nên giữ 7 mục nhìn thấy luôn hay sau khi polish từng trang thì gom nhóm phụ vào `Công cụ`?
- `wrong` về dài hạn nên là một trang riêng, hay là bộ lọc trong `study` cộng với một báo cáo nhỏ trong `dashboard`?

## Nguồn Tham Khảo

- Apple Human Interface Guidelines, Tab bars: https://developer.apple.com/design/human-interface-guidelines/tab-bars
- Apple Human Interface Guidelines, Sidebars: https://developer.apple.com/design/human-interface-guidelines/sidebars
- Material Design, Bottom navigation: https://m1.material.io/components/bottom-navigation.html
- Chinese Tests Service Website, HSK Level 4: https://www.chinesetest.cn/HSK/4

## Update 2026-05-26: Cài Đặt Cá Nhân

Sau khi bỏ các hành động lặp ở header của `dashboard`, app thêm route `settings` để gom các thiết lập cá nhân ít dùng:

- Tên hiển thị và avatar của người học.
- Ngôn ngữ giao diện.
- Nhịp học hằng ngày và tùy chọn fallback nghĩa tiếng Anh.

Quyết định điều hướng mới:

- Luyện tập: `dashboard`, `study`, `lessons`, `mock`.
- Công cụ: `wrong`, `plan`, `data`, `settings`.
- Mobile bottom nav vẫn giữ 5 điểm chạm: `study`, `dashboard`, `lessons`, `mock`, `more`; sheet `more` chứa `wrong`, `plan`, `data`, `settings`.

Lý do: header chỉ nên giữ thông tin ngữ cảnh đang xem. Những thiết lập cá nhân như ngôn ngữ, tên và avatar không phải thao tác thường xuyên trong phiên học nên không đặt ở header.
