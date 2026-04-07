# MalMoi データ保存・DB 検証レポート（2026-04-02）

## 重要: 本プロジェクトに Prisma / DATABASE_URL はない

Hanguru / MalMoi 統合アプリ（`malmoi-integrated`）は **リレーショナル DB を使用していません**。  
永続化は **単一の JSON ファイル**（既定: プロジェクト直下の `.data/auth-store.json`）に集約されています。

そのため、サーバのホームディレクトリで次を実行しても **期待どおり動きません**。

- `echo $DATABASE_URL` → 空（正常。未使用）
- `npx prisma studio` → **このリポジトリに `schema.prisma` が存在しない**
- `cat ~/.env.local` → アプリの cwd に依存。**systemd の `WorkingDirectory` 配下**を確認すること

## 実際のプロジェクト配置（デプロイスクリプト基準）

- サーバ側想定アプリディレクトリ: `/home/malmoi_deploy/apps/malmoi`（`deploy/deploy-prod.sh` の `APP_DIR`）
- systemd サービス名の既定: `malmoi-web`（環境変数 `MALMOI_SYSTEMD_SERVICE` で上書き可）

## 環境変数の供給（DATABASE_URL ではなく）

| 変数 | 役割 |
|------|------|
| `AUTH_STORE_PATH` | JSON ストアのパス（未設定時は `cwd/.data/auth-store.json`） |
| `APP_BASE_URL` / `NEXTAUTH_URL` / `MAIL_LINK_BASE_URL` | メール内リンク用（保存先とは無関係） |

Next.js 本番では **通常 `WorkingDirectory` がアプリルート**になるため、未設定なら  
`/home/malmoi_deploy/apps/malmoi/.data/auth-store.json` に保存されます。

systemd で `Environment=` または `EnvironmentFile=` を使う場合は、上記と **WorkingDirectory の整合**を確認してください。

## スキーマと実データの対応

- RDB の「テーブル」に相当するのは、JSON 内の **配列フィールド**です。
- 主なキー: `users`, `students`, `reservations`, `reservationSlots`, `auditLogs`, `sessions`, `mailLogs`, `paymentTransactions`, `paymentEvents` など。

## 検証手段（今回追加）

### A. 管理者 API

- `GET /api/admin/debug/db-check`  
- **管理者ログイン必須**（セッション Cookie）。  
- 応答: 接続可否、件数、直近サンプル（個人情報は最小限）。**`DATABASE_URL` 全文は返さない**。

### B. 管理者ページ

- `/admin/system/db-check`  
- 上記と同内容を画面表示（管理者のみ）。

### C. CLI

```bash
cd /path/to/malmoi-integrated
npm run check:db
# または
AUTH_STORE_PATH=/path/to/auth-store.json npm run check:db
```

## ローカル検証結果（開発マシン・例）

`npm run check:db` 実行例（開発データ）:

- `users`: 3, `students`: 3, `reservations`: 0, `reservationSlots`: 144, `auditLogs`: 8 など
- 直近の `auditLogs` に登録開始・ログイン成功が記録されていることを確認

## 変更ファイル一覧

- `lib/auth/store.js` — `readStore` を export、`getAuthStoreAbsolutePath` 追加
- `lib/admin/storage-health.js` — 診断レポート生成（新規）
- `app/api/admin/debug/db-check/route.js` — 管理者 API（新規）
- `app/admin/system/db-check/page.js` — 管理者ページ（新規）
- `app/admin/AdminTopNav.js` — 「保存診断」リンク
- `app/admin/settings/SystemSettingsPanel.js` — システム情報から診断ページへのリンク
- `scripts/check-db.mjs` — サーバ・ローカル兼用 CLI（新規）
- `package.json` — `check:db` スクリプト

## デプロイ・反映手順

1. `git commit` / `git push origin main`
2. サーバで `deploy/deploy-prod.sh`（または `npm run deploy` ローカルから SSH 経由）
3. `sudo systemctl restart malmoi-web`（スクリプト内で実行）
4. 管理者で `/admin/system/db-check` を開き、`ok: true` と件数を確認

## 再確認方法（運用）

1. ブラウザ: 管理ログイン後 `/admin/system/db-check`
2. SSH: `cd /home/malmoi_deploy/apps/malmoi && npm run check:db`
3. 予約を 1 件作成 → ページ/API で `reservations` 件数が増えるか確認
4. `auditLogs` 直近に関連アクションが付くか確認

## 制約（遵守済み）

- 運用データの削除・`migrate reset` / 強制 `db push` 等は実施していない
- 接続文字列の平文露出なし
- 診断は管理者向けに限定

## 残リスク・注意

- **本番の `AUTH_STORE_PATH` が意図せず別パス**になっていると、管理画面の件数と「想定ディレクトリのファイル」が一致しないことがある → API の `pathRelativeToCwd` / `envOverride` を確認すること
- **複数インスタンス**で同一 JSON を共有するとファイル競合のリスクがある（現設計は単一ライター前提）
- サーバへの実 SSH デプロイは、鍵・`scripts/deploy.env`・ネットワークがローカル環境に依存するため、**このレポジトリ変更だけでは自動保証できない**

## 関連ドキュメント

- `docs/storage-path-migration.md` — 運用で `auth-store.json` を `/srv/malmoi/shared/auth-store.json` に固定する手順（systemd・バックアップ・検証）
