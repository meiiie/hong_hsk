import { readSheet } from "read-excel-file/browser";
import writeExcelFile, { type SheetData } from "write-excel-file/browser";
import { LESSON_TITLES } from "../../application/bootstrap/initial-state";
import { enrichVietnameseMeanings } from "../../application/vocab/data-enrichment";
import { createExcelCourseItems } from "../../domain/hsk4/hsk4-excel-vocab";
import type { AppState, BookCode, ReviewState, VocabItem } from "../../domain/types";
import { addDays, toDateKey } from "../../shared/date-utils";

type RawRow = Record<string, string>;

export async function importVocabFile(file: File): Promise<VocabItem[]> {
  const extension = file.name.toLowerCase().split(".").pop();
  if (extension === "csv") {
    return parseVocabRows(parseCsv(await file.text()), `Nhập CSV: ${file.name}`);
  }

  const sheet = await readSheet(file);
  const rows = sheet.map((row) =>
    row.map((cell) => (cell === null || cell === undefined ? "" : String(cell))),
  );
  return parseVocabRows(rowsToObjects(rows), `Nhập Excel: ${file.name}`);
}

export async function importStandardCourseReference(): Promise<VocabItem[]> {
  return createExcelCourseItems();
}

export async function exportWorkbook(state: AppState): Promise<void> {
  const sheets = [
    {
      sheet: "Vocab_DB",
      data: rowsToSheet([
        [
          "WordID",
          "Quyen",
          "Bai",
          "Ten bai",
          "Thu tu",
          "Tu Han",
          "Pinyin",
          "Nghia Viet",
          "Nghia Anh du phong",
          "Loai tu",
          "Vi du Han",
          "Vi du Pinyin",
          "Vi du Viet",
          "Nguon",
          "Ghi chu",
          "Loai",
        ],
        ...state.items.map((item) => [
          item.id,
          item.book,
          String(item.lesson),
          item.lessonTitle,
          String(item.order),
          item.hanzi,
          item.pinyin,
          item.meaningVi,
          item.meaningEn,
          item.partOfSpeech,
          item.exampleHan,
          item.examplePinyin,
          item.exampleVi,
          item.source,
          item.note,
          item.type,
        ]),
      ]),
      columns: [
        { width: 24 },
        { width: 10 },
        { width: 8 },
        { width: 24 },
        { width: 9 },
        { width: 18 },
        { width: 18 },
        { width: 28 },
        { width: 28 },
        { width: 12 },
        { width: 34 },
        { width: 34 },
        { width: 40 },
        { width: 28 },
        { width: 32 },
        { width: 14 },
      ],
    },
    {
      sheet: "Attempt_Log",
      data: rowsToSheet([
        [
          "AttemptID",
          "Ngay gio",
          "WordID",
          "Bai",
          "Dap an dung",
          "Nguoi hoc nhap",
          "Dung",
          "Che do",
          "Thoi gian ms",
        ],
        ...state.attempts.map((attempt) => [
          attempt.id,
          attempt.at,
          attempt.itemId,
          String(attempt.lesson),
          attempt.expected,
          attempt.input,
          attempt.correct ? "Dung" : "Sai",
          attempt.mode,
          String(attempt.latencyMs),
        ]),
      ]),
      columns: [
        { width: 30 },
        { width: 22 },
        { width: 24 },
        { width: 8 },
        { width: 16 },
        { width: 18 },
        { width: 10 },
        { width: 12 },
        { width: 14 },
      ],
    },
    {
      sheet: "Review_State",
      data: rowsToSheet([
        [
          "WordID",
          "Trang thai",
          "Ngay dau",
          "Lan cuoi",
          "Ngay on tiep",
          "Khoang ngay",
          "Ease",
          "Tong lan",
          "Dung",
          "Sai",
          "Dung lien tiep",
          "Lan nhap cuoi",
          "KQ cuoi",
        ],
        ...Object.values(state.reviews).map((review) => reviewToRow(review)),
      ]),
      columns: [
        { width: 24 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 8 },
        { width: 10 },
        { width: 8 },
        { width: 8 },
        { width: 14 },
        { width: 18 },
        { width: 10 },
      ],
    },
    {
      sheet: "Lich_30_ngay",
      data: rowsToSheet([
        ["Ngay", "Trong tam", "Bai moi", "On tap", "Ghi chu"],
        ...buildThirtyDayPlan(state.settings.startDate),
      ]),
      columns: [
        { width: 12 },
        { width: 28 },
        { width: 12 },
        { width: 30 },
        { width: 44 },
      ],
    },
  ];

  const blob = await writeExcelFile(sheets).toBlob();
  downloadBlob(blob, `Hong_HSK4_Studio_backup_${toDateKey()}.xlsx`);
}

