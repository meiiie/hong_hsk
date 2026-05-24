# Hồng HSK4 Studio

Ứng dụng này dùng cho Hồng và người Việt ôn HSK4 cũ theo giáo trình chuẩn HSK4 上/下 trong 1 tháng.
Mục tiêu là học theo bài khóa, gõ chữ Hán trên máy tính, tự chấm đúng/sai và tự tạo lịch ôn lại.

## Quy trình học

1. Nhập file Excel/CSV đã kiểm chứng theo giáo trình.
2. Vào `Học hôm nay`.
3. Gõ chữ Hán vào ô nhập.
4. App tự so sánh với đáp án, giữ nguyên chữ đã gõ, tô xanh nếu đúng và đỏ nếu sai.
5. Mỗi lần chấm được lưu vào `Attempt_Log` trong IndexedDB.
6. Từ sai và từ đến hạn sẽ tự xuất hiện trong `Từ sai` và `Học hôm nay`.

## Cột nhập khuyến nghị

| Cột | Bắt buộc | Ghi chú |
| --- | --- | --- |
| Bài | Có | 1-20 hoặc dạng 4.01, 4.11 |
| Từ Hán | Có | Đáp án dùng để chấm |
| Pinyin | Nên có | Gợi ý khi học |
| Nghĩa Việt | Nên có | App ưu tiên hiển thị nghĩa Việt |
| Nghĩa Anh dự phòng | Không | Chỉ hiện khi người học bật tùy chọn dùng tiếng Anh dự phòng |
| Loại từ | Không | n., v., adj., adv. |
| Ví dụ Hán | Không | Nên tự đặt hoặc lấy từ bài khóa nếu có quyền dùng |
| Ví dụ Pinyin | Không | Hỗ trợ ôn đọc |
| Ví dụ Việt | Không | Hỗ trợ hiểu ngữ cảnh |
| Tên bài | Không | Nếu bỏ trống, app dùng tên bài mặc định |
| Thứ tự | Không | Nếu có, app giữ thứ tự trong giáo trình |

## Thuật toán ôn

- Sai: ôn lại sau 1 ngày.
- Đúng nhưng còn chậm hoặc vừa sai trước đó: ôn lại sau khoảng 2 ngày.
- Đúng liên tiếp: tăng khoảng ôn lên 4, 7, 10+ ngày.
- Đúng ổn định nhiều lần: chuyển sang trạng thái `Đã vững`.

Đây là biến thể đơn giản của retrieval practice + spaced repetition. Có thể nâng cấp lên FSRS nếu sau này cần đồng bộ với Anki.

## Lịch 30 ngày

- Ngày 1-20: học bài mới đúng thứ tự giáo trình, mỗi ngày một bài, mục tiêu mặc định 30 từ mới.
- Mỗi phiên học bắt đầu bằng từ đến hạn và từ sai, sau đó mới tới từ mới.
- Ngày 21-24: ôn vòng 2, ưu tiên từ có nhiều lần sai hoặc streak thấp, đồng thời kiểm tra lại phần nền HSK1-3 nếu mục tiêu là thi HSK4 cũ.
- Ngày 25-27: tổng ôn theo bài khóa, đọc lại ngữ cảnh và gõ lại từ khó.
- Ngày 28-30: mô phỏng thi máy tính, giảm từ mới và tăng tốc độ gõ/đọc.

Các hằng số lịch ôn nằm ở `src/review-policy.ts` để dễ kiểm tra và thay đổi.

## Mục tiêu dữ liệu

- `724` mục hiện tại là mốc tham khảo cho bộ giáo trình chuẩn HSK4 4A/4B theo bài 1-20.
- `1.200` từ là mốc ôn thi HSK4 cũ theo cách tính tích lũy; người học vẫn cần xác nhận nền HSK1-3 khoảng 600 từ.
- App chỉ báo "sẵn sàng học thật" khi vừa đủ mục tiêu dữ liệu, vừa không còn mục thiếu nghĩa Việt hoặc nghĩa Việt nháp.
- Nếu còn nghĩa tự bổ sung từ nguồn tiếng Anh, app giữ trạng thái `cần duyệt`; không coi đó là bản dịch cuối cùng.

## Luyện nét

Mỗi thẻ học có khu `Luyện nét` để tách từng chữ Hán trong một từ và luyện riêng:

- `Nét mẫu`: xem animation thứ tự nét.
- `Quiz nét`: viết bằng chuột/cảm ứng, app chấm thứ tự nét.
- `Khung`: chỉ hiện outline để tự nhớ.
- `Hiện chữ`: hiện đáp án đầy đủ.

Phần này dùng thư viện mã nguồn mở `hanzi-writer`, dữ liệu nét từ `hanzi-writer-data`, vốn bắt nguồn từ dự án `Make Me a Hanzi`.
Dữ liệu nét được tải theo từng chữ và service worker sẽ cache sau lần tải đầu.

