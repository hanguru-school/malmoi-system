/**
 * 先生向けレッスンノート作成の補助（クライアントのみ・JSON スキーマは変更しない）
 */

export const RECENT_PHRASES_KEY = "malmoi:lessonNote:recentSummaryLines:v1";
export const MAX_RECENT = 8;

/** ブラウザのローカル日付 (YYYY-MM-DD) */
export function localTodayYmd() {
  if (typeof window === "undefined") return "";
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 定型テンプレ（日本語・上書き用） */
/** ワンタップで要約／次回計画に追記する学習ポイント（JSON スキーマ変更なし） */
export const TEACHER_POINT_SNIPPETS = [
  {
    id: "pronunciation",
    label: "発音",
    summaryLine: "【発音】ゆっくりはっきり発音する練習を行いました。",
    nextLine: "次回: 発音の定着（ミスしやすい音の再確認）。",
  },
  {
    id: "particle",
    label: "助詞",
    summaryLine: "【助詞】使い分け・文脈に合う形を練習しました。",
    nextLine: "次回: 助詞の復習と短文での運用。",
  },
  {
    id: "ending",
    label: "語尾",
    summaryLine: "【語尾】丁寧さ・ニュアンスを意識して練習しました。",
    nextLine: "次回: 語尾の統一と会話での適用。",
  },
  {
    id: "conversation",
    label: "会話練習",
    summaryLine: "【会話】会話練習を中心に進めました。",
    nextLine: "次回: 会話の流れを途切れさせない練習。",
  },
  {
    id: "review_needed",
    label: "復習必要",
    summaryLine: "【復習】前回の内容の再確認が必要です。",
    nextLine: "次回: 復習を優先してから新出へ。",
  },
  {
    id: "homework_check",
    label: "宿題確認",
    summaryLine: "【宿題】提出状況を確認し、不足点をフォローしました。",
    nextLine: "次回: 宿題の定着確認。",
  },
];

export const TEACHER_QUICK_TEMPLATES = [
  {
    id: "structure",
    label: "構成ベース",
    patch: {
      title: "レッスン記録",
      summary: "【本日の内容】\n",
      content: "■ 新出語句・表現\n■ 復習\n■ 演習の様子\n",
      homeworkSummary: "宿題: ",
      nextLessonPlan: "次回予定: ",
    },
  },
  {
    id: "review",
    label: "復習中心",
    patch: {
      title: "復習レッスン",
      summary: "【復習テーマ】\n",
      content: "■ 前回のおさらい\n■ 練習内容\n■ 理解度\n",
      homeworkSummary: "宿題（復習）: ",
      nextLessonPlan: "次回: ",
    },
  },
  {
    id: "mini",
    label: "ミニ",
    patch: {
      title: "レッスン",
      summary: "本日: ",
      content: "",
      homeworkSummary: "",
      nextLessonPlan: "",
    },
  },
];

export function getRecentPhrases() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_PHRASES_KEY);
    const arr = JSON.parse(raw || "[]");
    if (!Array.isArray(arr)) return [];
    return arr.filter((s) => typeof s === "string" && s.trim().length > 0).slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

export function pushRecentPhrase(summaryLine) {
  const line = String(summaryLine || "").trim().replace(/\n+/g, " ");
  if (line.length < 3 || line.length > 220) return;
  if (typeof window === "undefined") return;
  try {
    const prev = getRecentPhrases().filter((s) => s !== line);
    const next = [line, ...prev].slice(0, MAX_RECENT);
    window.localStorage.setItem(RECENT_PHRASES_KEY, JSON.stringify(next));
  } catch {
    // ignore quota
  }
}

export function buildTeacherHomeworkHref({ lessonUnitId, studentIds, date }) {
  const sid = String(studentIds || "")
    .split(",")[0]
    ?.trim();
  const qs = new URLSearchParams();
  if (lessonUnitId) qs.set("lessonUnitId", lessonUnitId);
  if (sid) qs.set("studentId", sid);
  if (date) qs.set("lessonDate", String(date).slice(0, 10));
  const q = qs.toString();
  return q ? `/teacher/homework?${q}` : "/teacher/homework";
}
