/**
 * 宿題のクイック入力（クライアント補助・API/JSON スキーマは変更しない）
 */

export const HW_PREFILL_FROM_NOTE_KEY = "malmoi:hwPrefillFromNote:v1";
export const RECENT_HW_KEY = "malmoi:homework:recentQuickEntries:v1";
export const MAX_RECENT_HW = 6;

/** ボタン1つでタイトル・内容・種類を入れるプリセット（日本語） */
export const HW_QUICK_PRESETS = [
  {
    id: "vocab",
    title: "語彙チェック",
    description: "教科書の語彙を音読し、意味を口頭で確認する。",
    type: "vocabulary",
  },
  {
    id: "grammar",
    title: "文法の整理",
    description: "今日の文法ポイントをノートにまとめ、例文を3つ作る。",
    type: "grammar",
  },
  {
    id: "pron",
    title: "発音練習",
    description: "録音または音読で、区別しづらい音を繰り返し練習する。",
    type: "pronunciation",
  },
  {
    id: "conv",
    title: "会話練習",
    description: "今日の表現を使い、指定のシチュエーションで会話する。",
    type: "conversation",
  },
  {
    id: "listening",
    title: "聞き取り",
    description: "教材の音声を1回聞き、内容を日本語で要約する。",
    type: "listening",
  },
  {
    id: "free_review",
    title: "復習（自由）",
    description: "前回のノートを見直し、不明点を次回までに質問リスト化する。",
    type: "free",
  },
];

/** レッスン日から提出期限（既定 +7 日） */
export function defaultDueDateFromLessonYmd(lessonYmd) {
  const y = String(lessonYmd || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(y)) return "";
  const d = new Date(`${y}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

export function guessHomeworkTypeFromText(text) {
  const t = String(text || "");
  if (/発音|発音練習/i.test(t)) return "pronunciation";
  if (/会話|ロールプレイ/i.test(t)) return "conversation";
  if (/聞き取り|リスニング/i.test(t)) return "listening";
  if (/読解|読み|音読/i.test(t)) return "reading";
  if (/文法|grammar|助詞|語尾/i.test(t)) return "grammar";
  if (/単語|語彙/i.test(t)) return "vocabulary";
  if (/作文|ライティング/i.test(t)) return "writing";
  return "free";
}

/**
 * レッスンノート保存直前のフォームから宿題フォーム用プリフィルを生成
 * @param {object} form AdminLessonNotesPanel の form
 */
export function buildHomeworkPrefillFromNoteForm(form) {
  const studentId = String(form?.studentIds || "")
    .split(",")[0]
    ?.trim();
  const hw = String(form?.homeworkSummary || "").trim();
  const summ = String(form?.summary || "").trim();
  const desc = hw || summ;
  const firstLine = (hw || summ).split("\n")[0].trim().slice(0, 72);
  const title = firstLine ? `宿題: ${firstLine}` : `宿題 (${String(form?.date || "").slice(0, 10) || "—"})`;
  const lessonYmd = String(form?.date || "").slice(0, 10);
  const dueDate = defaultDueDateFromLessonYmd(lessonYmd);
  return {
    v: 1,
    studentId,
    lessonUnitId: String(form?.lessonUnitId || "").trim(),
    lessonDate: lessonYmd,
    dueDate,
    title,
    description: desc || "（レッスンノートの要約・宿題要約を確認してください）",
    type: guessHomeworkTypeFromText(desc || summ),
    ts: Date.now(),
  };
}

export function getRecentQuickHomeworks() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_HW_KEY);
    const arr = JSON.parse(raw || "[]");
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((x) => x && typeof x.title === "string" && typeof x.description === "string")
      .slice(0, MAX_RECENT_HW);
  } catch {
    return [];
  }
}

export function pushRecentQuickHomework(entry) {
  const title = String(entry?.title || "").trim();
  const description = String(entry?.description || "").trim();
  if (title.length < 2 || description.length < 2) return;
  if (typeof window === "undefined") return;
  try {
    const prev = getRecentQuickHomeworks().filter(
      (x) => !(x.title === title && x.description === description)
    );
    const row = { title, description, type: String(entry?.type || "free") };
    const next = [row, ...prev].slice(0, MAX_RECENT_HW);
    window.localStorage.setItem(RECENT_HW_KEY, JSON.stringify(next));
  } catch {
    // ignore quota
  }
}
