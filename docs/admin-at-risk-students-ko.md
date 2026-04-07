# 관리자「要フォロー学生」一覧（읽기 전용）

## 목적

`buildRiskBadgesForStudent`（学習シグナル）と同じロジックで、**フォロー候補の学生を一覧**し、詳細画面への導線だけを提供する。データの変更はこの画面では行わない。

## 표시되는 시그널（예）

- **予約**: 最終予約から60日超 `gap_long`、予約履歴が弱い `no_res_hist`
- **宿題**: 未完了が3件以上 `hw_backlog`
- **ノート**: 30日以内のノートなし `note_stale`、ノートなし `no_note`
- **テキスト傾向**: ノート内キーワード繰り返し `kw_repeat`
- **登録後の動き**: 登録完了から14日以上、予約・ノート・宿題がいずれも無い `post_reg_idle`

学生一覧のフィルター「学習シグナル」でも `post_reg_idle` を選べる（既存 API の `riskSignal` クエリ）。

## 주요 동선

1. 管理メニュー **要フォロー学生** → `/admin/students/at-risk`
2. テーブルで会員番号・氏名・バッジを確認 → **詳細** で `/admin/students/[id]` へ
3. 個別対応（連絡・予約案内・ノート確認など）は詳細画面・他機能で実施

## 롤백

- 画面削除: `app/admin/students/at-risk/page.js` を削除し、`AdminTopNav` の該当メニュー行を削除。
- ストア関数削除: `listAtRiskStudentsForAdmin` と `post_reg_idle` バッジ・フィルター分岐を元に戻す（Git 推奨）。

## 운영 주의점

- 一覧は最大 **300件**（`listAtRiskStudentsForAdmin` の `limit`）に切り詰め。超過時は総数表示に「一部のみ」と出る。全校規模が大きい場合は検索・別フィルターと併用する。
- バッジは **ヒント** であり、自動アラートやメール送信はしない。
- `post_reg_idle` は「悪意」ではなくオンボーディング遅れの検知用。表現・運用は教室ポリシーに合わせて説明する。

## 관련 코드

- `lib/auth/store.js` — `buildRiskBadgesForStudent`, `studentMatchesRiskSignalFilter`, `listAtRiskStudentsForAdmin`
- `app/admin/students/at-risk/page.js`
- `app/admin/AdminTopNav.js`
