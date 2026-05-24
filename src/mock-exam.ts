import type { VocabItem } from "./types";

export type ExamSection = "listening" | "reading" | "writing";

export type ExamQuestionType =
  | "listen-true-false"
  | "listen-choice"
  | "read-blank"
  | "read-order"
  | "read-passage"
  | "order-sentence"
  | "write-sentence";

export interface MockExamSet {
  id: string;
  title: string;
  focus: string;
  description: string;
  seed: number;
}

export interface MockExamQuestion {
  id: string;
  section: ExamSection;
  part: string;
  number: number;
  type: ExamQuestionType;
  promptVi: string;
  promptHan?: string;
  passageHan?: string;
  questionHan?: string;
  audioText?: string;
  options?: string[];
  answer: string;
  fragments?: string[];
  targetWord?: string;
  expectedHan?: string;
  sourceSkill?: string;
}

export interface MockExamSession {
  id: string;
  setId: string;
  setTitle: string;
  startedAt: number;
  submittedAt?: number;
  durationMinutes: number;
  questions: MockExamQuestion[];
  answers: Record<string, string>;
  sourceNote: string;
  blueprintVersion: string;
}

export interface ExamSectionScore {
  section: ExamSection;
  label: string;
  correct: number;
  total: number;
  points: number;
}

export interface ExamScore {
  correct: number;
  total: number;
  percent: number;
  points: number;
  maxPoints: number;
  passed: boolean;
  sections: ExamSectionScore[];
}

export const HSK4_MOCK_SPEC = {
  durationMinutes: 105,
  listening: 45,
  reading: 40,
  writing: 15,
  total: 100,
} as const;

export const HSK4_MOCK_BLUEPRINT = [
  {
    section: "listening",
    part: "Nghe 1",
    count: 10,
    shape: "Nghe đoạn ngắn, phán đoán Đúng/Sai.",
  },
  {
    section: "listening",
    part: "Nghe 2",
    count: 15,
    shape: "Nghe hội thoại ngắn, chọn đáp án đúng.",
  },
  {
    section: "listening",
    part: "Nghe 3",
    count: 20,
    shape: "Nghe hội thoại/đoạn dài hơn, chọn đáp án đúng.",
  },
  {
    section: "reading",
    part: "Đọc 1",
    count: 10,
    shape: "Chọn từ phù hợp để điền vào chỗ trống.",
  },
  {
    section: "reading",
    part: "Đọc 2",
    count: 10,
    shape: "Sắp xếp ba câu/cụm theo thứ tự logic.",
  },
  {
    section: "reading",
    part: "Đọc 3",
    count: 20,
    shape: "Đọc đoạn văn ngắn, chọn đáp án đúng.",
  },
  {
    section: "writing",
    part: "Viết 1",
    count: 10,
    shape: "Sắp xếp từ/cụm đã cho thành câu tiếng Trung.",
  },
  {
    section: "writing",
    part: "Viết 2",
    count: 5,
    shape: "Dùng từ gợi ý và tình huống mô phỏng tranh để viết câu.",
  },
] as const;

export const HSK4_MOCK_SETS: MockExamSet[] = [
  {
    id: "set-a",
    title: "Đề A - Tổng hợp chuẩn",
    focus: "Cân bằng Nghe, Đọc, Viết",
    description: "Mã đề nền để làm lần đầu sau khi đã ôn xong 20 bài 4A/4B.",
    seed: 2026052501,
  },
  {
    id: "set-b",
    title: "Đề B - Tốc độ đọc",
    focus: "Đọc nhanh và loại nhiễu",
    description: "Nhiều câu đọc dùng từ gần nghĩa để luyện tốc độ xử lý trên màn hình.",
    seed: 2026052502,
  },
  {
    id: "set-c",
    title: "Đề C - Phản xạ nghe",
    focus: "Nghe keyword, hội thoại, ý chính",
    description: "Dùng seed khác để đảo bài nghe và buộc người học không nhớ đáp án cũ.",
    seed: 2026052503,
  },
  {
    id: "set-d",
    title: "Đề D - Tổng ôn sát ngày thi",
    focus: "Áp lực thời gian 105 phút",
    description: "Dùng trong 3-5 ngày cuối để kiểm tra độ bền và phần viết.",
    seed: 2026052504,
  },
];

const SOURCE_NOTE =
  "Cấu trúc bám HSK4 cũ trên ChineseTest: 100 câu, 105 phút, Nghe 45, Đọc 40, Viết 15. Nội dung câu hỏi là đề mô phỏng tự sinh từ bộ từ vựng 4A/4B đã nhập, không sao chép đề/audio chính thức có bản quyền.";

