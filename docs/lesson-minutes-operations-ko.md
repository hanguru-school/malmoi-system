# 레슨 시간 운영 UI·학생 이용 내역·경고·안전장치

## 목적

시간 원장(`lessonMinuteJournal`)과 잔여 계산이 갖춰진 뒤, **실제 교실 운영에서 안전하게 다룰 수 있는 화면과 절차**를 제공합니다. 외부 결제 연동은 포함하지 않습니다.

## 관리자: 학생 상세「レッスン時間」タブ

### 위치

- 경로: **管理画面 → 学生詳細 → 「レッスン時間」タブ**
- 상단 히어로에 **残り時間の注意**（0以下 / 180分以下 / 次回不足）を表示。
- **「レッスン時間を編集」** チップで同タブへ誘導。

### 제공 기능（日本語 UI）

1. **時間を追加** — パッケージ選択または直接入力、`purchase` / `admin_grant` / `manual_adjustment`、**メモ（理由）必須**。
2. **時間を減算（手動）** — 予約完了の自動消費とは別。**メモ（理由）必須**。残りを超える分はサーバー側でキャップ。
3. **手動で増減** — `manual_adjustment` 相当。0 以外のとき**理由必須**。
4. **レッスン時間のみ反映** — 上記のみを PATCH。ページ下部の「保存」（プロフィール等）とは**分離**し、誤って時間だけ送らないようにする。
5. **最近の原簿・ログ** — charge / usage / manual_adjustment、`lessonMinuteLogs`、レガシー `lessonMinuteLedger`。

### 主要 API

- `PATCH /api/admin/students/[id]`  
  - `lessonMinutesCreditMinutes`, `lessonMinutesCreditPackageId`, `lessonMinutesCreditType`, `lessonMinutesCreditReason`  
  - `lessonMinutesDeductMinutes`, `lessonMinutesDeductReason`（減算メモ）  
  - `lessonMinutesAdjustMinutes`, `lessonMinutesAdjustReason`  
  - `lessonMinutesOperationId` — **UUID（クライアント生成）**。同一 ID の再送は**時間系ミューテーションをスキップ**（二重送信防止）。

検証エラー時は **400** と日本語 `error` メッセージ（例: 1回あたり分の上限超過）。

## 学生: 「レッスン時間・履歴」画面

### 위치

- パス: **`/student/lesson-time`**
- メニュー: **レッスン時間・履歴**
- ホーム: 残り時間に注意があるとき **バナー** + **詳しく見る**、メインタイル **レッスン時間**。

### 表示内容（日本語・受講記録トーン）

- 現在の残り分、次回レッスン後の目安（`buildLessonMinutesCompletionPreview`）。
- **最近ついた時間**（charge のみ、直近25件まで）。
- **最近使った時間**（usage のみ、直近25件まで）。
- 内部メモは出さず、`formatLessonMinuteJournalEntryForStudentPortal` で短文に整形。

### API（任意）

- `GET /api/student/lesson-minutes` — ログイン中学生の `getStudentLessonMinutesUsageForPortal` 結果（クライアント再取得用）。ページ本体は RSC でストアを直接呼び出し。

## 부족 경고 규칙

| 구분 | 조건 | 학생 UI | 관리자 |
|------|------|---------|--------|
| 枯渇 | 残り ≤ 0 | ホームバナー（danger）、履歴ページ alert | ヒーロー注意、学習シグナル `minutes_exhausted`、ダッシュボード「残り0以下」人数 |
| 少なめ | 0 < 残り ≤ 180 | ホームバナー（warn） | 同上、`minutes_low` |
| 次回不足 | 次の requested/confirmed の所要 > 残り | ホームバナー（warn）、プレビュー文 | ヒーロー注意、`minutes_will_run_out`、ダッシュボード「次回予約で不足」 |

ダッシュボードの「レッスン時間（要注意）」カードは、いずれかの人数が 1 以上のとき **視覚的に強調**（`opsSummaryCardAttention`）。

## 중복 차감·안전장치

### 予約完了時の usage

- 既存どおり: `journalHasUsageForReservation` + `lessonMinutesDeducted` で **同一予約の二重 usage を防止**。

### 管理画面の時間操作

1. **操作 ID（nonce）** — `processedLessonMinuteOpIds`（最大500件）に記録済みの `lessonMinutesOperationId` は、同一 PATCH 内の付与・減算・手動調整を**実行しない**（ネットワーク再送の二重適用を抑止）。
2. **1回あたりの絶対値上限** — `LESSON_MINUTES_ADMIN_MAX_ABS_DELTA`（既定 10080 分 ≒ 7 日相当、環境変数で変更可）。超過は **エラー**。
3. **減算のキャップ** — `applyStudentLessonMinuteDebit` は残りを超えない。超えようとした場合は **`student.lesson_minutes_admin_deduct_capped`** 監査ログ。
4. **大きな分数** — 3000 分以上の付与・減算・手動調整で **追加監査** `student.lesson_minutes_large_operation`。
5. **手動減算の監査** — `student.lesson_minutes_debited` の `meta.sourceAdminPanel`、`requestedMinutes` / `appliedMinutes`。

### 되돌리기 어려운 자동 처리

- 残りをマイナスに落とす自動処理は行わない（原簿集計も `max(0, …)`）。超過分の「不足」は shortfall 系の監査で可視化（既存の完了時ロジック）。

## 롤백 방법

1. **UI のみ戻す** — 「レッスン時間」タブ・学生 `/student/lesson-time` を削除または非表示にする（Git で該当コミットを戻す）。
2. **nonce 配列** — `processedLessonMinuteOpIds` をストア JSON から削除すると重複防止が無効になる（通常は残す）。
3. **上限・監査** — `LESSON_MINUTES_ADMIN_MAX_ABS_DELTA` や監査アクションを取り除く場合はコードを巻き戻す。

## 운영 주의점

- **「レッスン時間のみ反映」** と **ページ下部の保存** を混同しないようスタッフ教育する。
- 手動減算は **理由必須**。会計調整とレッスン記録の説明責任を分ける。
- 学生画面は **目安** と明記し、紛争時は原簿・監査ログを正とする。

## 관련 코드

- `lib/auth/store.js` — `updateStudentByAdmin`（時間 PATCH・nonce）、`getStudentLessonMinutesUsageForPortal`、`applyStudentLessonMinuteDebit`（キャップ監査）、`buildRiskBadgesForStudent`
- `lib/adapters/lessonMinutesSummary.js` — `formatLessonMinuteJournalEntryForStudentPortal`
- `app/admin/students/[id]/StudentEditForm.js`
- `app/student/lesson-time/page.js`, `StudentDashboard.js`, `StudentAreaLayout.js`
- `app/api/student/lesson-minutes/route.js`, `app/api/admin/students/[id]/route.js`

既存の原簿・計算の詳細は `docs/lesson-minutes-ledger-ko.md` を参照してください。
