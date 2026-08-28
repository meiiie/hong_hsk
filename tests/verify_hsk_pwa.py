from __future__ import annotations

import json
import re
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


def main() -> None:
    Path("artifacts").mkdir(exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        errors: list[str] = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on(
            "console",
            lambda message: errors.append(message.text) if message.type == "error" else None,
        )
        page.on(
            "requestfailed",
            lambda request: errors.append(f"Request failed: {request.url} ({request.failure})"),
        )
        page.add_init_script(
            """
            Object.defineProperty(HTMLMediaElement.prototype, "play", {
                configurable: true,
                value: function () {
                    return Promise.resolve();
                },
            });
            window.localStorage.setItem("hong-hsk4-ai-tutor-session-v1", "retired-test-state");
            """
        )
        page.route(
            "https://ntvcdn.b-cdn.net/**/*.mp3",
            lambda route: route.fulfill(status=200, content_type="audio/mpeg", body=b""),
        )
        neko_turn = {"count": 0}

        def route_neko(route) -> None:
            if route.request.url.endswith("/api/neko/tutor"):
                neko_turn["count"] += 1
                payload = json.loads(route.request.post_data or "{}")
                route.fulfill(
                    status=200,
                    content_type="application/json",
                    body=json.dumps(
                        {
                            "answer": f"Phản hồi thử nghiệm {neko_turn['count']} cho {payload['card']['hanzi']}.",
                            "conversationId": "20260828-010203-004-a1b2c3d4e5f60708",
                        },
                        ensure_ascii=False,
                    ),
                )
                return
            route.fulfill(status=200, content_type="application/json", body="{}")

        page.route("**/api/neko/**", route_neko)
        page.goto("http://127.0.0.1:5173/", wait_until="networkidle")
        assert page.evaluate("window.localStorage.getItem('hong-hsk4-ai-tutor-session-v1')") is None
        expect(page.locator(".brand-copy").get_by_text("Hồng HSK4")).to_be_visible()
        expect(page.get_by_role("heading", name="Hôm nay", exact=True)).to_be_visible()
        expect(page.locator('.nav [data-view="mock"] span').first).to_have_text("Luyện thi")
        assert page.evaluate("document.fonts.ready.then(() => document.fonts.check('16px \\\"Be Vietnam Pro\\\"'))")
        assert page.evaluate(
            "getComputedStyle(document.querySelector('.nav button.active')).boxShadow === 'none'"
        )
        assert page.evaluate(
            "getComputedStyle(document.querySelector('.nav button.active')).backgroundColor === 'rgb(255, 235, 238)'"
        )
        assert page.evaluate(
            "getComputedStyle(document.querySelector('.nav button.active')).borderRadius === '8px'"
        )
        assert page.evaluate(
            "getComputedStyle(document.querySelector('.nav button.active'), '::before').content === 'none'"
        )
        page.locator('.nav [data-view="lessons"]').first.hover()
        page.wait_for_timeout(200)
        assert page.evaluate(
            "getComputedStyle(document.querySelector('.nav [data-view=\"lessons\"]')).backgroundColor === 'rgb(255, 246, 243)'"
        )
        expect(page.get_by_text("Ôn thi HSK4 trên máy tính")).to_have_count(0)
        expect(page.locator(".topbar .language-switcher")).to_have_count(0)

        page.get_by_role("button", name="Bắt đầu ôn").first.click()
        expect(page.locator("#hanzi-input")).to_be_visible()
        expect(page.locator('[data-setting="alternateStudyDirections"]')).to_be_checked()
        page.locator('[data-setting="alternateStudyDirections"]').uncheck()
        expect(page.locator('[data-study-direction="vi-to-zh"]')).to_have_attribute("aria-pressed", "true")
        page.locator('[data-study-direction="zh-to-vi"]').click()
        expect(page.locator('[data-study-direction="zh-to-vi"]')).to_have_attribute("aria-pressed", "true")
        expect(page.get_by_label("Nhập nghĩa tiếng Việt")).to_be_visible()
        expect(page.locator(".prompt-hanzi h2")).to_contain_text("法律")
        expect(page.locator(".pinyin")).to_have_count(0)
        page.locator("#hanzi-input").fill("phap luat")
        page.get_by_role("button", name="Chấm đáp án").click()
        expect(page.get_by_text("Đúng", exact=True)).to_be_visible()
        expect(page.locator(".feedback")).to_contain_text("pháp luật")
        page.locator('[data-study-direction="vi-to-zh"]').click()
        expect(page.get_by_label("Nhập chữ Hán")).to_be_visible()
        expect(page.get_by_text("Luyện nét").first).to_be_visible()
        expect(page.get_by_text("Luyện nét khóa")).to_be_visible()
        expect(page.get_by_role("button", name="Mở trợ giảng Neko")).to_be_visible()
        expect(page.locator("[data-neko-tutor]")).to_have_count(0)
        page.get_by_role("button", name="Mở trợ giảng Neko").click()
        expect(page.locator("[data-neko-tutor]").get_by_text("Neko", exact=True)).to_be_visible()
        expect(page.get_by_text("Hãy chấm hoặc hiện đáp án trước.", exact=False)).to_be_visible()
        expect(page.locator("[data-neko-question]")).to_have_count(0)
        expect(page.get_by_text("Phiên được lưu ở đâu?")).to_have_count(0)
        expect(page.get_by_text("localStorage", exact=False)).to_have_count(0)
        expect(page.get_by_text("Ẩn trong lúc gõ")).to_have_count(0)
        expect(page.get_by_text("So khớp tự động")).to_have_count(0)
        expect(page.get_by_text("Số chữ")).to_have_count(0)
        expect(page.get_by_text("Chưa có log")).to_have_count(0)
        expect(page.get_by_text("Cách chấm")).to_be_visible()
        expect(page.get_by_text("Gia sư HSK")).to_have_count(0)
        expect(page.locator("#stroke-target")).to_have_count(0)
        expect(page.locator(".pinyin")).to_have_count(0)
        expect(page.get_by_text("Hôm nay tôi ôn từ")).to_have_count(0)
        page.locator("[data-reveal-answer]").click()
        expect(page.locator("[data-hide-answer]")).to_be_visible()
        expect(page.get_by_role("button", name="Hỏi Neko về câu này")).to_be_visible()
        expect(page.locator(".pinyin")).to_contain_text("fǎ lǜ")
        expect(page.get_by_text("Hôm nay tôi ôn từ")).to_have_count(0)
        page.locator("[data-hide-answer]").click()
        expect(page.locator("[data-reveal-answer]")).to_be_visible()
        expect(page.locator(".pinyin")).to_have_count(0)
        expect(page.locator("#stroke-target")).to_have_count(0)
        page.locator("#hanzi-input").fill("法绿")
        page.get_by_role("button", name="Chấm đáp án").click()
        expect(page.get_by_text("Sai", exact=True)).to_be_visible()
        expect(page.get_by_text("Gia sư HSK")).to_have_count(0)
        expect(page.locator("[data-ai-action]")).to_have_count(0)
        expect(page.locator("[data-neko-tutor]")).to_have_count(0)
        page.get_by_role("button", name="Mở trợ giảng Neko").click()
        expect(page.get_by_role("button", name="Hỏi Neko về câu này")).to_be_visible()
        expect(page.locator(".pinyin")).to_contain_text("fǎ lǜ")
        page.evaluate(
            """
            window.__hskOriginalFetch = window.fetch.bind(window);
            window.fetch = (input, init) => {
              const url = input && typeof input === "object" && "url" in input
                ? input.url
                : String(input ?? "");
              if (url.endsWith("/api/neko/tutor")) {
                return new Promise((_resolve, reject) => { window.__hskRejectPendingNeko = reject; });
              }
              if (url.endsWith("/api/neko/cancel")) {
                window.__hskRejectPendingNeko?.(new Error("cancelled by learner"));
                return Promise.resolve(new Response(
                  JSON.stringify({ conversationId: "20260828-010203-004-a1b2c3d4e5f60708" }),
                  { status: 200, headers: { "Content-Type": "application/json" } },
                ));
              }
              return window.__hskOriginalFetch(input, init);
            };
            """
        )
        page.get_by_role("button", name="Hỏi Neko về câu này").click()
        expect(page.get_by_role("button", name="Dừng")).to_be_visible()
        page.get_by_role("button", name="Dừng").click()
        expect(page.get_by_text("Lượt vừa rồi đã dừng.", exact=False)).to_be_visible()
        expect(page.locator(".neko-error")).to_have_count(0)
        page.evaluate("window.fetch = window.__hskOriginalFetch")

        page.evaluate(
            """
            window.__hskOriginalFetch = window.fetch.bind(window);
            window.fetch = (input, init) => {
              const url = input && typeof input === "object" && "url" in input
                ? input.url
                : String(input ?? "");
              if (!url.endsWith("/api/neko/tutor")) {
                return window.__hskOriginalFetch(input, init);
              }
              const encoder = new TextEncoder();
              const stream = new ReadableStream({
                start(controller) {
                  window.__hskFinishNekoStream = () => {
                    controller.enqueue(encoder.encode(JSON.stringify({
                      type: "delta",
                      text: "rồi hoàn tất.",
                    }) + "\\n"));
                    controller.enqueue(encoder.encode(JSON.stringify({
                      type: "done",
                      answer: "Neko đang trả lời theo khối rồi hoàn tất.",
                      conversationId: "20260828-010203-004-a1b2c3d4e5f60708",
                    }) + "\\n"));
                    controller.close();
                  };
                  controller.enqueue(encoder.encode(JSON.stringify({
                    type: "delta",
                    text: "Neko đang trả lời theo khối ",
                  }) + "\\n"));
                },
              });
              return Promise.resolve(new Response(stream, {
                status: 200,
                headers: { "Content-Type": "application/x-ndjson; charset=utf-8" },
              }));
            };
            """
        )
        page.locator("#neko-question-input").fill("Chỉ ra lỗi và cho tôi một mẹo nhớ.")
        page.locator("[data-neko-question-form]").get_by_role("button", name="Gửi câu hỏi").click()
        expect(page.locator("[data-neko-stream-answer]")).to_contain_text("Neko đang trả lời theo khối")
        expect(page.get_by_role("button", name="Dừng")).to_be_visible()
        page.evaluate("window.__hskFinishNekoStream()")
        expect(page.locator(".neko-message-learner")).to_have_count(1)
        expect(page.locator(".neko-message-tutor")).to_have_count(1)
        page.evaluate("window.fetch = window.__hskOriginalFetch")
        page.locator("#neko-question-input").fill("Cho tôi một câu hỏi thử lại.")
        page.locator("[data-neko-question-form]").get_by_role("button", name="Gửi câu hỏi").click()
        expect(page.locator(".neko-message-learner")).to_have_count(2)
        expect(page.locator(".neko-message-tutor")).to_have_count(2)
        assert page.evaluate(
            "JSON.parse(window.localStorage.getItem('hong-hsk4-neko-tutor-session-v1')).turnCount"
        ) == 2
        page.locator(".neko-panel-head [data-neko-close]").click()
        page.locator("#stroke-target svg").wait_for(state="visible", timeout=20000)
        page.get_by_role("button", name="Nét mẫu").click()
        expect(page.locator("#stroke-status")).to_contain_text(re.compile("Đang chạy|Đã xem xong"), timeout=5000)

        page.get_by_role("button", name="Thẻ tiếp theo").click()
        expect(page.locator(".neko-thread")).to_have_count(0)
        page.locator("#hanzi-input").fill("俩")
        page.get_by_role("button", name="Chấm đáp án").click()
        expect(page.get_by_text("Đúng", exact=True)).to_be_visible()
        page.get_by_role("button", name="Mở trợ giảng Neko").click()
        expect(page.locator(".neko-message-tutor")).to_have_count(2)
        durable_session_id = page.evaluate(
            "JSON.parse(window.localStorage.getItem('hong-hsk4-neko-tutor-session-v1')).conversationId"
        )
        page.reload(wait_until="networkidle")
        page.get_by_role("button", name="Bắt đầu ôn").first.click()
        page.locator("[data-reveal-answer]").click()
        expect(page.locator("[data-neko-tutor]")).to_have_count(0)
        page.get_by_role("button", name="Mở trợ giảng Neko").click()
        expect(page.locator(".neko-message-tutor")).to_have_count(2)
        assert page.evaluate(
            "JSON.parse(window.localStorage.getItem('hong-hsk4-neko-tutor-session-v1')).conversationId"
        ) == durable_session_id
        page.screenshot(path="artifacts/hsk4-neko-session-desktop.png", full_page=True)
        with page.expect_download() as download_info:
            page.get_by_role("button", name="Xuất cuộc trò chuyện").click()
        assert download_info.value.suggested_filename.startswith("hong-hsk4-neko-")
        page.get_by_role("button", name="Bắt đầu cuộc trò chuyện mới").click()
        expect(page.get_by_text("Bắt đầu cuộc trò chuyện mới?")).to_be_visible()
        page.get_by_role("button", name="Quay lại").click()
        expect(page.locator(".neko-message-tutor")).to_have_count(2)
        page.get_by_role("button", name="Bắt đầu cuộc trò chuyện mới").click()
        page.get_by_role("button", name="Bắt đầu mới").click()
        assert page.evaluate("window.localStorage.getItem('hong-hsk4-neko-tutor-session-v1')") is None
        expect(page.locator(".neko-thread")).to_have_count(0)
        page.get_by_label("Tùy chọn Neko").click()
        page.get_by_role("button", name="Tắt Neko").click()
        expect(page.get_by_text("Neko đang tắt", exact=True)).to_be_visible()
        page.get_by_role("button", name="Bật Neko").click()
        expect(page.get_by_role("button", name="Hỏi Neko về câu này")).to_be_visible()

        page.get_by_label("Điều hướng").get_by_role("button", name="Từ sai").click()
        expect(page.get_by_role("heading", name="Từ sai lần gần nhất")).to_be_visible()
        expect(page.get_by_role("cell", name="法律", exact=True)).to_be_visible()

        page.get_by_label("Điều hướng").get_by_role("button", name="Theo bài").click()
        expect(page.get_by_text("Nghe bài khóa")).to_be_visible()
        expect(page.get_by_role("button", name="Nghe").first).to_be_visible()
        expect(page.get_by_role("button", name="Xem transcript").first).to_be_visible()
        page.locator("[data-lesson-audio]").first.click()
        audio = page.locator("[data-lesson-audio-player='hsk4-1-1']")
        expect(audio).to_be_visible()
        audio_src = audio.get_attribute("src")
        assert audio_src is not None
        assert "ntvcdn.b-cdn.net" in audio_src
        assert "01-1-" in audio_src
        assert audio_src.endswith(".mp3")
        assert "/MobileResource/ViewRes" not in audio_src
        assert "/Common/DownRes" not in audio_src
        expect(page.locator("[data-lesson-audio-speed='0.75']")).to_be_visible()
        page.locator("[data-lesson-audio-speed='0.75']").click()
        expect(page.locator("[data-lesson-audio-speed='0.75']")).to_have_class(re.compile(r"\bactive\b"))
        assert page.evaluate("document.querySelector('[data-lesson-audio-player]').playbackRate") == 0.75
        expect(page.locator(".lesson-transcript-panel")).to_have_count(0)
        page.get_by_role("button", name="Xem transcript").first.click()
        expect(page.locator(".lesson-transcript-panel")).to_be_visible()
        expect(page.get_by_text("Chưa có transcript chữ Hán")).to_be_visible()

        page.locator("[data-account-menu-toggle]").click()
        page.locator('.sidebar-account-menu [data-view="settings"]').click()
        expect(page.get_by_role("heading", name="Trạng thái ứng dụng")).to_be_visible()
        expect(page.get_by_role("button", name="Kiểm tra")).to_be_visible()
        expect(page.get_by_text("Schema dữ liệu")).to_be_visible()

        page.locator("[data-account-menu-toggle]").click()
        page.locator('.sidebar-account-menu [data-view="data"]').click()
        expect(page.get_by_role("heading", name="Nhập dữ liệu chuẩn")).to_be_visible()
        page.screenshot(path=str(Path("artifacts") / "hsk4-pwa-dashboard.png"), full_page=True)

        if errors:
            raise AssertionError("\n".join(errors))

        auto_context = browser.new_context(viewport={"width": 1280, "height": 900})
        auto_page = auto_context.new_page()
        auto_page.goto("http://127.0.0.1:5173/", wait_until="networkidle")
        auto_page.get_by_role("button", name="Bắt đầu ôn").first.click()
        expect(auto_page.locator('[data-study-direction="vi-to-zh"]')).to_have_attribute("aria-pressed", "true")
        expect(auto_page.get_by_text("Đổi chiều mỗi phiên", exact=True)).to_be_visible()
        auto_page.locator('[data-study-mode="lesson"]').click()
        expect(auto_page.locator('[data-study-direction="vi-to-zh"]')).to_have_attribute("aria-pressed", "true")
        auto_page.locator('.nav [data-view="dashboard"]').click()
        expect(auto_page.get_by_text("Phiên kế tiếp · Trung → Việt")).to_be_visible()
        auto_page.locator('.nav [data-view="study"]').click()
        expect(auto_page.locator('[data-study-direction="zh-to-vi"]')).to_have_attribute("aria-pressed", "true")
        auto_page.locator('[data-study-mode="lesson"]').click()
        expect(auto_page.locator('[data-study-direction="zh-to-vi"]')).to_have_attribute("aria-pressed", "true")
        auto_page.locator('.nav [data-view="dashboard"]').click()
        expect(auto_page.get_by_text("Phiên kế tiếp · Việt → Trung")).to_be_visible()
        auto_page.locator('.nav [data-view="study"]').click()
        expect(auto_page.locator('[data-study-direction="vi-to-zh"]')).to_have_attribute("aria-pressed", "true")
        auto_page.locator('[data-study-direction="zh-to-vi"]').click()
        expect(auto_page.locator('[data-study-direction="zh-to-vi"]')).to_have_attribute("aria-pressed", "true")
        auto_page.locator('.nav [data-view="dashboard"]').click()
        expect(auto_page.get_by_text("Phiên kế tiếp · Việt → Trung")).to_be_visible()
        auto_page.locator('.nav [data-view="study"]').click()
        expect(auto_page.locator('[data-study-direction="vi-to-zh"]')).to_have_attribute("aria-pressed", "true")
        auto_context.close()

        browser.close()


if __name__ == "__main__":
    main()
