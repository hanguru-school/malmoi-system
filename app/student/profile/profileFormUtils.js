/** 携帯・固定（日韓よく使う桁）向け：数字だけでもハイフン表示 */
export function formatPhoneInput(input) {
  const d = String(input || "")
    .replace(/\D/g, "")
    .slice(0, 15);
  if (!d) return "";

  // 韓国 010 / 011 など
  if (d.startsWith("010") || d.startsWith("011")) {
    if (d.length <= 3) return d;
    if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
  }
  if (/^01[016789]/.test(d) && d.length <= 11) {
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
    if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
  }

  // 日本 11 桁（090/080/070/050/060 など）
  if (d.length === 11 && d[0] === "0" && /^0[56789]0/.test(d.slice(0, 3))) {
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  }
  if (d.length >= 4 && /^0[56789]0/.test(d.slice(0, 3))) {
    if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
  }

  // 日本 10 桁（市外局番）
  if (d.length === 10 && d[0] === "0") {
    if (d[1] === "3" || d[1] === "6") {
      return `${d.slice(0, 2)}-${d.slice(2, 6)}-${d.slice(6)}`;
    }
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  }

  // 11 桁 0 始まり（汎用 3-4-4）
  if (d.length === 11 && d[0] === "0") {
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  }

  // 入力途中
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length <= 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}-${d.slice(11)}`;
}

/** 続柄（緊急連絡先） */
export const EMERGENCY_RELATION_PRESETS = [
  { value: "夫", label: "夫" },
  { value: "妻", label: "妻" },
  { value: "父", label: "父" },
  { value: "母", label: "母" },
  { value: "祖母", label: "祖母" },
  { value: "祖父", label: "祖父" },
  { value: "その他", label: "その他" },
];

const OTHER_PREFIX = "その他:";

/**
 * 続柄・氏名を編集用に分解。
 * 旧実装で「続柄」が氏名欄に入っていたデータは、続柄プリセットへ移す。
 */
export function parseEmergencyRelation(relationStored, nameStored, furiganaStored) {
  const rel = String(relationStored || "").trim();
  const name = String(nameStored || "").trim();
  const furigana = String(furiganaStored || "").trim();
  const simple = ["夫", "妻", "父", "母", "祖母", "祖父"];

  if (rel.startsWith(OTHER_PREFIX)) {
    return {
      preset: "その他",
      otherText: rel.slice(OTHER_PREFIX.length).trim(),
      nameKanji: name,
      nameFurigana: furigana,
    };
  }
  if (rel === "その他") {
    return { preset: "その他", otherText: "", nameKanji: name, nameFurigana: furigana };
  }
  if (simple.includes(rel)) {
    return { preset: rel, otherText: "", nameKanji: name, nameFurigana: furigana };
  }

  // 旧データ: 続柄が氏名欄にのみ保存されていた
  if (!rel && simple.includes(name)) {
    return { preset: name, otherText: "", nameKanji: "", nameFurigana: furigana };
  }
  if (!rel && name === "その他") {
    return { preset: "その他", otherText: "", nameKanji: "", nameFurigana: furigana };
  }
  if (!rel && name.startsWith(OTHER_PREFIX)) {
    return {
      preset: "その他",
      otherText: name.slice(OTHER_PREFIX.length).trim(),
      nameKanji: "",
      nameFurigana: furigana,
    };
  }

  return { preset: rel || "", otherText: "", nameKanji: name, nameFurigana: furigana };
}

export function emergencyRelationToStore(preset, otherText) {
  if (!preset) return "";
  if (preset === "その他") {
    const t = String(otherText || "").trim();
    return t ? `${OTHER_PREFIX}${t}` : "その他";
  }
  return preset;
}

/** 一覧表示用（続柄） */
export function displayEmergencyRelation(stored) {
  const s = String(stored || "").trim();
  if (!s) return "";
  if (s.startsWith(OTHER_PREFIX)) {
    const rest = s.slice(OTHER_PREFIX.length).trim();
    return rest ? `その他（${rest}）` : "その他";
  }
  return s;
}

export const DEFAULT_BIRTH_DATE = "1990-01-01";