export function createMockExam(
  items: VocabItem[],
  set: MockExamSet = HSK4_MOCK_SETS[0],
  now = Date.now(),
): MockExamSession {
  const pool = makeQuestionPool(items);
  if (!pool.length) {
    return {
      id: `${set.id}-${now}`,
      setId: set.id,
      setTitle: set.title,
      startedAt: now,
      durationMinutes: HSK4_MOCK_SPEC.durationMinutes,
      questions: [],
      answers: {},
      sourceNote: SOURCE_NOTE,
      blueprintVersion: "hsk4-old-100q-v3-context",
    };
  }

  const rng = mulberry32(set.seed);
  const shuffled = shuffle(pool, rng);
  let cursor = 0;
  let number = 1;
  const questions: MockExamQuestion[] = [];

  const nextItem = (): VocabItem => {
    const item = shuffled[cursor % shuffled.length];
    cursor += 1;
    return item;
  };

  for (let index = 0; index < 10; index += 1) {
    const item = nextItem();
    const isTrue = index % 2 === 0;
    const pairedItem = isTrue ? item : nextItem();
    const judgment = listeningJudgment(item, pairedItem, isTrue, index);
    questions.push({
      id: `${set.id}-q-${number}`,
      section: "listening",
      part: "Nghe 1",
      number,
      type: "listen-true-false",
      promptVi: "Nghe đoạn ngắn, sau đó phán đoán câu bên dưới có khớp nội dung không.",
      promptHan: judgment.statement,
      audioText: judgment.audioText,
      answer: isTrue ? "Đúng" : "Sai",
      options: ["Đúng", "Sai"],
      sourceSkill: "Nghe hiểu nội dung câu, không chỉ bắt keyword.",
    });
    number += 1;
  }

  for (let index = 0; index < 15; index += 1) {
    const item = nextItem();
    questions.push({
      id: `${set.id}-q-${number}`,
      section: "listening",
      part: "Nghe 2",
      number,
      type: "listen-choice",
      promptVi: "Nghe hội thoại ngắn và chọn từ/cụm khớp nội dung nhất.",
      questionHan: shortListeningQuestion(index),
      audioText: shortDialogue(item, index),
      answer: item.hanzi,
      options: optionsFor(item, shuffled, (option) => option.hanzi, rng),
      sourceSkill: "Nghe hội thoại ngắn và chọn đáp án.",
    });
    number += 1;
  }

  for (let index = 0; index < 20; index += 1) {
    const item = nextItem();
    const helperItem = nextItem();
    questions.push({
      id: `${set.id}-q-${number}`,
      section: "listening",
      part: "Nghe 3",
      number,
      type: "listen-choice",
      promptVi: "Nghe đoạn dài hơn, nắm ý chính rồi chọn đáp án đúng.",
      questionHan: longListeningQuestion(index),
      audioText: longListeningPassage(item, helperItem, index),
      answer: item.hanzi,
      options: optionsFor(item, shuffled, (option) => option.hanzi, rng),
      sourceSkill: "Nghe đoạn/hội thoại dài hơn và chọn ý chính.",
    });
    number += 1;
  }

  for (let index = 0; index < 10; index += 1) {
    const item = nextItem();
    questions.push({
      id: `${set.id}-q-${number}`,
      section: "reading",
      part: "Đọc 1",
      number,
      type: "read-blank",
      promptVi: "Chọn từ phù hợp để hoàn thành câu.",
      promptHan: blankSentence(item),
      answer: item.hanzi,
      options: optionsFor(item, shuffled, (option) => option.hanzi, rng),
      sourceSkill: "Đọc điền từ vào chỗ trống.",
    });
    number += 1;
  }

  for (let index = 0; index < 10; index += 1) {
    const item = nextItem();
    const orderQuestion = orderedReadingQuestion(item, rng);
    questions.push({
      id: `${set.id}-q-${number}`,
      section: "reading",
      part: "Đọc 2",
      number,
      type: "read-order",
      promptVi: "Sắp xếp ba câu/cụm A, B, C theo thứ tự logic.",
      answer: orderQuestion.answer,
      fragments: orderQuestion.fragments,
      options: orderQuestion.options,
      sourceSkill: "Đọc hiểu mạch logic và sắp xếp câu.",
    });
    number += 1;
  }

  for (let index = 0; index < 20; index += 1) {
    const item = nextItem();
    const helperItem = nextItem();
    questions.push({
      id: `${set.id}-q-${number}`,
      section: "reading",
      part: "Đọc 3",
      number,
      type: "read-passage",
      promptVi: "Đọc đoạn văn ngắn và chọn đáp án đúng.",
      passageHan: readingPassage(item, helperItem, index),
      questionHan: "这段话主要说明哪一个词？",
      answer: item.hanzi,
      options: optionsFor(item, shuffled, (option) => option.hanzi, rng),
      sourceSkill: "Đọc đoạn văn ngắn, chọn ý chính/chi tiết.",
    });
    number += 1;
  }

  for (let index = 0; index < 10; index += 1) {
    const item = nextItem();
    const expected = sentenceFor(item);
    questions.push({
      id: `${set.id}-q-${number}`,
      section: "writing",
      part: "Viết 1",
      number,
      type: "order-sentence",
      promptVi: "Sắp xếp các cụm dưới đây thành câu tiếng Trung đúng.",
      answer: expected,
      fragments: shuffle(sentenceFragments(item), rng),
      expectedHan: expected,
      sourceSkill: "Viết 1: sắp xếp từ/cụm thành câu.",
    });
    number += 1;
  }

  for (let index = 0; index < 5; index += 1) {
    const item = nextItem();
    questions.push({
      id: `${set.id}-q-${number}`,
      section: "writing",
      part: "Viết 2",
      number,
      type: "write-sentence",
      promptVi: `Dùng từ gợi ý để viết một câu tiếng Trung phù hợp với tình huống mô phỏng tranh: ${meaningOf(item)}.`,
      promptHan: `词语：${item.hanzi}`,
      answer: item.hanzi,
      targetWord: item.hanzi,
      expectedHan: item.exampleHan || sentenceFor(item),
      sourceSkill: "Viết 2: dùng từ gợi ý để tự viết câu.",
    });
    number += 1;
  }

  return {
    id: `${set.id}-${now}`,
    setId: set.id,
    setTitle: set.title,
    startedAt: now,
    durationMinutes: HSK4_MOCK_SPEC.durationMinutes,
    questions,
    answers: {},
    sourceNote: SOURCE_NOTE,
    blueprintVersion: "hsk4-old-100q-v3-context",
  };
}

