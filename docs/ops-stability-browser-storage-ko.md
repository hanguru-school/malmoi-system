# 운영 안정화: 브라우저 저장소・自動 이동 큐

## 목적

V2 運用（本日の未処理・先生クイック入力・宿題連携など）で使う **sessionStorage / localStorage** を把握し、障害時に初期化・復旧できるようにする。AUTH_STORE_PATH・サーバー JSON・Cookie 設計は従来どおり。

## storage 키 목록

| キー | 種別 | 用途 |
|------|------|------|
| `malmoi:opsFlowQueue:v1` | sessionStorage | 「本日の未処理」からの連続処理 URL キュー（`lib/ops/opsFlowQueue.js`） |
| `malmoi:teacherUiUsage:v1` | localStorage | 先生 UI 利用頻度・並び替え（`lib/teacher/teacherUiUsage.js`） |
| `malmoi:lessonNote:recentSummaryLines:v1` | localStorage | レッスンノート直近フレーズ（`lib/lessonNotes/teacherQuickCompose.js`） |
| `lesson-notes:bulk-assign-result:…` | sessionStorage | 管理・一括割当結果の一時表示（パネル単位） |
| `malmoi:hwPrefillFromNote:v1` | sessionStorage | ノート保存後の宿題フォーム引き継ぎ（約45分 TTL） |
| `malmoi:homework:recentQuickEntries:v1` | localStorage | 直近に登録した宿題の再利用一覧 |

※ キー名はコード内定数を正とする。追加時は本書を更新する。

## 초기화・削除方法

- **1ユーザー・1ブラウザのみ**影響する。サーバー側操作は不要。
- 開発者ツール → Application → Session Storage / Local Storage から該当キーを削除。
- または該当サイトの「サイトデータ削除」（Cookie 以外にストレージも消える場合あり。ログインセッションへの影響は環境による）。

## 자동 이동 큐가 꼬였을 때

現象: 完了したのに次 URL に飛ばない、別タブの古いキューが残る、など。

1. `malmoi:opsFlowQueue:v1` を sessionStorage から削除する。
2. 「本日の未処理」からキューを掛け直す。
3. 同一タブで処理する（別タブでは session が共有されないブラウザもある）。

`completeOpsFlowStep` は pathname と主要クエリ（`lessonUnitId`, `studentId`, `refDate` 等）で一致判定する。URL が微妙に違うと「消化されない」ので、運用ではクエリ付きの共有リンクを統一する。

## V1 롤백（概念）

- アプリの **デプロイを前のリリースに戻す**（`current`/`releases` 運用は既存手順に従う）。
- ブラウザ側の新キーは残っていても旧バージョンは無視するだけのことが多い。問題があれば上記キーを削除。

## 운영 중 주의 사항

- **個人化・キューは端末依存**。共有 PC では想定外の順序やキューが出るため、職員用端末の運用ルールを決める。
- localStorage は容量制限がある。teacherUiUsage は失敗時に黙ってスキップする設計。
- sessionStorage はタブを閉じると消える。長時間オープンしたタブでは TTL 付きデータ（宿題プレフィル等）が期限切れになるのは正常。

## 관련 파일

- `lib/ops/opsFlowQueue.js`
- `lib/teacher/teacherUiUsage.js`
- `lib/homework/quickHomework.js`
- `docs/teacher-personalization-ko.md`, `docs/student-retention-home-ko.md`, `docs/admin-at-risk-students-ko.md`
