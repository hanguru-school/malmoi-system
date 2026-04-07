# 레슨 시간「빠른 운영」흐름 (충전·부족·월간·학생 유지)

시간 원장(`lessonMinuteJournal`)·JSON 스토어 구조는 유지한 채, **결제/운영에 가깝게 클릭 수를 줄인** 단계입니다. 화면 문구는 일본어, 본 문서는 한국어입니다.

## 1. 충전 UX (관리자 · レッスン時間 탭)

### 동작

- **即時付与** 버튼: **600 / 300 / 180분** 각각 **한 번의 클릭**으로 `PATCH` → 원장 **`charge`** 행 생성.
- **메모 자동**: `クイック付与 {N}分` (種別は `purchase`).
- **下の欄へ** 보조 버튼: 예전처럼 분만 폼에 채움 → 메모를 직접 쓴 뒤 **レッスン時間のみ反映**으로 확정 (특수 케이스·감사 메모가 필요할 때).

### URL·스크롤

- 학생 상세 URL 해시 **`#lesson-time`** 또는 **`#add-lessons`** → **レッスン時間** 탭으로 전환 후 **`#lesson-minutes-quick`** 블록으로 스크롤.

### 롤백

- `StudentEditForm.js`의 `handleQuickChargeMinutes` / 해시 `useEffect` / UI 분리(即時 vs 下の欄へ) 제거 시 이전「폼만 채우기」 단일 프리셋으로 되돌릴 수 있습니다.

### 운영 주의

- 3000분 이상은 기존과 동일하게 **확인 다이얼로그** 후 전송.
- **操作 ID(nonce)** 는 요청마다 새로 발급되어 이중 적용을 방지합니다.

---

## 2. 부족 대응 흐름

### 관리자

| 위치 | 내용 |
|------|------|
| **学生詳細ヒーロー** | 시간 경고 블록 옆 **時間をすぐ付与** → 탭 이동 + 퀵 블록 스크롤 |
| **レッスン時間タブ** | 0 이하·180 이하·次回不足 메시지 옆 **クイック付与へ** / **時間を追加** |
| **ダッシュボード「要注意」カード** | **要フォロー学生を見る（詳細はレッスン時間タブへ）** 안내 |
| **要フォロー一覧** | 각 행 **詳細** · **時間付与** (`#lesson-time`) |

### 학생

| 위치 | 내용 |
|------|------|
| **ホーム** | 부족 배너에 **補足文** + 링크 라벨 **レッスン時間ページへ** (이동 최소화) |
| **`/student/lesson-time`** | 경고 아래 **教室への相談・追加はここではできない** 안내 문단 |

### 롤백

- 해당 버튼·문단·해시 링크를 제거하면 이전 동선으로 복귀합니다.

---

## 3. 월간 요약 구조 (관리자 대시보드)

- 함수: `getAdminLessonMinutesMonthSummary()` (`lib/auth/store.js`).
- **JST** 기준 달(`YYYY-MM`)의 `lessonMinuteJournal`만 집계.
- 카드에 표시되는 최소 지표:
  - **消費（usage 合計）** → 이번 달 **총 차감(수강 완료 등으로 기록된 usage)**.
  - **付与（charge 合計）** → 이번 달 **총 충전**.
  - **原簿に動きのあった学生** → **활동 학생 수**(해당 월 원장에 1건 이상 있는 학생 ID 유니크).
- 수동 조정·현재 잔여 0 이하 인원 등은 기존 카드 문구 유지.

회계 매출과는 **일치하지 않음** (운영 지표).

---

## 4. 학생 유지 흐름 (ホーム・UI만)

알림 푸시 없이 **「次の一手」** 스트립으로 유도합니다 (`StudentDashboard.js`).

- **quiet_streak**: 예약 4~14일 앞, 노트·미완 숙제 없음 → 기록이 적다는 안내 + 예약 타일 강조.
- **hw_cleared**: 배정 숙제는 있으나 모두 완료, 예약이 당장 아님 → 노트 타일 강조.
- **none** + 최근 usage 로그·노트 둘 다 없음 → 수강 기록이 적다는 한 줄 안내.

기존 homework / imminent / upcoming / notes / reserve 분기는 그대로 우선합니다.

---

## 관련 파일

- `app/admin/students/[id]/StudentEditForm.js`, `student-detail.module.css`
- `app/admin/page.js`, `app/admin/students/at-risk/page.js`
- `app/student/StudentDashboard.js`, `student-home.module.css`
- `app/student/lesson-time/page.js`, `lesson-time.module.css`
- `lib/auth/store.js` — `getAdminLessonMinutesMonthSummary`

원장·안전장치 전반은 `docs/lesson-minutes-ledger-ko.md`, `docs/lesson-minutes-operations-ko.md`를 참고하세요.
