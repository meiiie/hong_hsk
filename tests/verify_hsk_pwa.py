from __future__ import annotations

from pathlib import Path

from playwright.sync_api import expect, sync_playwright


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})
        errors: list[str] = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.on(
            "console",
            lambda message: errors.append(message.text) if message.type == "error" else None,
        )

        page.goto("http://127.0.0.1:5173/", wait_until="networkidle")
        expect(page.locator(".brand-copy").get_by_text("Hồng HSK4")).to_be_visible()
        expect(page.get_by_role("heading", name="Tổng quan hôm nay")).to_be_visible()
        expect(page.get_by_text("Ôn thi HSK4 trên máy tính")).to_have_count(0)

        page.get_by_role("button", name="Bắt đầu ôn").first.click()
        expect(page.locator("#hanzi-input")).to_be_visible()
        expect(page.get_by_text("Luyện nét").first).to_be_visible()
        expect(page.get_by_text("Ẩn trong lúc gõ")).to_be_visible()
        expect(page.locator("#stroke-target")).to_have_count(0)
        expect(page.locator(".pinyin")).to_have_count(0)
        page.locator("[data-reveal-answer]").click()
        expect(page.locator("[data-hide-answer]")).to_be_visible()
        expect(page.locator(".pinyin")).to_contain_text("fǎ lǜ")
        page.locator("[data-hide-answer]").click()
        expect(page.locator("[data-reveal-answer]")).to_be_visible()
        expect(page.locator(".pinyin")).to_have_count(0)
        expect(page.locator("#stroke-target")).to_have_count(0)
        page.locator("#hanzi-input").fill("法绿")
        page.get_by_role("button", name="Chấm đáp án").click()
        expect(page.get_by_text("Sai", exact=True)).to_be_visible()
        expect(page.locator(".pinyin")).to_contain_text("fǎ lǜ")
        page.locator("#stroke-target svg").wait_for(state="visible", timeout=20000)
        page.get_by_role("button", name="Nét mẫu").click()
        expect(page.locator("#stroke-status")).to_contain_text("Đang chạy", timeout=5000)

        page.get_by_role("button", name="Thẻ tiếp theo").click()
        page.locator("#hanzi-input").fill("俩")
        page.get_by_role("button", name="Chấm đáp án").click()
        expect(page.get_by_text("Đúng", exact=True)).to_be_visible()

        page.get_by_label("Điều hướng").get_by_role("button", name="Từ sai").click()
        expect(page.get_by_role("heading", name="Từ sai lần gần nhất")).to_be_visible()
        expect(page.get_by_role("cell", name="法律", exact=True)).to_be_visible()

        page.get_by_role("button", name="Dữ liệu").click()
        expect(page.get_by_role("heading", name="Nhập dữ liệu chuẩn")).to_be_visible()
        page.screenshot(path=str(Path("artifacts") / "hsk4-pwa-dashboard.png"), full_page=True)

        if errors:
            raise AssertionError("\n".join(errors))

        browser.close()


if __name__ == "__main__":
    main()
