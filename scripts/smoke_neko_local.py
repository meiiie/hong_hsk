from __future__ import annotations

from pathlib import Path
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

            neko = page.locator("[data-neko-tutor]")
            expect(neko.get_by_text("Neko AI", exact=True)).to_be_visible()
            expect(neko.get_by_text("Mở sau khi chấm hoặc hiện đáp án.")).to_be_visible()

            page.locator("[data-reveal-answer]").click()
            page.get_by_role("button", name="Hỏi Neko về câu này").click()
            expect(page.locator(".neko-answer")).to_be_visible(timeout=120_000)

            answer = page.locator(".neko-answer").inner_text().strip()
            if not answer:
                raise AssertionError("Neko returned an empty tutor answer")
            if answer.count("法律 (fǎ lǜ)") > 1:
                raise AssertionError("Neko answer contained a duplicated verification pass")
            Path("artifacts").mkdir(exist_ok=True)
            page.screenshot(path="artifacts/neko-local-pilot.png", full_page=True)
            print(answer)
        finally:
            browser.close()


if __name__ == "__main__":
    main()
