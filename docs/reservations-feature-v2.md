# 予約機能 V2（features/reservations）

## 概要

- **学生** `/student/reservations`（`NEXT_PUBLIC_USE_RESERVATION_UI_V2` または `?ui=v2`）  
  4 ステップ: 日付 → 時間 → 内容確認 → 予約完了。確認は画面内（モーダル廃止）。タブ: 予約する / 予約一覧 / キャンセル・変更。
- **管理** `/admin/reservations`（同フラグ）  
  上段フィルター、一覧＋右ペイン詳細（幅 960px 以上）、狭い画面は従来どおりドロワー。レッスン形式（対面／オンライン）はクライアント側フィルター。

## ディレクトリ

| パス | 役割 |
|------|------|
| `features/reservations/ui/student/StudentReservationsApp.js` | 学生 UI |
| `features/reservations/ui/admin/AdminReservationsApp.js` | 管理 UI |
| `features/reservations/adapters/studentReservationsAdapter.js` | 学生 API＋ペイロード（既存契約） |
| `features/reservations/adapters/adminReservationsAdapter.js` | 管理 API ラッパー |
| `features/reservations/logic/auditReservationEvents.js` | audit action 名の参照用定数 |
| `app/*/reservations/*PanelV2.js` | `features` への re-export のみ |

## 変更しないもの

- `AUTH_STORE_PATH`、JSON ストア上の `reservations` / `reservationSlots` / `auditLogs` の根本構造
- セッション・ロール・既存 API ルート（`/api/student/reservations` 等）
- `current` → `releases` デプロイ手順（コードは従来どおりビルド成果物を配置）

## Audit log（予約関連）

`lib/auth/store.js` で記録。主な action:

| action | 内容 |
|--------|------|
| `reservation.created` | 学生による作成など |
| `reservation.updated` | 予約更新の汎用ログ |
| `reservation.cancelled` | キャンセル |
| `reservation.completed` | 状態が **完了** へ遷移したとき（管理者 PATCH） |
| `reservation.slot_opened` | 枠を **open** に変更したとき |
| `reservation.slot_closed` | 枠を **closed** に変更したとき |

既存の `reservation.slot_updated`、学生・管理者別の補助 action は引き続き残る。

## ロールバック

1. **UI のみ V1 に戻す**  
   環境変数 `NEXT_PUBLIC_USE_RESERVATION_UI_V2=false` にし、再ビルド・再起動。  
   または URL に `?ui=v1`。
2. **コードを戻す**  
   `app/student/reservations/StudentReservationsPanelV2.js` と `app/admin/reservations/AdminReservationsPanelV2.js` が re-export のため、`features/reservations` を削除・差し替えする場合はこの 2 ファイルを以前の実装に戻す。

## ビルド・サーバー反映

```bash
cd malmoi-integrated
npm run build
```

生成された `.next` および必要な静的ファイルを、運用中の **releases 配下** へ従来の手順（`current` の切替、プロセス再起動）で配置する。FTP/SSH の有無は環境依存のため、既存の `admin/` 手順に従う。

---

## 運用検証チェックリスト（リリース前／定期）

以下は **JSON ストア**（`AUTH_STORE_PATH` の `auth-store.json`）と **auditLogs** を前提とする。バックアップ取得後、検証環境で実施すること。

### 学生側（`/student/reservations`、`?ui=v2` または `NEXT_PUBLIC_USE_RESERVATION_UI_V2=true`）

| # | 操作 | 確認する保存・API |
|---|------|-------------------|
| 1 | 予約を新規作成（日付→時間→確認→送信） | `store.reservations` に 1 件追加。`POST /api/student/reservations` が 200、`reservation.created` が audit に出ること |
| 2 | 予約一覧タブで直前の予約が表示される | `GET /api/student/reservations` の `reservations` に該当 `id` |
| 3 | 変更可能な予約でスロット変更 | 同一 `id` の `slotId`/`date`/`time` が更新。`reservation.updated` |
| 4 | キャンセル可能な予約をキャンセル | 該当の `status` が `cancelled`。`reservation.cancelled` |
| 5 | 登録完了後「予約へ進む」→ 予約 V2 画面 | URL に `?ui=v2`、メニュー「予約」も同経路（`sessionStorage` + env 参照 `lib/student/reservationUiPreference.js`） |

### 管理側（`/admin/reservations`、V2）

| # | 操作 | 確認する保存・API |
|---|------|-------------------|
| 6 | 日付・状態・学生検索・レッスン形式フィルター | 一覧が絞り込まれる（対面/オンラインはクライアント側。`GET /api/admin/reservations` の結果に対応） |
| 7 | 承認待ちを `confirmed` に変更 | `reservations[].status` と `reservation.updated` |
| 8 | `confirmed` を `completed` に変更 | `status` が `completed`。`reservation.completed` と `reservation.updated` |
| 9 | スロットを閉じる／開く | 対象 `reservationSlots[].status` が `closed`/`open`。`reservation.slot_closed` / `reservation.slot_opened`（併せて `reservation.slot_updated` あり） |

### auditLogs で確認する action（抜粋）

- `reservation.created` / `reservation.updated` / `reservation.cancelled` / `reservation.completed`
- `reservation.slot_opened` / `reservation.slot_closed`
- 学生登録連携: `student.registration_started` / `student.consent_agreed` / `student.profile_updated`（管理の進捗パネル「記録」時刻と照合可）

### ロールバック確認

- `?ui=v1` で学生・管理の予約 UI が V1 に切り替わること
- `NEXT_PUBLIC_USE_RESERVATION_UI_V2=false` で再ビルド後、既定が V1 になること

### 参照パス（運用）

- ストア実体: 環境変数 `AUTH_STORE_PATH`（未設定時はプロジェクト直下 `.data/auth-store.json` の例あり）
- 予約配列: `reservations`
- 枠: `reservationSlots`
- 監査: `auditLogs`（末尾トリムあり。件数上限 `AUTH_AUDIT_LOG_LIMIT`）
