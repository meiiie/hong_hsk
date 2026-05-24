from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "og-image.png"
SIZE = (1200, 630)

BRAND = "#9f2734"
BRAND_DARK = "#331820"
BRAND_LIFT = "#d95d67"
CREAM = "#fff7f0"
PAPER = "#fffaf4"
INK = "#1f2230"
MUTED = "#6f6670"
ACCENT = "#0f766e"
LINE = "#efd7d3"


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
  return ImageFont.truetype(path, size=size)


LATIN_BOLD = font("C:/Windows/Fonts/arialbd.ttf", 58)
LATIN_SEMI = font("C:/Windows/Fonts/arialbd.ttf", 34)
LATIN = font("C:/Windows/Fonts/arial.ttf", 30)
LATIN_SMALL = font("C:/Windows/Fonts/arialbd.ttf", 24)
HANZI = font("C:/Windows/Fonts/msyhbd.ttc", 112)
HANZI_MARK = font("C:/Windows/Fonts/msyhbd.ttc", 96)
HANZI_BIG = font("C:/Windows/Fonts/msyhbd.ttc", 168)


def rounded(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int, fill: str, outline: str | None = None, width: int = 1) -> None:
  draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, fill: str, font_obj: ImageFont.FreeTypeFont, anchor: str = "la") -> None:
  draw.text(xy, value, fill=fill, font=font_obj, anchor=anchor)


def draw_wrapped(draw: ImageDraw.ImageDraw, x: int, y: int, value: str, width: int, fill: str, font_obj: ImageFont.FreeTypeFont, line_height: int) -> int:
  words = value.split()
  lines: list[str] = []
  current = ""
  for word in words:
    candidate = f"{current} {word}".strip()
    if draw.textlength(candidate, font=font_obj) <= width:
      current = candidate
    else:
      if current:
        lines.append(current)
      current = word
  if current:
    lines.append(current)

  for line in lines:
    text(draw, (x, y), line, fill, font_obj)
    y += line_height
  return y


def main() -> None:
  image = Image.new("RGB", SIZE, CREAM)
  draw = ImageDraw.Draw(image)

  for y in range(SIZE[1]):
    blend = y / SIZE[1]
    r = int(255 * (1 - blend) + 248 * blend)
    g = int(250 * (1 - blend) + 243 * blend)
    b = int(244 * (1 - blend) + 239 * blend)
    draw.line((0, y, SIZE[0], y), fill=(r, g, b))

  for x in range(-200, 1300, 92):
    draw.line((x, 0, x + 430, 630), fill="#f2ded9", width=2)
  for x in range(-40, 1400, 92):
    draw.line((x, 630, x + 430, 0), fill="#f8ebe8", width=2)

  rounded(draw, (74, 72, 1126, 558), 34, PAPER, LINE, 2)
  rounded(draw, (110, 110, 280, 280), 28, BRAND, None)
  rounded(draw, (130, 130, 260, 260), 22, BRAND_LIFT, None)
  draw.arc((122, 230, 268, 312), 10, 170, fill=ACCENT, width=12)
  text(draw, (195, 204), "红", CREAM, HANZI_MARK, "mm")

  text(draw, (326, 128), "Hồng HSK4 Studio", INK, LATIN_BOLD)
  text(draw, (330, 194), "Ôn từ vựng HSK4 theo bài 4A/4B", BRAND, LATIN_SEMI)
  draw_wrapped(
    draw,
    330,
    250,
    "Gõ chữ Hán tự chấm, luyện nét, ôn giãn cách và thi thử 100 câu trong một PWA nhẹ cho người Việt.",
    650,
    MUTED,
    LATIN,
    40,
  )

  text(draw, (932, 436), "汉", "#ead5d0", HANZI_BIG, "mm")
  text(draw, (1032, 490), "字", "#dfc3bd", HANZI, "mm")

  chip_x = 330
  for label in ["Giáo trình chuẩn", "Luyện nét", "Thi thử HSK4"]:
    chip_w = int(draw.textlength(label, font=LATIN_SMALL)) + 34
    rounded(draw, (chip_x, 404, chip_x + chip_w, 450), 23, "#ffffff", LINE, 2)
    text(draw, (chip_x + 17, 434), label, INK, LATIN_SMALL)
    chip_x += chip_w + 14

  draw.line((110, 500, 1090, 500), fill=LINE, width=2)
  text(draw, (110, 532), "hsk4.holilihu.online", ACCENT, LATIN_SMALL)

  OUT.parent.mkdir(parents=True, exist_ok=True)
  image.save(OUT, quality=94)
  print(OUT)


if __name__ == "__main__":
  main()