export function exportJson(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  downloadBlob(blob, `Hong_HSK4_Studio_backup_${toDateKey()}.json`);
}

export function exportCsv(state: AppState): void {
  const rows = [
    [
      "WordID",
      "Quyen",
      "Bai",
      "Ten bai",
      "Thu tu",
      "Tu Han",
      "Pinyin",
      "Nghia Viet",
      "Nghia Anh du phong",
      "Loai tu",
      "Vi du Han",
      "Vi du Pinyin",
      "Vi du Viet",
      "Nguon",
      "Ghi chu",
      "Loai",
    ],
    ...state.items.map((item) => [
      item.id,
      item.book,
      String(item.lesson),
      item.lessonTitle,
      String(item.order),
      item.hanzi,
      item.pinyin,
      item.meaningVi,
      item.meaningEn,
      item.partOfSpeech,
      item.exampleHan,
      item.examplePinyin,
      item.exampleVi,
      item.source,
      item.note,
      item.type,
    ]),
  ];
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `Hong_HSK4_vocab_${toDateKey()}.csv`);
}

export function exportTemplateCsv(): void {
  const rows = [
    [
      "Bai",
      "Ten bai",
      "Thu tu",
      "Tu Han",
      "Pinyin",
      "Nghia Viet",
      "Nghia Anh du phong",
      "Loai tu",
      "Vi du Han",
      "Vi du Pinyin",
      "Vi du Viet",
      "Ghi chu",
    ],
    [
      "1",
      "简单的爱情",
      "1",
      "爱情",
      "aiqing",
      "tình yêu",
      "love",
      "n.",
      "真正的爱情需要理解和尊重。",
      "Zhenzheng de aiqing xuyao lijie he zunzhong.",
      "Tình yêu thật sự cần sự thấu hiểu và tôn trọng.",
      "Mẫu",
    ],
  ];
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, "Hong_HSK4_import_template.csv");
}

export function mergeItems(existing: VocabItem[], incoming: VocabItem[]): VocabItem[] {
  const map = new Map(existing.map((item) => [item.id, item]));
  incoming.forEach((item) => map.set(item.id, item));
  return Array.from(map.values()).sort((left, right) => {
    if (left.lesson !== right.lesson) {
      return left.lesson - right.lesson;
    }
    return left.order - right.order;
  });
}

export function parseVocabRows(rows: RawRow[], source: string): VocabItem[] {
  const lessonCounters = new Map<number, number>();

  const parsed = rows
    .map((row) => {
      const hanzi = cell(row, ["Tu Han", "Từ Hán", "Word/Phrase", "Hanzi", "Chinese", "中文", "Từ vựng"]);
      const lesson = parseLesson(cell(row, ["Bai", "Bài", "Lesson", "lesson"]));
      if (!hanzi || lesson < 1 || lesson > 20) {
        return undefined;
      }

      const nextOrder = (lessonCounters.get(lesson) ?? 0) + 1;
      lessonCounters.set(lesson, nextOrder);
      const book = parseBook(cell(row, ["Quyen", "Quyển", "Book", "book"]), lesson);
      const type = cell(row, ["Loai", "Loại", "Type", "type"]) || "New Word";
      const id = stableId(book, lesson, hanzi, type);

      return {
        id,
        book,
        lesson,
        lessonTitle:
          cell(row, ["Ten bai", "Tên bài", "Lesson Title", "Title"]) ??
          LESSON_TITLES[lesson] ??
          `Bài ${lesson}`,
        order: parseNumber(cell(row, ["Thu tu", "Thứ tự", "Order", "STT"])) ?? nextOrder,
        hanzi,
        pinyin: cell(row, ["Pinyin", "Phiên âm", "Phien am"]),
        meaningVi: cell(row, ["Nghia Viet", "Nghĩa Việt", "Vietnamese", "Tiếng Việt"]),
        meaningEn: cell(row, ["Nghia Anh du phong", "Nghĩa Anh dự phòng", "Meaning", "English", "Nghĩa Anh"]),
        partOfSpeech: cell(row, ["Loai tu", "Loại từ", "Part of Speech", "POS"]),
        exampleHan: cell(row, ["Vi du Han", "Ví dụ Hán", "Example Han", "Example Chinese"]),
        examplePinyin: cell(row, ["Vi du Pinyin", "Ví dụ Pinyin", "Example Pinyin"]),
        exampleVi: cell(row, ["Vi du Viet", "Ví dụ Việt", "Example Vietnamese"]),
        source,
        note: cell(row, ["Ghi chu", "Ghi chú", "Shelley's Notes", "Note"]),
        type,
      } satisfies VocabItem;
    })
    .filter((item): item is VocabItem => Boolean(item))
    .map((item, index) => ({
      ...item,
      order: item.order || index + 1,
    }));
  return enrichVietnameseMeanings(parsed);
}