export function scoreMockExam(session: MockExamSession): ExamScore {
  const sectionLabels: Record<ExamSection, string> = {
    listening: "Nghe",
    reading: "Đọc",
    writing: "Viết",
  };
  const sections = (["listening", "reading", "writing"] as const).map((section) => {
    const questions = session.questions.filter((question) => question.section === section);
    const correct = questions.filter((question) => isQuestionCorrect(question, session.answers[question.id] ?? "")).length;
    const points = questions.length ? Math.round((correct / questions.length) * 100) : 0;
    return {
      section,
      label: sectionLabels[section],
      correct,
      total: questions.length,
      points,
    };
  });
  const correct = sections.reduce((sum, section) => sum + section.correct, 0);
  const total = sections.reduce((sum, section) => sum + section.total, 0);
  const points = sections.reduce((sum, section) => sum + section.points, 0);
  return {
    correct,
    total,
    percent: total ? Math.round((correct / total) * 100) : 0,
    points,
    maxPoints: 300,
    passed: points >= 180,
    sections,
  };
}

export function isQuestionCorrect(question: MockExamQuestion, answer: string): boolean {
  if (!answer.trim()) {
    return false;
  }
  if (question.type === "write-sentence") {
    const hanziCount = Array.from(answer).filter((char) => /\p{Script=Han}/u.test(char)).length;
    return Boolean(question.targetWord && answer.includes(question.targetWord) && hanziCount >= 6);
  }
  return normalizeAnswer(answer) === normalizeAnswer(question.answer);
}