## Thi thử HSK4

Tab `Thi thử` tạo một đề mô phỏng theo cấu trúc HSK4 cũ:

- Nghe: 45 câu.
- Đọc: 40 câu.
- Viết: 15 câu.
- Thời gian: 105 phút.

Phần nghe dùng Web Speech API/giọng đọc tổng hợp tiếng Trung để luyện phản xạ trên điện thoại và máy tính.
Đây là mô phỏng cấu trúc và kỹ năng thao tác, không thay thế bộ audio chính thức của kỳ thi.
Phần viết câu được chấm tự động theo điều kiện cơ bản: có dùng từ mục tiêu và đủ số chữ Hán tối thiểu; nếu ôn sát ngày thi, nên để giáo viên hoặc người có chuyên môn rà lại câu viết.

## Ghi chú UX

- Dashboard đưa cảnh báo chất lượng dữ liệu lên đầu, vì học thật cần nghĩa tiếng Việt và ví dụ đã kiểm chứng trước khi chạy lịch ôn.
- Luồng học hôm nay được tách thành 3 bước: ôn từ đến hạn, sửa từ sai, rồi học từ mới theo đúng bài khóa.
- Màn gõ chữ ưu tiên một hành động chính là `Chấm đáp án`; các nút còn lại là thao tác phụ.
- Phản hồi đúng/sai dùng cả chữ, màu và log trạng thái, không chỉ dựa vào màu.
- Các nút chính có icon, vùng bấm tối thiểu 44px, focus rõ để dùng tốt bằng bàn phím khi luyện thi máy tính.

Trên điện thoại, điều hướng chính chuyển xuống thanh dưới để ngón cái chạm nhanh; các màn học/thi ẩn bớt hành động phụ ở đầu trang để nút làm bài xuất hiện sớm hơn.

## Kiến trúc

- Domain học tập: `src/review-policy.ts` và `src/review.ts` giữ logic chấm, xếp hàng đợi và lịch ôn.
- Dữ liệu người học: `src/storage.ts` dùng IndexedDB để chạy offline như PWA. SQLite/backend chưa cần cho một người học trên một máy; nếu cần đồng bộ nhiều thiết bị, có thể thêm API + SQLite sau mà không đổi domain.
- Nhập/xuất: `src/import-export.ts` xử lý Excel/CSV/workbook backup.
- i18n: `src/i18n.ts` giữ nhãn trạng thái/ngôn ngữ, mặc định tiếng Việt.
- UI: `src/main.ts`, `src/styles.css`, `src/icons.ts`.
- Thi thử: `src/mock-exam.ts` tạo đề HSK4 mô phỏng 100 câu và chấm tự động.

## Nguồn tham khảo kỹ thuật

- `hanzi-writer` và `Make Me a Hanzi`: dữ liệu/animation thứ tự nét chữ Hán.
- WenBun: tham khảo hướng kết hợp luyện viết, flashcard và spaced repetition trong PWA.
- Anki/FSRS: tham khảo hướng scheduler hiện đại nếu sau này cần nâng cấp thuật toán ôn.
- `joelypoley/hsk_standard_course_vocab`: nguồn CSV 4A/4B tham khảo, không xem là dữ liệu chính thức.
- `drkameleon/complete-hsk-vocabulary`: nguồn đối chiếu danh sách từ HSK cũ/tích lũy.
- ChineseTest/HSK exam format: đối chiếu cấu trúc HSK4 Nghe/Đọc/Viết và thời lượng.
- NN/g và WCAG 2.2: định hướng khả dụng, focus, vùng bấm và phản hồi trạng thái.

## Dữ liệu tham khảo

Nút `Nạp bộ 4A/4B tham khảo từ GitHub` dùng repo `joelypoley/hsk_standard_course_vocab`.
Repo đó tự ghi dữ liệu được tạo bằng OCR và sửa tay, nên chỉ nên dùng làm khung ban đầu. Với học thật, nên so lại với sách/giáo trình hoặc file Excel bạn đã có.

File `src/hsk4-vi-glossary.ts` chứa 720 nghĩa tiếng Việt tự bổ sung từ cột nghĩa tiếng Anh của bộ 4A/4B tham khảo.
App tự dùng glossary này để điền `Nghĩa Việt` khi dữ liệu nhập vào đang thiếu, nhưng luôn đánh dấu bằng ghi chú kiểm chứng.
Các nghĩa này chưa được xem là dữ liệu học cuối cùng: cần duyệt từng mục để bảo đảm ngắn, đúng sắc thái, tự nhiên với người Việt và khớp ngữ cảnh giáo trình.

## Kiểm thử đã thực hiện

- `npm run build`
- `npm audit --json`
- `python tests/verify_hsk_pwa.py`
- `python tests/verify_hsk_mobile_mock.py`
- Kiểm thử tải file Excel từ nút `Xuất file Excel`
