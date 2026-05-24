from __future__ import annotations

import csv
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

SOURCE_URLS = [
    "https://raw.githubusercontent.com/joelypoley/hsk_standard_course_vocab/main/hsk_vocab/HSK%20Standard%20Course%20Vocabulary%20-%20hsk_4a.csv",
    "https://raw.githubusercontent.com/joelypoley/hsk_standard_course_vocab/main/hsk_vocab/HSK%20Standard%20Course%20Vocabulary%20-%20hsk_4b.csv",
]

ROOT = Path(__file__).resolve().parents[1]
CACHE_PATH = ROOT / "docs" / "hsk4-pwa" / "generated" / "hsk4-vi-translation-cache.json"
OUTPUT_PATH = ROOT / "src" / "hsk4-vi-glossary.ts"

HANZI_OVERRIDES = {
    "爱情": "tình yêu",
    "安排": "sắp xếp",
    "按时": "đúng giờ",
    "按照": "dựa theo, căn cứ vào",
    "安全": "an toàn",
    "报名": "đăng ký",
    "保护": "bảo vệ",
    "表示": "biểu thị, bày tỏ",
    "标准": "tiêu chuẩn",
    "不仅": "không chỉ",
    "举办": "tổ chức",
    "举": "nêu, giơ lên",
    "交通": "giao thông",
    "亮": "sáng",
    "仍然": "vẫn, vẫn còn",
    "付款": "thanh toán",
    "代表": "đại diện, biểu thị",
    "以为": "cho rằng, tưởng rằng",
    "份": "phần, suất; lượng từ cho tài liệu/công việc",
    "优点": "ưu điểm",
    "保证": "bảo đảm, cam đoan",
    "幸福": "hạnh phúc",
    "友谊": "tình bạn",
    "不过": "tuy nhiên, nhưng mà",
    "专业": "chuyên ngành, chuyên môn",
    "丰富": "phong phú, làm phong phú",
    "之": "trợ từ văn viết: của",
    "做客": "làm khách, đến nhà ai làm khách",
    "到底": "rốt cuộc, cuối cùng",
    "千万": "nhất định, tuyệt đối",
    "占线": "máy bận, đường dây bận",
    "取": "lấy, nhận",
    "受不了": "không chịu nổi",
    "只好": "đành phải, chỉ còn cách",
    "台": "lượng từ cho máy móc, thiết bị hoặc tiết mục",
    "同情": "thông cảm, đồng cảm",
    "响": "kêu, vang",
    "商量": "bàn bạc, thương lượng",
    "场": "trận, buổi; lượng từ cho sự kiện",
    "处": "nơi, chỗ",
    "地址": "địa chỉ",
    "够": "đủ",
    "对于": "đối với",
    "对话": "đối thoại, trò chuyện",
    "师傅": "sư phụ, bác thợ; cách gọi người có tay nghề",
    "当": "làm, đảm nhiệm; khi",
    "当时": "lúc đó, khi ấy",
    "得到": "đạt được, nhận được",
    "恐怕": "e rằng, có lẽ",
    "掉": "rơi, mất; bổ ngữ chỉ kết quả mất đi",
    "接着": "tiếp theo, liền sau đó",
    "放暑假": "nghỉ hè",
    "方向": "phương hướng, hướng",
    "感动": "cảm động, làm cảm động",
    "无法": "không có cách nào, không thể",
    "无论": "dù, bất kể",
    "既": "đã..., vừa...; dùng với 又",
    "有关": "có liên quan",
    "来不及": "không kịp",
    "来得及": "còn kịp",
    "棵": "lượng từ cho cây",
    "满": "đầy, đủ, đạt mức",
    "熟悉": "quen thuộc, thông thạo",
    "甚至": "thậm chí",
    "确实": "quả thật, đúng là",
    "礼貌": "lễ phép, lịch sự",
    "租": "thuê, cho thuê",
    "稍微": "hơi, một chút",
    "究竟": "rốt cuộc",
    "符合": "phù hợp với",
    "篇": "lượng từ cho bài viết",
    "约会": "cuộc hẹn, hẹn hò",
    "而": "mà, còn; nhưng",
    "聚会": "buổi tụ họp, tụ họp",
    "自然": "tự nhiên, dĩ nhiên",
    "获得": "giành được, đạt được",
    "讨论": "thảo luận",
    "说明": "giải thích, chứng minh",
    "谈": "nói chuyện, bàn về",
    "赚": "kiếm tiền, kiếm lời",
    "趟": "chuyến, lượt",
    "身边": "bên cạnh, bên mình",
    "达到": "đạt đến",
    "适合": "phù hợp",
    "适应": "thích nghi với",
    "遍": "lượt, lần từ đầu đến cuối",
    "重新": "lại, một lần nữa",
    "随着": "theo, cùng với",
    "难道": "lẽ nào, chẳng lẽ",
    "刚": "vừa mới",
    "共同": "chung, cùng nhau",
    "法律": "pháp luật",
    "直接": "trực tiếp",
    "经验": "kinh nghiệm",
    "考虑": "cân nhắc, suy xét",
    "联系": "liên hệ, liên lạc",
    "发展": "phát triển",
    "发生": "xảy ra",
    "及时": "kịp thời",
    "使用": "sử dụng",
    "作用": "tác dụng, vai trò",
    "严格": "nghiêm khắc, nghiêm ngặt",
    "严重": "nghiêm trọng",
}


