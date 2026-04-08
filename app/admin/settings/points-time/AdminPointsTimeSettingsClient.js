"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  POINTS_PER_MINUTE,
  POINTS_PER_YEN,
  POINTS_POLICY_SUMMARY_JA,
  pointsForMinutes,
} from "../../../../lib/operational/pointsPolicy.js";
import styles from "./points-time-admin.module.css";

const DURATIONS = [20, 30, 40, 45, 60, 90, 120];

export default function AdminPointsTimeSettingsClient() {
  const [minutes, setMinutes] = useState(60);
  const pts = useMemo(() => pointsForMinutes(minutes), [minutes]);

  return (
    <div className={styles.wrap}>
      <div className={styles.grid}>
        <section className={styles.card}>
          <h3>A. 基本換算</h3>
          <p>{POINTS_POLICY_SUMMARY_JA}</p>
          <p className={styles.previewOut} style={{ marginTop: "0.65rem" }}>
            <span className={styles.mono}>1 円 = {POINTS_PER_YEN} ポイント</span>
            <br />
            <span className={styles.mono}>1 分 = {POINTS_PER_MINUTE} ポイント</span>
          </p>
        </section>

        <section className={styles.card}>
          <h3>B. レッスン所要時間 → ポイント（換算プレビュー）</h3>
          <p>レッスン設定の「所要時間（分）」に応じた消費ポイントの目安です（別途レッスン単位で上書きする場合はそちらが優先されます）。</p>
          <div className={styles.previewRow}>
            <label htmlFor="pt-preview-min">所要時間</label>
            <select
              id="pt-preview-min"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            >
              {DURATIONS.map((m) => (
                <option key={m} value={m}>
                  {m} 分
                </option>
              ))}
            </select>
          </div>
          <p className={styles.previewOut}>
            約 <span className={styles.mono}>{pts}</span> ポイント（{minutes} × {POINTS_PER_MINUTE}）
          </p>
          <ul className={styles.links} style={{ marginTop: "0.5rem", listStyle: "none", padding: 0 }}>
            {[20, 40, 60, 90].map((m) => (
              <li key={m} className={styles.mono}>
                {m}分 ≈ {pointsForMinutes(m)}pt
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.card}>
          <h3>C. 購入ポリシー</h3>
          <p>価格テンプレ・特典ポイントは決済ルールと紐づきます。実際の付与は決済記録（finalPoints）を参照してください。</p>
          <div className={styles.links}>
            <Link href="/admin/payments">決済管理</Link>
            <Link href="/admin/settings/payments-usage?t=payment">支払い・利用時間（支払い方針）</Link>
          </div>
        </section>

        <section className={styles.card}>
          <h3>D. 減算・消費ルール</h3>
          <p>受講完了時のレッスン時間減算と、ポイント利用の扱いは教室運用に合わせて記録されます。ルールの編集はレッスン・サービス設定と原簿連動を確認してください。</p>
          <div className={styles.links}>
            <Link href="/admin/settings/lesson-services">レッスン・サービス</Link>
            <Link href="/admin/settings/payments-usage?t=lesson">利用時間・共通レッスン</Link>
          </div>
        </section>

        <section className={styles.card}>
          <h3>E. 表示方針</h3>
          <p>学生ポータルでは、マイページは時間のみ、本ページの方針に沿って「レッスン時間・利用状況」でポイントを併記します。</p>
        </section>

        <section className={styles.card}>
          <h3>F. 手動調整</h3>
          <p>残り時間・ポイントの手当は管理画面の学生詳細・決済操作から行います（監査のため必ず理由を残してください）。</p>
          <div className={styles.links}>
            <Link href="/admin/students">学生一覧</Link>
          </div>
        </section>

        <section className={styles.card} style={{ gridColumn: "1 / -1" }}>
          <h3>G. 変更履歴</h3>
          <p>システム設定ログは「システム・ログ」や各設定画面の履歴から確認してください。</p>
          <div className={styles.links}>
            <Link href="/admin/settings/system">システム・ログ</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
