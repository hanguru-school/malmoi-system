"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAdminStudentsSearch } from "../../adapters/adminReservationsAdapter";
import wz from "./admin-reservation-wizard.module.css";

function studentLabel(s) {
  const num = s.studentNumber ? ` #${s.studentNumber}` : "";
  return `${s.nameKanji || "—"}${num}`;
}

export default function StudentSearchField({
  selected = null,
  onSelect,
  recentList = [],
  pinnedIds = [],
  onTogglePin,
}) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    const t = setTimeout(async () => {
      const qq = String(q || "").trim();
      if (qq.length < 1) {
        setResults([]);
        return;
      }
      setLoading(true);
      setErr("");
      try {
        const data = await fetchAdminStudentsSearch(qq, 80);
        setResults(data.students || []);
      } catch (e) {
        setErr(e.message || "検索エラー");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  const pinnedSet = useMemo(() => new Set((pinnedIds || []).map(String)), [pinnedIds]);

  return (
    <div className={wz.searchField}>
      <label className={wz.searchLabel}>氏名・フリガナ・学生番号・電話の一部</label>
      <input
        className={wz.searchInput}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="例: 田中 / タナカ / 0012 / 090"
        autoComplete="off"
      />
      {loading ? <p className={wz.muted}>検索中…</p> : null}
      {err ? <p className={wz.err}>{err}</p> : null}

      {recentList.length > 0 && !q.trim() ? (
        <div className={wz.suggestBlock}>
          <p className={wz.suggestTitle}>最近・ピン</p>
          <ul className={wz.suggestList}>
            {recentList.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={wz.suggestBtn}
                  data-active={selected?.id === s.id ? "1" : "0"}
                  onClick={() => onSelect(s)}
                >
                  <span>{studentLabel(s)}</span>
                  <span className={wz.remain}>
                    残り {Math.max(0, Number(s.lessonMinutes?.remainingMinutes ?? 0))} 分
                  </span>
                </button>
                {typeof onTogglePin === "function" ? (
                  <button
                    type="button"
                    className={wz.pinBtn}
                    aria-label={pinnedSet.has(String(s.id)) ? "ピン解除" : "ピン"}
                    onClick={() => onTogglePin(s.id)}
                  >
                    {pinnedSet.has(String(s.id)) ? "★" : "☆"}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {results.length > 0 ? (
        <ul className={wz.suggestList}>
          {results.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className={wz.suggestBtn}
                data-active={selected?.id === s.id ? "1" : "0"}
                onClick={() => {
                  onSelect(s);
                  setQ("");
                  setResults([]);
                }}
              >
                <span>{studentLabel(s)}</span>
                <span className={wz.furigana}>{s.nameFurigana || ""}</span>
                <span className={wz.remain}>
                  残り {Math.max(0, Number(s.lessonMinutes?.remainingMinutes ?? 0))} 分
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
