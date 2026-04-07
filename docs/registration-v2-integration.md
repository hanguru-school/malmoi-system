# 登録 V2・予約 V2 の運用連携（2026）

## 目的

メール経路・登録完了・管理画面で **V2 UI が途切れず**、既定の `NEXT_PUBLIC_*` と整合する。

## 1. メール verify → 登録 V2

- **変更なし**: トークン生成・`consumeLoginToken`・セッション Cookie・トークン 1 回限り。
- **store** `startStudentRegistration`: `next` は `registrationConsentPathWithDefaultUi()`（`NEXT_PUBLIC_USE_STUDENT_REGISTRATION_UI_V2=true` のとき `/student/register/consent?ui=v2`）。メール URL に `verifyLinkUiQuerySuffix()` で `&ui=v2` を追加（`next` に既に含まれる場合と併用可）。
- **`/api/auth/verify`**: 失敗時は `registrationStartPathWithError(reason)`（エラー＋既定 V2 なら `ui=v2`）。成功時は任意のクエリ `ui=v1|v2` を、リダイレクト先に `ui` が無いときだけ付与。

## 2. 同意 → プロフィール

- `registrationProfilePath(registrationUi)` で同意画面から **`ui` を維持**して `/student/register/profile` へ。

## 3. 登録完了 → 予約 V2

- `ProfileForm`: 完了後に「予約へ進む」「マイページへ」。予約 URL は `studentReservationHrefFromContext`、マイページは `studentMypageHrefAfterRegistration`（`?resUi=v2` 付きでホームへ）。連鎖時は `rememberReservationUiPreference('v2')`（`lib/student/reservationUiPreference.js`）。
- ホームのダッシュボード・予定カレンダー・メニュー「予約」は `studentReservationsPathFromBrowserPreference()` で **sessionStorage と env** を反映。

## 4. 管理・学生詳細の進捗

- `RegistrationProgressPanel` + `lib/adapters/registrationProgressView.js`（読み取り専用）。
- 表示: 登録開始 / 同意完了 / 基本情報入力完了 / 登録完了 / 最終更新日時。

## 5. 管理・予約 V2

- `app/admin/reservations/page.js` の feature flag 分岐は維持。実装は `features/reservations/ui/admin/AdminReservationsApp.js`（詳細は `docs/reservations-feature-v2.md`）。

## ロールバック

- 登録メールを V1 寄りに戻す: `NEXT_PUBLIC_USE_STUDENT_REGISTRATION_UI_V2=false` で再ビルド。既存トークンは保存済み `nextPath` を使用。
- 画面のみ: `?ui=v1`。
- verify の挙動を戻す場合: `app/api/auth/verify/route.js` を以前のリダイレクトのみに差し替え。

## 変更ファイル（主）

| ファイル | 内容 |
|----------|------|
| `lib/student/registrationNavPaths.js` | 同意/開始/verify 用パス、`verifyLinkUiQuerySuffix` |
| `lib/student/postRegistrationNav.js` | 登録完了後の予約 URL |
| `lib/adapters/registrationProgressView.js` | 管理向け進捗モデル |
| `lib/auth/store.js` | 登録メール URL の `next` と `&ui=v2` |
| `app/api/auth/verify/route.js` | エラー URL・成功時 `ui` マージ |
| `app/student/register/consent/page.js` / `profile/page.js` | `ui` 付きリダイレクト・props |
| `app/student/register/consent/ConsentForm*.js` | プロフィールへ `ui` 継承 |
| `app/student/register/profile/ProfileForm.js` | 完了画面・予約リンク |
| `app/admin/students/[id]/RegistrationProgressPanel.js` | 進捗パネル |

## サーバー反映

`npm run build` 後、既存の **releases / current** 手順で配布（本リポジトリから直接アップロードは行わない）。

## 運用検証チェックリスト（実務向け）

**順番付きの全体確認**は `docs/operations-v2-verification-checklist.md` を参照（学生 / 管理者 / JSON 保存）。

## IA（情報構造）草案

- 一覧: `docs/ia-roles-overview.md`
- 学生: `docs/ia-student-dashboard.md`
- 管理者: `docs/ia-admin-navigation.md`
- 先生: `docs/ia-teacher-area.md`
- 運用コア（レッスンノート・宿題・先生・韓国語）: `docs/ops-core-lesson-homework-teacher-ko.md`

## V2 を既定にする前の環境変数（例）

本番で V2 を既定にする場合、`.env` またはデプロイ環境に以下を設定してからビルドする。

```
NEXT_PUBLIC_USE_STUDENT_REGISTRATION_UI_V2=true
NEXT_PUBLIC_USE_RESERVATION_UI_V2=true
```

**テンプレート:** リポジトリの **`.env.production.example`** をコピーし、ドメイン等を置き換えてから `npm run build` する。

ローカル検証時も同様に設定して `npm run build` を通す。開発中は `false` のままでも、`?ui=v2` で画面単体確認可能。

## 変更ファイル・ロールバック（本ステップで追加したドキュメント）

| ファイル | 内容 |
|----------|------|
| `docs/operations-v2-verification-checklist.md` | 運用検証（学生・管理者・JSON） |
| `docs/ia-student-dashboard.md` | 学生メニュー・動線 IA |
| `docs/ia-admin-navigation.md` | 管理者ナビ IA |
| `docs/ia-teacher-minimal.md` | 先生エリア最小 IA（文書のみ） |
| `.env.production.example` | 本番 V2 既定フラグの例 |

**ロールバック:** ドキュメント差分は Git で戻す。アプリ挙動を戻す場合は環境変数を `false` にし、`docs/operations-v2-verification-checklist.md` 冒頭を参照。ホーム・ナビ UI は `StudentDashboard.js` / `AdminTopNav.js` を戻す。
