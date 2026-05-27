import type { AppState, VocabItem } from "../../domain/types";
import { createExcelCourseItems } from "../../domain/hsk4/hsk4-excel-vocab";
import { HSK4_REVIEW_POLICY } from "../../domain/review/review-policy";
import { toDateKey } from "../../shared/date-utils";

export const APP_STATE_VERSION = 1;

export const LESSON_TITLES: Record<number, string> = {
  1: "简单的爱情",
  2: "真正的朋友",
  3: "经理对我印象不错",
  4: "不要太着急赚钱",
  5: "只买对的，不买贵的",
  6: "一分钱一分货",
  7: "最好的医生是自己",
  8: "生活中不缺少美",
  9: "阳光总在风雨后",
  10: "幸福的标准",
  11: "读书好，读好书，好读书",
  12: "用心发现世界",
  13: "喝着茶看京剧",
  14: "保护地球母亲",
  15: "教育孩子的艺术",
  16: "生活可以更美好",
  17: "人与自然",
  18: "科技与世界",
  19: "生活的味道",
  20: "路上的风景",
};

const starterRows: Array<
  Pick<
    VocabItem,
    | "lesson"
    | "hanzi"
    | "pinyin"
    | "meaningVi"
    | "meaningEn"
    | "partOfSpeech"
    | "exampleHan"
    | "examplePinyin"
    | "exampleVi"
  >
