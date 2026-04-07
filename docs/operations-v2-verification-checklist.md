# V2 運用検証チェックリスト（実務向け）

**目的:** `NEXT_PUBLIC_USE_STUDENT_REGISTRATION_UI_V2=true` と `NEXT_PUBLIC_USE_RESERVATION_UI_V2=true` を既定にした状態で、学生・管理者・JSON 保存の一連が途切れないことを確認する。

**前提（ロールバック）:** 画面のみ V1 に戻す場合は `?ui=v1`。環境全体は `.env` で両フラグを `false` にして再ビルド（詳細は `docs/registration-v2-integration.md`）。

---

## 0. 環境変数とビルド（必須）

1. 本番では **`.env.production.example`** を参考に、少なくとも次を `true` にしてからビルドする（`NEXT_PUBLIC_*` はビルド時埋め込みのため、変更後は必ず再ビルド）。

```
NEXT_PUBLIC_USE_STUDENT_REGISTRATION_UI_V2=true
NEXT_PUBLIC_USE_RESERVATION_UI_V2=true
```

2. プロジェクトルートでビルド:

```bash
cd /path/to/malmoi-integrated
NEXT_PUBLIC_USE_STUDENT_REGISTRATION_UI_V2=true \
NEXT_PUBLIC_USE_RESERVATION_UI_V2=true \
npm run build
```

3. エラー・警告でビルドが止まらないことを確認する。

4. 既存の **releases / current** 手順で配布する（`docs/registration-v2-integration.md`）。

---

## 1. 学生向け検証（順番どおり）

| # | 手順 | 確認内容 |
|---|------|----------|
| 1 | 管理者が学生登録メールを送信（既存フロー） | メールが届く。本文の verify リンクに `ui=v2` 等、既定 V2 と整合するクエリが付く（`registrationNavPaths` / `store` 経由）。 |
| 2 | メール内リンクをクリック | `/api/auth/verify` に到達し、セッション Cookie が付与される。同意画面へリダイレクト（`/student/register/consent?ui=v2` 想定）。 |
| 3 | 同意画面 | 同意送信後、プロフィール画面へ遷移し、`ui` が維持される。 |
| 4 | プロフィール入力 | 必須項目を入力し完了できる。 |
| 5 | 完了画面 | 「予約へ進む」「マイページへ」が表示され、リンクが有効。 |
| 6 | 「予約へ進む」 | 予約 V2 の URL（`/student/reservations?ui=v2` 等）に入り、`rememberReservationUiPreference('v2')` により以降の予約メニューも V2 になる。 |
| 7 | 学生予約 V2 | スロット選択から予約作成ができる。 |
| 8 | 一覧 | 自分の予約が一覧に出る。 |
| 9 | 変更 | 変更フローがエラーなく完結する。 |
| 10 | キャンセル | キャンセル後、一覧・状態が整合する。 |
| 11 | マイページ経由 | `/student`（ホーム）からハンバーガーメニュー「予約」を開き、依然として V2 パス（`studentReservationsPathFromBrowserPreference()`）に乗る。URL に `?resUi=v2` を付けてホームに入った場合も V2 が維持される。 |
| 12 | その他メニュー | レッスンノート・宿題・お知らせ・**プロフィール**へ遷移できる。ホームでは上段＝予約、中段＝予約一覧/ノート/宿題、下段＝お知らせ/プロフィールの順で表示される（`docs/ia-student-dashboard.md`）。 |

**補足:** メールが `log` モードの環境では、サーバログまたはメールログ画面で URL を確認する。

---

## 2. 管理者向け検証（順番どおり）

| # | 手順 | 確認内容 |
|---|------|----------|
| 1 | `/admin` ダッシュボード | 本日の予定・承認待ち・最近の管理操作ログが表示される。 |
| 2 | **学生管理** `/admin/students` | 一覧・検索が動作。ナビの **登録状況** からも同一画面に入れる。 |
| 3 | **学生詳細** `/admin/students/[id]` | `RegistrationProgressPanel` で登録進捗（同意・プロフィール・完了）が読み取り専用で表示される。 |
| 4 | **予約管理** `/admin/reservations` | V2 パネルで一覧・承認・変更対応ができる（`docs/reservations-feature-v2.md` 参照）。 |
| 5 | **スロット管理** | システム設定または予約まわりの既存 UI でスロット開閉ができ、学生側に反映される。 |
| 6 | **登録状況確認** | 学生一覧の登録ステータス＋必要に応じて学生詳細の進捗パネルで十分かを確認。 |
| 7 | **お知らせ** `/admin/notices` | 作成・公開が可能。 |
| 8 | **決済** `/admin/payments/*` | 運用で使う画面（入力・履歴・設定等）にアクセスできる。 |
| 9 | **監査ログ** | ダッシュボード「最近の管理操作ログ」で直近が見える。詳細は予約管理パネル等から API `/api/admin/audit-logs` を参照する運用でもよい。 |
| 10 | **保存診断** `/admin/system/db-check` | JSON 保存の説明・整合確認が表示される。 |

---

## 3. 保存検証（JSON / ストア）

**対象ファイル:** 運用の `AUTH_STORE_PATH`（例: `.data/auth-store.json`）。**本番ではバックアップ取得後に読むこと。**

### 3.1 users

- 登録 verify 後、該当ユーザレコードが存在し、メール・ロール・学生紐付けが整合する。
- ログアウト・再ログインで期待どおり認証される。

### 3.2 students

- `registrationStatus` / `consentStatus` がフローに沿って更新される（同意待ち → プロフィール → 完了等）。
- 管理画面の `RegistrationProgressPanel` 表示と矛盾しない。

### 3.3 reservations

- 学生が作成した予約が `reservations` に追加される。
- 変更・キャンセル後、該当レコードの `status` や時刻が期待どおり。

### 3.4 reservationSlots（またはスロット相当の保存）

- 管理者のスロット開閉が JSON に反映され、学生の予約可能枠と一致する。

### 3.5 auditLogs

- 登録開始・予約作成・管理者操作など、重要イベントに対応する監査エントリが増える（アクション名は実装参照）。
- ダッシュボードまたは API で時系列が追える。

**手順（推奨）:**

1. 検証用アカウントで登録〜予約まで一通り実施する前に `auth-store.json` をコピーする（任意）。
2. 各ステップ後に該当キーを目視または `jq` で確認する。
3. 異常時は `docs/registration-v2-integration.md` のロールバックと、バックアップからの復元手順を使う。

---

## 4. 変更ファイル・ロールバック（概要）

- 詳細は **`docs/registration-v2-integration.md`** の「ロールバック」「変更ファイル」表を参照。
- 環境変数を V2 から外す → `npm run build` → releases の `current` 差し替え。

---

## 5. 関連ドキュメント

- `docs/registration-v2-integration.md` — メール・verify・登録完了・予約連携
- `docs/reservations-feature-v2.md` — 予約 V2 機能・管理画面
- `docs/ia-student-dashboard.md` — 学生 IA
- `docs/ia-admin-navigation.md` — 管理者 IA
