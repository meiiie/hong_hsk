# Contributing

Hồng HSK4 Studio ưu tiên chất lượng học thật hơn tốc độ thêm tính năng. Mọi thay đổi nên giữ ba nguyên tắc:

1. Mobile trước, desktop sau.
2. Dữ liệu học phải rõ nguồn và rõ trạng thái kiểm chứng.
3. Không phân phối đề thi/audio/tài liệu có bản quyền nếu chưa có quyền dùng.

## Quy trình dev

```bash
npm ci
python -m pip install -r tests/requirements.txt
python -m playwright install chromium
npm test
```

Với thay đổi UX/UI, hãy kiểm tra ít nhất:

- viewport điện thoại khoảng `390x844`;
- luồng `Học hôm nay`;
- luồng `Thi thử`;
- trạng thái ẩn/hiện đáp án của luyện nét.

## Dữ liệu HSK4

Nếu sửa từ vựng, pinyin, nghĩa Việt hoặc ví dụ:

- ghi rõ bài 4A/4B;
- tránh dịch quá dài;
- nếu chưa chắc, đánh dấu cần duyệt thay vì coi là dữ liệu cuối;
- không copy nguyên văn dài từ giáo trình có bản quyền.
