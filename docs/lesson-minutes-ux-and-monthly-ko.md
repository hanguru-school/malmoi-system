# 레슨 시간 UX 개선·경고 흐름·월간 요약

## 목적

시간 원장과 잔여 계산이 갖춰진 뒤, **운영에서 빠르게 입력**하고, **학생에게는 장부가 아닌「受講の記録」**로 보이게 하며, **경고는 겹치지 않고 자연스럽게**, **관리자는 월 단위로 흐름을 한눈에** 보게 하는 단계입니다.

## 1. 관리자 시간 구매/추가 UX

### 동선（即時付与）

1. **学生詳細 → 「レッスン時間」タブ**（または `#lesson-time` / `#add-lessons`）
2. **即時付与**: **600 / 300 / 180分** を**ワンクリック**で確定 → 原簿 **charge**・メモ自動 `クイック付与 N分`（`purchase`）。
3. 別メモが必要なときは **下の欄へ** で分数だけ流し込み、**メモ** を書いて **レッスン時間のみ反映**。

詳細・부족 대응・월간・학생 유지の整理は **`docs/lesson-minutes-fast-ops-ko.md`** を参照。

### 롤백

- 即時付与・ハッシュスクロール・ヒーローボタンを外すと、従来の「フォーム補助のみ」に戻せます。

### 운영 주의

- 即時付与は**メモ自動**のため、監査上カスタム理由が必要な場合は **下の欄へ + 手動反映** を使います。

## 2. 학생 이용 내역画面（`/student/lesson-time`）

### 構成（日本語 UI）

- 冒頭の**やわらかい説明**（会計ではないこと）。
- **いま使える時間** + **次のレッスン後の目安**（数値で一行にまとめた説明）。
- **最近、レッスンで使った時間**（usage）→ **最近、増えた時間**（charge）の順（「使った」を先に）。
- タイムラインは**左アクセント色**で usage / charge を区別。

### 롤백

- `app/student/lesson-time/*` のレイアウトを旧版に戻す。

### 운영 주의

- 文言は**目安**であることをフッターで明示。

## 3. 잔여 시간 경고 흐름

### 基準（共通）

| 状態 | 条件 |
|------|------|
| 枯渇 | 残り ≤ 0 |
| 少なめ | 0 < 残り ≤ 180 |
| 次回不足 | 次の requested/confirmed の所要 > 残り |

### 学生

| 場所 | 出し方 |
|------|--------|
| **ホーム** | 上段バナー（danger/warn）+ 利用状況内は**重複ヒントを抑止**し、詳細は「レッスン時間」へ誘導する一行のみ。 |
| **利用内訳** | ヒーロー下に1本の注意文（tone 付き）。 |
| **予約（V2）** | 「予約する」タブ上部に**さりげない帯**（残り分 + 一文 + 記録ページリンク）。 |

### 管理者

| 場所 | 出し方 |
|------|--------|
| **学生一覧** | 既存の学習シグナル（`minutes_*` バッジ）。 |
| **学生詳細** | ヒーロー下の注意ブロック + レッスン時間タブ内の文脈に沿ったメッセージ。 |
| **ダッシュボード** | 「レッスン時間（要注意）」カード + 条件付き強調（既存）。 |

### 롤バック

- ホームの `lessonMinutesAttention === "ok"` ガードを外すと、バナーと利用状況のヒントが再び両方出ます。
- 予約帯 `lessonMinutesReserveHint` を JSX から削除。

### 운영 주의

- **同一内容を二重に出さない**方針（特にホーム）で、ユーザーの疲れを減らしています。

## 4. 관리자 월간 사용량 요약

### データ

- `getAdminLessonMinutesMonthSummary()` — **JST の当月 `YYYY-MM`** を既定。
- `lessonMinuteJournal` の `createdAt` を JST 月で集計:
  - **monthUsageMinutes** — `type === usage` の合計（絶対値）
  - **monthChargeMinutes** — `type === charge` の合計
  - **手動調整** — `manual_adjustment` の正負をそれぞれ合計
- **activeStudentCount** — 当該月に原簿に1件以上ある学生 ID のユニーク数。
- **depletedStudentCount** — 集計時点で残り ≤ 0 の学生数（原簿同期後）。

### 表示

- 管理ダッシュボード運営サマリー列に **「今月のレッスン時間（原簿・JST）」** カード（読み取り専用）。

### 롤백

- `getAdminLessonMinutesMonthSummary` とダッシュボードのカードを削除。
- ストアスキーマ変更なし。

### 운영 주의

- **会計上の売上・入金とは一致しません**（あくまで原簿ベースの運営指標）。
- 過去月の指定は `options.yearMonth` で拡張可能（現状ダッシュボードは当月のみ）。

## 関連コード

- `lib/auth/store.js` — `getAdminLessonMinutesMonthSummary`, `jstYearMonthFromIso`
- `app/admin/page.js` — 月間カード
- `app/admin/students/[id]/StudentEditForm.js` — クイック追加
- `app/student/lesson-time/page.js`, `lesson-time.module.css`
- `app/student/StudentDashboard.js` — ホームの重複抑止
- `features/reservations/ui/student/StudentReservationsApp.js` — 予約直前の帯

原簿仕様・安全装置は `docs/lesson-minutes-ledger-ko.md` / `docs/lesson-minutes-operations-ko.md` を参照してください。