def main() -> None:
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    cache = load_cache()
    rows = fetch_rows()
    glossary: dict[str, str] = {}

    for index, row in enumerate(rows, start=1):
        hanzi = row.get("Word/Phrase", "").strip()
        meaning = row.get("Meaning", "").strip()
        if not hanzi or not meaning:
            continue
        glossary[hanzi] = HANZI_OVERRIDES.get(hanzi) or translate_cached(meaning, cache)
        if index % 25 == 0:
            save_cache(cache)

    save_cache(cache)
    write_typescript(glossary)
    print(f"Wrote {len(glossary)} Vietnamese glosses to {OUTPUT_PATH}")


def fetch_rows() -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for url in SOURCE_URLS:
        with urllib.request.urlopen(url, timeout=30) as response:
            text = response.read().decode("utf-8-sig")
        rows.extend(csv.DictReader(text.splitlines()))
    return rows


def load_cache() -> dict[str, str]:
    if CACHE_PATH.exists():
        return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    return {}


def save_cache(cache: dict[str, str]) -> None:
    CACHE_PATH.write_text(
        json.dumps(cache, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )


def translate_cached(text: str, cache: dict[str, str]) -> str:
    if text not in cache:
        cache[text] = postprocess(translate(text))
        time.sleep(0.08)
    return postprocess(cache[text])


def translate(text: str) -> str:
    query = urllib.parse.urlencode(
        {
            "client": "gtx",
            "sl": "en",
            "tl": "vi",
            "dt": "t",
            "q": text,
        }
    )
    url = f"https://translate.googleapis.com/translate_a/single?{query}"
    with urllib.request.urlopen(url, timeout=30) as response:
        payload = json.loads(response.read().decode("utf-8"))
    return "".join(chunk[0] for chunk in payload[0] if chunk and chunk[0])


def postprocess(text: str) -> str:
    value = " ".join(text.strip().split())
    if value.lower().startswith("để "):
        value = value[3:]
    value = value.replace(" ,", ",").replace(" ;", ";")
    parts = [part.strip() for part in value.split(",")]
    deduped: list[str] = []
    for part in parts:
        lowered = part.lower()
        if part and lowered not in {item.lower() for item in deduped}:
            deduped.append(part)
    return ", ".join(deduped)


def write_typescript(glossary: dict[str, str]) -> None:
    lines = [
        "// Auto-generated by scripts/generate_hsk4_vi_glossary.py.",
        "// Vietnamese meanings combine machine translation and curated overrides, but still must be reviewed against the textbook.",
        "export const HSK4_VI_GLOSSARY: Record<string, string> = {",
    ]
    for hanzi in sorted(glossary):
        lines.append(f"  {json.dumps(hanzi, ensure_ascii=False)}: {json.dumps(glossary[hanzi], ensure_ascii=False)},")
    lines.append("};")
    lines.append("")
    OUTPUT_PATH.write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    main()
