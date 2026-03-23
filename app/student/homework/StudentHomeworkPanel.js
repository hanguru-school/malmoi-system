"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "../../login/login.module.css";

function homeworkIsDone(status) {
  return status === "reviewed" || status === "completed";
}

function statusMeta(status) {
  if (homeworkIsDone(status)) return { label: "完了", tone: "completed" };
  if (status === "submitted") return { label: "提出済み", tone: "scheduled" };
  return { label: "未完了", tone: "pending" };
}

function statusClass(tone) {
  if (tone === "pending") return styles.reservationStatusPending;
  if (tone === "confirmed") return styles.reservationStatusConfirmed;
  if (tone === "completed") return styles.reservationStatusCompleted;
  if (tone === "attended") return styles.reservationStatusAttended;
  return styles.reservationStatusScheduled;
}

function typeLabel(type) {
  if (type === "vocabulary") return "単語";
  if (type === "grammar") return "文法";
  if (type === "writing") return "作文";
  if (type === "conversation") return "会話練習";
  if (type === "pronunciation") return "発音練習";
  if (type === "reading") return "読解";
  if (type === "listening") return "聞き取り";
  return "自由課題";
}

export default function StudentHomeworkPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [openedId, setOpenedId] = useState("");
  const [memoDraftById, setMemoDraftById] = useState({});

  const summary = useMemo(() => {
    const pending = items.filter((item) => !homeworkIsDone(item.status) && item.status !== "submitted").length;
    const submitted = items.filter((item) => item.status === "submitted").length;
    return { pending, submitted, recent: items.slice(0, 3) };
  }, [items]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/student/homework");
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "宿題の取得に失敗しました。");
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || "宿題の取得中にエラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function patchHomework(id, patch) {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/student/homework/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "更新に失敗しました。");
      await load();
    } catch (err) {
      setError(err.message || "更新中にエラーが発生しました。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <p className={styles.summaryLabel}>未完了の宿題</p>
          <p className={styles.summaryValue}>{summary.pending}件</p>
        </article>
        <article className={styles.summaryCard}>
          <p className={styles.summaryLabel}>提出待ち・確認中</p>
          <p className={styles.summaryValue}>{summary.submitted}件</p>
        </article>
      </section>

      {loading ? <p>読み込み中...</p> : null}
      {error ? <p className={`${styles.message} ${styles.messageError}`}>{error}</p> : null}

      <div className={styles.links}>
        {items.map((item) => {
          const meta = statusMeta(item.status);
          const opened = openedId === item.id;
          const done = homeworkIsDone(item.status);
          return (
            <article
              key={item.id}
              className={styles.reservationCard}
              style={{
                opacity: done ? 0.72 : 1,
                filter: done ? "grayscale(0.12)" : "none",
                borderColor: done ? "#e2e8f0" : "#fed7aa",
              }}
            >
              <div className={styles.reservationCardHead}>
                <p className={styles.reservationDate}>{item.title}</p>
                <p className={styles.reservationTime}>{item.dueDate ? `期限 ${item.dueDate}` : "期限なし"}</p>
                <span className={`${styles.reservationStatusBadge} ${statusClass(meta.tone)}`}>{meta.label}</span>
              </div>
              <div className={styles.reservationMeta}>
                <p>種類: {typeLabel(item.type)}</p>
              </div>
              <div className={styles.reservationActions}>
                <Link className={styles.link} href={`/student/homework/${item.id}`}>
                  宿題を見る
                </Link>
                <button className={styles.button} type="button" onClick={() => setOpenedId(opened ? "" : item.id)}>
                  {opened ? "閉じる" : "内容を見る"}
                </button>
                {!done ? (
                  <button
                    className={styles.button}
                    type="button"
                    disabled={saving}
                    onClick={() => patchHomework(item.id, { status: "submitted" })}
                  >
                    完了（提出）
                  </button>
                ) : null}
              </div>
              {opened ? (
                <>
                  <div className={styles.reservationMeta}>
                    <p>内容: {item.description || "-"}</p>
                    {item.teacherMemo ? <p>先生メモ: {item.teacherMemo}</p> : null}
                    <p>自分のメモ: {item.studentMemo || "-"}</p>
                  </div>
                  <label className={styles.label}>
                    提出コメント
                    <textarea
                      className={styles.field}
                      rows={3}
                      value={memoDraftById[item.id] ?? item.studentMemo ?? ""}
                      onChange={(e) =>
                        setMemoDraftById((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                    />
                  </label>
                  <button
                    className={styles.button}
                    type="button"
                    disabled={saving}
                    onClick={() => patchHomework(item.id, { studentMemo: memoDraftById[item.id] ?? item.studentMemo ?? "" })}
                  >
                    コメント保存
                  </button>
                </>
              ) : null}
            </article>
          );
        })}
        {!loading && items.length === 0 ? <p>現在表示できる宿題はありません。</p> : null}
      </div>
    </>
  );
}
