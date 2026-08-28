from __future__ import annotations

from pathlib import Path
import json
import sys

from playwright.sync_api import expect, sync_playwright


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        try:
            page = browser.new_page(viewport={"width": 1440, "height": 1000})
            page.goto("http://127.0.0.1:5173/", wait_until="networkidle")
            page.get_by_role("button", name="Bắt đầu ôn").first.click()

            expect(page.locator("[data-neko-tutor]")).to_have_count(0)
            page.get_by_role("button", name="Mở trợ giảng Neko").click()
            expect(page.locator("[data-neko-tutor]").get_by_text("Neko", exact=True)).to_be_visible()
            expect(page.get_by_text("Hãy chấm hoặc hiện đáp án trước.", exact=False)).to_be_visible()

            page.locator('[data-study-direction="zh-to-vi"]').click()
            expect(page.get_by_label("Nhập nghĩa tiếng Việt")).to_be_visible()
            page.locator("[data-reveal-answer]").click()
            page.get_by_role("button", name="Mở trợ giảng Neko").click()
            page.get_by_role("button", name="Hỏi Neko về câu này").click()
            expect(page.locator(".neko-answer")).to_be_visible(timeout=120_000)

            answer = page.locator(".neko-answer").inner_text().strip()
            if not answer:
                raise AssertionError("Neko returned an empty tutor answer")
            if answer.count("法律 (fǎ lǜ)") > 1:
                raise AssertionError("Neko answer contained a duplicated verification pass")

            first_session = json.loads(
                page.evaluate("window.localStorage.getItem('hong-hsk4-neko-tutor-session-v1')")
            )
            if first_session["turnCount"] != 1 or not first_session.get("conversationId"):
                raise AssertionError("Neko did not persist the first durable session turn")

            page.locator("#neko-question-input").fill("Cho tôi một câu hỏi ngắn để tự dùng từ này, chưa đưa đáp án.")
            page.locator("[data-neko-question-form]").get_by_role("button", name="Gửi câu hỏi").click()
            expect(page.locator("[data-neko-cancel]")).to_be_visible()
            expect(page.locator(".neko-message-tutor")).to_have_count(2, timeout=120_000)

            second_session = json.loads(
                page.evaluate("window.localStorage.getItem('hong-hsk4-neko-tutor-session-v1')")
            )
            if second_session["conversationId"] != first_session["conversationId"]:
                raise AssertionError("Neko follow-up created a different conversation")
            if second_session["turnCount"] != 2 or len(second_session["messages"]) != 4:
                raise AssertionError("Neko transcript did not retain both exchanges")

            Path("artifacts").mkdir(exist_ok=True)
            page.screenshot(path="artifacts/neko-local-pilot.png", full_page=True)
            print(page.locator(".neko-message-tutor").last.inner_text().strip())
        finally:
            browser.close()


if __name__ == "__main__":
    main()
