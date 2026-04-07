# 運用コアフロー：レッスンノート・宿題・先生画面

**対象:** malmoi-integrated（学生登録/予約 V2・既存 JSON ストア前提）  
**目的:** 予約 → 授業 → レッスンノート → 宿題の**導線**を揃え、先生の最小画面を実装する。

---

## 1. 先生：最小画面（実装）

### 目的

授業当日の進行と記録（ノート・宿題）に集中する。決済・全学生一括編集・システム設定は含めない。

### ルートと役割

| 画面 | パス | 内容 |
|------|------|------|
| ホーム | `/teacher` | KPI・ショートカット・宿題への補助リンク |
| 今日のレッスン | `/teacher/today` | 当日 JST の担当予約。各枠から **レッスンノート**・**宿題** へ |
| 予約一覧 | `/teacher/schedule` | 日付指定で担当予約（旧 `/teacher/lessons` は `/teacher/today` へリダイレクト） |
| レッスンノート | `/teacher/lesson-notes` | 既存 `AdminLessonNotesPanel`（API `/api/teacher/lesson-notes`） |
| 生徒メモ | `/teacher/students` | 検索・個別への導線（名称を「生徒メモ・検索」に） |
| お知らせ | `/teacher/notices` | 公開中お知らせ一覧（`listNoticesForStudent` と同データ源・閲覧専用） |
| お知らせ詳細 | `/teacher/notices/[id]` | `getNoticeByIdForStudent`（公開・有効のみ） |

### 主要動線

1. **今日のレッスン** → 各カード **レッスンノートへ**（`lessonUnitId` クエリ付き）  
2. 同カード **宿題** → `/teacher/homework?...`（既存）  
3. **予約一覧** で日付変更 → 同じカード UI  

### スタイル

- `app/teacher/teacher.module.css` — シェル・カード・ボタン（モバイル優先）

### ロールバック

- `app/teacher/TeacherTopNav.js` / `page.js` / `TeacherDayView.js` / `today` / `schedule` / `notices` / `lessons`（リダイレクト）を以前のコミットに戻す。  
- 旧ブックマーク `/teacher/lessons` は `/teacher/today` に飛ぶため、ナビだけ戻す場合はリダイレクト行を残す。

### 運用上の注意

- お知らせは**学生向け公開一覧と同じ**表示ロジック（教室運用で管理者にお知らせを載せる想定）。  
- 先生専用の追加フィールドは未実装。

---

## 2. レッスンノート：アクセス整理

### 先生

- **今日のレッスン / 予約一覧** の各枠 → `レッスンノートへ`（上記）  
- 一覧画面 `/teacher/lesson-notes` で作成・編集（既存）

### 学生

- **ホーム** のダッシュボード・ミニ導線（既存）  
- **レッスンノート一覧** `/student/lesson-notes`  
  - 冒頭: **最新のノートへ**（`#latest-lesson-note`）・**一覧へ**（`#all-lesson-notes`）・宿題・次のレッスン  
  - 先頭付近に `id="latest-lesson-note"`（スクロール用マーカー）  
  - 各カードは従来どおり `id="note-{id}"`

### 管理者

- **学生詳細** `StudentEditForm`：タブ「レッスンノート」・`/admin/lesson-notes?studentId=` へのボタン（既存のまま）

### ロールバック

- 学生ノートページの変更のみ戻す: `app/student/lesson-notes/page.js`

---

## 3. 宿題：学生ホームの基本構造（実装）

### 目的

学習分析より **未完了の見落とし防止** を優先。

### 画面 `/student/homework`

- **サマリ:** 未完了件数・提出・確認中件数  
- **レッスン関連のおすすめ:** レッスンノート（関連 ID があれば `#note-{id}`、なければ `#latest-lesson-note`）と次のレッスン  
- **未完了の宿題** — 提出前・未完了のみ  
- **提出済み（確認待ち）** — `submitted`  
- **最近完了した宿題** — `reviewed` / `completed`、新しい順・最大 8 件  

### ホームとの接続

- 宿題タイル → `/student/homework`（既存）  
- バナーに **最新のレッスンノート** / **すべてのノート** / **次のレッスン**

### ロールバック

- `StudentHomeworkPanel.js` / `homework/page.js` を戻す。

### 運用上の注意

- API・JSON 形式は変更していない（`listHomeworksForStudent` / PATCH 既存）。

---

## 4. 変更ファイル一覧（参照用）

| 種別 | ファイル |
|------|----------|
| 先生 | `app/teacher/teacher.module.css`, `TeacherDayView.js`, `TeacherTopNav.js`, `page.js`, `today/page.js`, `schedule/page.js`, `lessons/page.js`, `notices/page.js`, `notices/[id]/page.js`, `lesson-notes/page.js` |
| 学生 | `app/student/homework/StudentHomeworkPanel.js`, `homework/page.js`, `lesson-notes/page.js` |
| 文書 | `docs/ops-core-flows-lesson-homework-teacher.md`（本ファイル） |

---

## 5. ビルド

```bash
NEXT_PUBLIC_USE_STUDENT_REGISTRATION_UI_V2=true \
NEXT_PUBLIC_USE_RESERVATION_UI_V2=true \
npm run build
```

配布は既存 **releases / current** 手順。
