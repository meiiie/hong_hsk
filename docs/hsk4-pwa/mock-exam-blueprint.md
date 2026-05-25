# HSK4 Mock Exam Blueprint

Mốc kiểm tra: 2026-05-25, giờ Việt Nam.

## Kết luận sản phẩm

Phần `Thi thử` hiện được thiết kế là bộ đề mô phỏng sát cấu trúc HSK4 cũ, không phải đề chính thức. App không nhúng đề thật/audio thật vì các bộ đó thường có bản quyền; thay vào đó, app tạo câu hỏi từ dữ liệu từ vựng 4A/4B mà người học đã nạp, rồi dùng Web Speech API để luyện thao tác nghe trên máy tính/điện thoại.

Phiên bản `hsk4-old-100q-v3-context` ưu tiên câu hỏi theo ngữ cảnh hơn word-drill: transcript nghe và đoạn đọc dùng câu ví dụ/ngữ cảnh, hạn chế kiểu hỏi lặp lại “từ này nghĩa là gì” trong toàn bộ đề.

## Cấu trúc bám theo HSK4 cũ

Nguồn đối chiếu chính là ChineseTest/CTI. HSK4 cũ có 100 câu, khoảng 105 phút, gồm:

| Phần | Số câu | Cách app mô phỏng |
| --- | ---: | --- |
| Nghe 1 | 10 | Nghe đoạn ngắn, phán đoán Đúng/Sai |
| Nghe 2 | 15 | Nghe hội thoại ngắn, chọn đáp án |
| Nghe 3 | 20 | Nghe đoạn/hội thoại dài hơn, chọn ý chính |
| Đọc 1 | 10 | Chọn từ điền vào câu |
| Đọc 2 | 10 | Sắp xếp 3 câu/cụm theo thứ tự logic |
| Đọc 3 | 20 | Đọc đoạn ngắn, chọn đáp án |
| Viết 1 | 10 | Sắp xếp từ/cụm thành câu |
| Viết 2 | 5 | Dùng từ gợi ý và tình huống mô phỏng tranh để viết câu |

Tổng: Nghe 45, Đọc 40, Viết 15, 100 câu trong 105 phút.

Kết quả được quy đổi mô phỏng thành 300 điểm: Nghe 100, Đọc 100, Viết 100, ngưỡng tham chiếu 180/300. Đây là điểm luyện tập, không phải điểm chính thức vì phần viết tự do hiện được chấm bằng heuristic.

## Dữ liệu

- Bộ 4A/4B mặc định trong app lấy từ file Excel ôn 20 bài đã đóng gói, gồm nghĩa tiếng Việt và ví dụ tự biên soạn để học.
- Đối chiếu danh sách HSK cũ/mới có thể dùng `drkameleon/complete-hsk-vocabulary`, nhưng app không tự nhập toàn bộ HSK1-3 vào đề nếu người dùng chưa nạp dữ liệu.
- Nghĩa tiếng Việt trong `src/hsk4-vi-glossary.ts` là bản tự biên soạn/tự dịch để người Việt học nhanh hơn. Các mục còn bị đánh dấu nháp vẫn cần duyệt tay trước khi coi là bản học cuối.

## Giới hạn cố ý

- Không sao chép đề thật, câu hỏi thật hoặc audio chính thức.
- Audio hiện là giọng tổng hợp của trình duyệt, dùng tốt cho thao tác và phản xạ, nhưng chưa thay được file nghe chuẩn kỳ thi.
- Phần viết được chấm tự động theo điều kiện cơ bản: có từ mục tiêu và đủ số chữ Hán tối thiểu. Khi ôn sát ngày thi, nên có giáo viên/người giỏi tiếng Trung rà phần viết.

## Định hướng nâng tiếp

1. Thêm bộ câu nghe có transcript và audio tự thu/licensed để thay Web Speech API.
2. Thêm ngân hàng đọc hiểu thủ công theo chủ đề HSK4, tránh câu quá máy móc.
3. Thêm chế độ tính điểm theo thang 300 và ngưỡng 180/300.
4. Lưu lịch sử từng mã đề để so sánh tiến bộ theo Nghe/Đọc/Viết.

## Nguồn tham khảo

- ChineseTest HSK4: https://www.chinesetest.cn/HSK/4
- ChineseTest HSK test structures PDF: https://www.chinesetest.cn/userfiles/upload/HSK2019.pdf
- HSK Standard Course vocab: https://github.com/joelypoley/hsk_standard_course_vocab
- Complete HSK Vocabulary: https://github.com/drkameleon/complete-hsk-vocabulary
- Hanzi Writer: https://github.com/chanind/hanzi-writer
- Make Me a Hanzi: https://github.com/skishore/makemeahanzi
- WCAG 2.2 target size guidance: https://www.w3.org/TR/WCAG22/#target-size-minimum
