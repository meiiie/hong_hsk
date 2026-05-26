from __future__ import annotations

import re
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


def main() -> None:
    artifacts = Path("artifacts")
    artifacts.mkdir(exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        desktop = browser.new_page(viewport={"width": 1440, "height": 1000})
        desktop.goto("http://127.0.0.1:5173/", wait_until="networkidle")
        expect(desktop.locator(".brand-copy").get_by_text("Hồng HSK4")).to_be_visible()
        expect(desktop.locator(".nav .mobile-more-trigger")).to_be_hidden()
        desktop.locator('[data-view="data"]').first.click()
        desktop.locator("[data-load-reference]").click()
        expect(desktop.locator(".sidebar-card strong")).to_contain_text("621", timeout=20000)
        desktop.locator("[data-sidebar-toggle]").click()
        expect(desktop.locator(".app-shell")).to_have_class(re.compile("sidebar-collapsed"))
        expect(desktop.locator('[data-view="mock"]').first).to_be_visible()
        desktop.locator("[data-sidebar-toggle]").click()
        expect(desktop.locator(".app-shell")).not_to_have_class(re.compile("sidebar-collapsed"))
        desktop.locator('[data-view="mock"]').first.click()
        expect(desktop.get_by_text("100 câu trong 105 phút")).to_be_visible()
        expect(desktop.get_by_text("Đề A - Tổng hợp chuẩn")).to_be_visible()
        expect(desktop.get_by_text("Blueprint 7 phần của bài thi")).to_be_visible()
        desktop.locator('[data-mock-set="set-d"]').click()
        expect(desktop.locator('[data-mock-set="set-d"]')).to_have_class(re.compile("active"))
        desktop.locator("[data-start-mock]").click()
        expect(desktop.get_by_text("Thi thử HSK4 trên máy tính")).to_have_count(0)
        expect(desktop.get_by_text("Thi thử HSK4 · Đề D - Tổng ôn sát ngày thi")).to_be_visible()
        expect(desktop.get_by_text("Câu 1/100")).to_be_visible()
        expect(desktop.locator("[data-exam-clock]")).to_be_visible()
        desktop.locator("[data-exam-answer]").first.click()
        desktop.locator("[data-exam-next]").click()
        expect(desktop.get_by_text("Câu 2/100")).to_be_visible()
        desktop.screenshot(path=str(artifacts / "hsk4-mock-exam-desktop.png"), full_page=True)

        mobile = browser.new_page(viewport={"width": 390, "height": 844}, is_mobile=True)
        mobile.goto("http://127.0.0.1:5173/", wait_until="networkidle")
        expect(mobile.locator(".mobile-brand-bar")).to_be_visible()
        expect(mobile.locator(".mobile-brand-bar").get_by_text("Hồng HSK4 Studio")).to_be_visible()
        mobile.locator("[data-mobile-more-toggle]").click()
        expect(mobile.get_by_role("dialog", name="Công cụ")).to_be_visible()
        expect(mobile.locator('.mobile-more-list [data-view="plan"]')).to_be_visible()
        mobile.locator('.mobile-more-list [data-view="plan"]').click()
        expect(mobile.get_by_text("Lịch ôn 30 ngày")).to_be_visible()
        mobile.locator('[data-view="study"]').first.click()
        expect(mobile.locator("#hanzi-input")).to_be_visible()
        mobile.screenshot(path=str(artifacts / "hsk4-mobile-study.png"), full_page=True)
        mobile.locator('[data-view="mock"]').first.click()
        expect(mobile.get_by_text("Đề A - Tổng hợp chuẩn")).to_be_visible()
        mobile.screenshot(path=str(artifacts / "hsk4-mobile-mock-intro-viewport.png"), full_page=False)
        mobile.locator("[data-start-mock]").click()
        expect(mobile.get_by_text("Câu 1/100")).to_be_visible()
        mobile.screenshot(path=str(artifacts / "hsk4-mobile-mock-exam.png"), full_page=True)
        mobile.screenshot(path=str(artifacts / "hsk4-mobile-mock-runner-viewport.png"), full_page=False)

        browser.close()


if __name__ == "__main__":
    main()