> = [
  {
    lesson: 1,
    hanzi: "爱情",
    pinyin: "aiqing",
    meaningVi: "tinh yêu",
    meaningEn: "love",
    partOfSpeech: "n.",
    exampleHan: "真正的爱情需要理解和尊重。",
    examplePinyin: "Zhenzheng de aiqing xuyao lijie he zunzhong.",
    exampleVi: "Tình yêu thật sự cần sự thấu hiểu và tôn trọng.",
  },
  {
    lesson: 1,
    hanzi: "不仅",
    pinyin: "bujin",
    meaningVi: "không chỉ",
    meaningEn: "not only",
    partOfSpeech: "conj.",
    exampleHan: "他不仅会说汉语，还会写汉字。",
    examplePinyin: "Ta bujin hui shuo Hanyu, hai hui xie Hanzi.",
    exampleVi: "Anh ấy không chỉ biết nói tiếng Trung mà còn biết viết chữ Hán.",
  },
  {
    lesson: 2,
    hanzi: "友谊",
    pinyin: "youyi",
    meaningVi: "tình bạn",
    meaningEn: "friendship",
    partOfSpeech: "n.",
    exampleHan: "真正的友谊不会因为距离而改变。",
    examplePinyin: "Zhenzheng de youyi bu hui yinwei juli er gaibian.",
    exampleVi: "Tình bạn thật sự không thay đổi vì khoảng cách.",
  },
  {
    lesson: 3,
    hanzi: "安排",
    pinyin: "anpai",
    meaningVi: "sắp xếp",
    meaningEn: "to arrange",
    partOfSpeech: "v.",
    exampleHan: "经理已经安排好了明天的会议。",
    examplePinyin: "Jingli yijing anpai hao le mingtian de huiyi.",
    exampleVi: "Giám đốc đã sắp xếp xong cuộc họp ngày mai.",
  },
  {
    lesson: 4,
    hanzi: "按时",
    pinyin: "anshi",
    meaningVi: "đúng giờ",
    meaningEn: "on time",
    partOfSpeech: "adv.",
    exampleHan: "准备考试时，按时复习很重要。",
    examplePinyin: "Zhunbei kaoshi shi, anshi fuxi hen zhongyao.",
    exampleVi: "Khi chuẩn bị thi, ôn tập đúng lịch rất quan trọng.",
  },
  {
    lesson: 5,
    hanzi: "标准",
    pinyin: "biaozhun",
    meaningVi: "tiêu chuẩn",
    meaningEn: "standard",
    partOfSpeech: "n.",
    exampleHan: "他按照新的标准修改了答案。",
    examplePinyin: "Ta an zhao xin de biaozhun xiugai le da'an.",
    exampleVi: "Anh ấy sửa đáp án theo tiêu chuẩn mới.",
  },
  {
    lesson: 7,
    hanzi: "擦",
    pinyin: "ca",
    meaningVi: "lau, chùi",
    meaningEn: "to wipe",
    partOfSpeech: "v.",
    exampleHan: "请把桌子擦干净。",
    examplePinyin: "Qing ba zhuozi ca ganjing.",
    exampleVi: "Hãy lau sạch cái bàn.",
  },
  {
    lesson: 10,
    hanzi: "幸福",
    pinyin: "xingfu",
    meaningVi: "hạnh phúc",
    meaningEn: "happiness",
    partOfSpeech: "adj./n.",
    exampleHan: "幸福不一定和钱有关。",
    examplePinyin: "Xingfu bu yiding he qian youguan.",
    exampleVi: "Hạnh phúc không nhất định liên quan đến tiền.",
  },
  {
    lesson: 11,
    hanzi: "表示",
    pinyin: "biaoshi",
    meaningVi: "biểu thị, bày tỏ",
    meaningEn: "to express",
    partOfSpeech: "v.",
    exampleHan: "这个词可以表示不同的意思。",
    examplePinyin: "Zhe ge ci keyi biaoshi butong de yisi.",
    exampleVi: "Từ này có thể biểu thị những ý nghĩa khác nhau.",
  },
  {
    lesson: 12,
    hanzi: "保护",
    pinyin: "baohu",
    meaningVi: "bảo vệ",
    meaningEn: "to protect",
    partOfSpeech: "v.",
    exampleHan: "我们应该保护自然环境。",
    examplePinyin: "Women yinggai baohu ziran huanjing.",
    exampleVi: "Chúng ta nên bảo vệ môi trường tự nhiên.",
  },
  {
    lesson: 16,
    hanzi: "报名",
    pinyin: "baoming",
    meaningVi: "đăng ký",
    meaningEn: "to sign up",
    partOfSpeech: "v.",
    exampleHan: "我已经报名参加HSK四级考试。",
    examplePinyin: "Wo yijing baoming canjia HSK siji kaoshi.",
    exampleVi: "Tôi đã đăng ký tham gia kỳ thi HSK4.",
  },
  {
    lesson: 18,
    hanzi: "安全",
    pinyin: "anquan",
    meaningVi: "an toàn",
    meaningEn: "safe",
    partOfSpeech: "adj.",
    exampleHan: "网上考试也要注意账号安全。",
    examplePinyin: "Wangshang kaoshi ye yao zhuyi zhanghao anquan.",
    exampleVi: "Thi trên máy tính cũng cần chú ý an toàn tài khoản.",
  },
];

export function createStarterItems(): VocabItem[] {
  return starterRows.map((row, index) => ({
    id: `starter-${row.lesson}-${row.hanzi}`,
    book: row.lesson <= 10 ? "4A" : "4B",
    lessonTitle: LESSON_TITLES[row.lesson] ?? `Bài ${row.lesson}`,
    order: index + 1,
    source: "Starter demo - thay bằng file giáo trình đã kiểm chứng",
    note: "Mẫu demo để thử app. Hãy import bộ dữ liệu đầy đủ trước khi học thật.",
    type: "Demo",
    ...row,
  }));
}

export function createInitialState(): AppState {
  const today = toDateKey();

  return {
    version: APP_STATE_VERSION,
    items: createExcelCourseItems(),
    attempts: [],
    reviews: {},
    settings: {
      displayName: "Hồng",
      avatarInitial: "H",
      startDate: today,
      dailyNewTarget: HSK4_REVIEW_POLICY.dailyNewTarget,
      dailyReviewTarget: HSK4_REVIEW_POLICY.dailyReviewTarget,
      selectedLesson: 1,
      locale: "vi",
      revealPinyin: true,
      revealMeaning: true,
      useEnglishFallback: false,
    },
    updatedAt: new Date().toISOString(),
  };
}