export function formatExamTime(ms: number): string {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.ceil(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function makeQuestionPool(items: VocabItem[]): VocabItem[] {
  const usable = items.filter((item) => item.hanzi.trim() && meaningOf(item));
  return usable.length ? usable : items.filter((item) => item.hanzi.trim());
}

function meaningOf(item: VocabItem): string {
  return item.meaningVi.trim() || item.meaningEn.trim() || item.hanzi;
}

function sentenceFor(item: VocabItem): string {
  if (item.exampleHan.trim().includes(item.hanzi)) {
    return item.exampleHan.trim();
  }
  return `我觉得${item.hanzi}很重要。`;
}

function sentenceFragments(item: VocabItem): string[] {
  return ["我觉得", item.hanzi, "很重要"];
}

function listeningJudgment(
  item: VocabItem,
  pairedItem: VocabItem,
  isTrue: boolean,
  index: number,
): { audioText: string; statement: string } {
  const subject = ["小王", "小李", "老师", "经理", "这位同学"][index % 5];
  const main = stripFinalPunctuation(sentenceFor(item));
  const paired = stripFinalPunctuation(sentenceFor(pairedItem));
  const audioText = `${subject}说：${main}。后来，他还举了一个生活中的例子。`;
  const statement = isTrue
    ? `${subject}的看法是：${main}。`
    : `${subject}的看法是：${paired}。`;
  return { audioText, statement };
}

function shortListeningQuestion(index: number): string {
  return [
    "男的主要在说什么？",
    "他们最可能讨论哪件事？",
    "这段对话的重点是什么？",
  ][index % 3];
}

function longListeningQuestion(index: number): string {
  return [
    "根据这段话，说话人最重视什么？",
    "这段话主要想说明什么？",
    "说话人最后强调了哪一点？",
    "下面哪一个词最符合这段话？",
  ][index % 4];
}

function shortDialogue(item: VocabItem, index: number): string {
  const example = stripFinalPunctuation(sentenceFor(item));
  const openings = [
    `女：你今天上课学到了什么？男：${example}。我觉得这个内容很实用。`,
    `男：你为什么把这句话记下来？女：${example}。老师说考试时可能会用到。`,
    `女：这件事你怎么看？男：${example}。所以我想再练习一次。`,
  ];
  return `${openings[index % openings.length]} 问：${shortListeningQuestion(index)}`;
}

function longListeningPassage(item: VocabItem, helperItem: VocabItem, index: number): string {
  const topic = index % 2 === 0 ? "考试" : "工作";
  const main = stripFinalPunctuation(sentenceFor(item));
  const helper = stripFinalPunctuation(sentenceFor(helperItem));
  return `最近他在准备${topic}，每天都会听一段材料，然后写下重点。开始的时候，他只记住了这句话：${helper}。后来老师提醒他，真正重要的是：${main}。问：${longListeningQuestion(index)}`;
}

function blankSentence(item: VocabItem): string {
  const example = sentenceFor(item);
  if (example.includes(item.hanzi)) {
    return example.replace(item.hanzi, "____");
  }
  return `我今天学习了____这个词。`;
}

function orderedReadingQuestion(item: VocabItem, rng: () => number): { fragments: string[]; answer: string; options: string[] } {
  const ordered = [
    `为了真正记住“${item.hanzi}”，小林先看了例句。`,
    "然后他盖住答案，自己在本子上写了一遍。",
    "最后他检查错误，并把错的地方放进明天的复习表。",
  ];
  const labels = ["A", "B", "C"];
  const labelled = shuffle(
    ordered.map((text, index) => ({
      label: labels[index],
      text,
    })),
    rng,
  );
  const answer = ordered.map((text) => labelled.find((line) => line.text === text)?.label ?? "").join("");
  const alternatives = ["ABC", "ACB", "BAC", "BCA", "CAB", "CBA"].filter((option) => option !== answer);
  const options = shuffle([answer, ...shuffle(alternatives, rng).slice(0, 3)], rng);
  return {
    fragments: labelled.map((line) => `${line.label}. ${line.text}`),
    answer,
    options,
  };
}

function readingPassage(item: VocabItem, helperItem: VocabItem, index: number): string {
  const place = index % 2 === 0 ? "学校" : "公司";
  const main = stripFinalPunctuation(sentenceFor(item));
  const helper = stripFinalPunctuation(sentenceFor(helperItem));
  return `在${place}里，大家常常需要清楚地表达自己的想法。有时候，一个词放在不同句子里，意思会更清楚。比如：${main}。如果只看另一个例子“${helper}”，还不一定能判断作者的重点。`;
}

function optionsFor(
  answerItem: VocabItem,
  pool: VocabItem[],
  valueOf: (item: VocabItem) => string,
  rng: () => number,
): string[] {
  const values = [valueOf(answerItem)];
  const candidates = shuffle(pool, rng);
  for (const item of candidates) {
    const value = valueOf(item);
    if (value && !values.includes(value)) {
      values.push(value);
    }
    if (values.length === 4) {
      break;
    }
  }
  return shuffle(values, rng);
}

function stripFinalPunctuation(value: string): string {
  return value.replace(/[。！？!?]\s*$/u, "");
}

function normalizeAnswer(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\s，。！？、,.!?；;：“”"']/g, "")
    .toLowerCase();
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}