function rowsToObjects(rows: string[][]): RawRow[] {
  const [headers, ...body] = rows;
  if (!headers) {
    return [];
  }
  return body.map((row) => {
    const object: RawRow = {};
    headers.forEach((header, index) => {
      object[header.trim()] = row[index]?.trim() ?? "";
    });
    return object;
  });
}

function parseCsv(csv: string): RawRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      row.push(field);
      field = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field);
      if (row.some((value) => value.trim())) {
        rows.push(row);
      }
      row = [];
      field = "";
      continue;
    }
    field += char;
  }

  row.push(field);
  if (row.some((value) => value.trim())) {
    rows.push(row);
  }

  return rowsToObjects(rows);
}

function cell(row: RawRow, keys: string[]): string {
  const lowerEntries = Object.entries(row).map(([key, value]) => [
    normalizeHeader(key),
    value,
  ]);
  const lowerMap = new Map(lowerEntries as Array<[string, string]>);

  for (const key of keys) {
    const value = lowerMap.get(normalizeHeader(key));
    if (value?.trim()) {
      return value.trim();
    }
  }
  return "";
}

function parseLesson(value: string): number {
  const cleaned = value.trim();
  const decimal = cleaned.match(/4[._-]?(\d{1,2})/);
  if (decimal) {
    return Number(decimal[1]);
  }
  const numeric = Number(cleaned);
  if (Number.isFinite(numeric)) {
    return numeric > 20 ? numeric % 100 : numeric;
  }
  const direct = cleaned.match(/(\d{1,2})/);
  return direct ? Number(direct[1]) : 0;
}

function parseBook(value: string, lesson: number): BookCode {
  if (/4\s*下|4b/i.test(value)) {
    return "4B";
  }
  if (/4\s*上|4a/i.test(value)) {
    return "4A";
  }
  return lesson <= 10 ? "4A" : "4B";
}

function parseNumber(value: string): number | undefined {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function normalizeHeader(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]/g, "");
}

function stableId(book: BookCode, lesson: number, hanzi: string, type: string): string {
  const normalized = `${book}-${lesson}-${hanzi}-${type}`.replace(/\s+/g, "-");
  return encodeURIComponent(normalized);
}

function rowsToSheet(rows: string[][]): SheetData {
  return rows.map((row, rowIndex) =>
    row.map((value) => ({
      value,
      type: String,
      fontWeight: rowIndex === 0 ? "bold" : undefined,
      backgroundColor: rowIndex === 0 ? "#edf2ff" : undefined,
      wrap: true,
    })),
  );
}

function reviewToRow(review: ReviewState): string[] {
  return [
    review.itemId,
    review.status,
    review.firstSeen,
    review.lastReviewed,
    review.nextReviewDate,
    String(review.intervalDays),
    String(review.ease),
    String(review.totalAttempts),
    String(review.correctAttempts),
    String(review.wrongCount),
    String(review.correctStreak),
    review.lastInput,
    review.lastCorrect ? "Dung" : "Sai",
  ];
}

function buildThirtyDayPlan(startDate: string): string[][] {
  return Array.from({ length: 30 }, (_, index) => {
    const day = index + 1;
    const date = addDays(startDate, index);
    if (day <= 20) {
      const title = LESSON_TITLES[day] ?? `Bài ${day}`;
      return [
        date,
        `Học bài ${day}: ${title}`,
        `Bài ${day}`,
        "Ôn từ đến hạn + từ sai hôm qua",
        "Mục tiêu: 30 từ mới, gõ chữ Hán, không chỉ đọc lại.",
      ];
    }
    if (day <= 24) {
      return [
        date,
        "Ôn vòng 2",
        "-",
        "Ưu tiên từ sai nhiều và từ có streak thấp",
        "Không học quá nhiều từ mới, tập phục hồi trí nhớ.",
      ];
    }
    if (day <= 27) {
      return [
        date,
        "Tổng ôn theo bài khóa",
        "-",
        "Trộn bài 1-20",
        "Đọc lại bài khóa, gõ lại từ trong ngữ cảnh.",
      ];
    }
    return [
      date,
      "Mô phỏng thi máy tính",
      "-",
      "Ôn nhẹ từ đến hạn",
      "Luyện tốc độ gõ, nghe, đọc, và quản lý thời gian.",
    ];
  });
}

function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
}

function escapeCsv(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
