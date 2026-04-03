# 予約 UI V2（機能保全型リニューアル）

## 概要

- **保存**: `auth-store.json` の `reservations` / `reservationSlots` 等、既存フィールド・API 応答形式は維持。
- **API**: `/api/student/reservations` ほか既存ルートのみ利用。ペイロードは `lib/student/reservationUiAdapter.js` で画面用に組み立て。
- **旧 UI**: コンポーネントを置き換えず、`StudentReservationsPanel` / `AdminReservationsPanel` をそのまま残す。

## 切替（feature flag）

| 方法 | 動作 |
|------|------|
| 環境変数 `NEXT_PUBLIC_USE_RESERVATION_UI_V2=true` | 学生 `/student/reservations`・管理者 `/admin/reservations` の**既定**を V2 に |
| `?ui=v2` | そのリクエストのみ V2 強制 |
| `?ui=v1` | そのリクエストのみ V1 強制（ロールバック用） |

優先順位: `ui=v1` > `ui=v2` > 環境変数。

## 追加・変更ファイル

| ファイル | 内容 |
|----------|------|
| `lib/reservations/reservationUiFlags.js` | フラグ解決 |
| `lib/student/reservationUiAdapter.js` | 学生側表示・POST ペイロード整形 |
| `app/student/reservations/StudentReservationsPanelV2.js` | 学生 V2 UI |
| `app/student/reservations/student-reservations-v2.module.css` | 学生 V2 スタイル |
| `app/admin/reservations/AdminReservationsPanelV2.js` | 管理者 V2 UI |
| `app/admin/reservations/admin-reservations-v2.module.css` | 管理者 V2 スタイル |
| `app/student/reservations/page.js` | V1/V2 振分 |
| `app/admin/reservations/page.js` | V1/V2 振分 |
| `lib/auth/store.js` | 監査ログ `reservation.created` / `reservation.updated` / `reservation.cancelled` 等の補強（既存 `reservation.student_*` / `reservation.admin_*` は維持） |
| `.env*.example` | `NEXT_PUBLIC_USE_RESERVATION_UI_V2` 記載 |

## ロールバック手順

1. 本番: `.env` / `Environment` で `NEXT_PUBLIC_USE_RESERVATION_UI_V2=false` にし、再ビルド・再起動。
2. 即時: ブラウザで `?ui=v1` を付与（例: `https://portal.example/student/reservations?ui=v1`）。
3. コード戻し: 上記 V2 ファイルの削除と `page.js` の振分削除（Git でリバート）。

## 監査ログ

学生の作成・変更・キャンセルに加え、正規化用に以下を**追加**（既存行は残す）。

- `reservation.created`（学生・管理者作成時）
- `reservation.updated`（学生リスケ、管理者 PATCH）
- `reservation.cancelled`（学生キャンセル、管理者によるキャンセル遷移時）

既存の `reservation.student_created` 等の `meta` に日時・スロット情報を拡張。

## 注意

- 管理者 V2 のスロット開閉は **基準日（開始日）** のスロットのみ表示。スロット再生成などは従来 UI（`?ui=v1`）を使用。
- 監査ログ件数が増えるため、`AUTH_AUDIT_LOG_LIMIT` 既定内でローテーションされる点に留意。
