# 레슨 시간 내부 원장·잔여·완료 시 차감

## 목적

외부 결제(Stripe 등)와 분리하여, **교실 내부에서 보유·충전·소비·조정**되는 레슨 시간(分)을 JSON 스토어에 일관되게 남기고, 학생/관리 화면에서 동일한 기준으로 잔여를 보여 주기 위함입니다.

## 저장 구조 (확장)

### 1) `lessonMinuteLogs` (기존)

- 운영 이벤트 단위의 상세 로그 (`type`: `deduction`, `refund`, `credit_*`, `manual_adjustment`, `debit_manual_adjustment` 등).
- 예약 ID, 분 수, 처리 전후 `remaining`, 처리자 역할 등이 포함됩니다.

### 2) `lessonMinuteLedger` (추가)

- **정규화된 원장 행**으로, 감사·요약에 쓰기 쉽도록 `kind`를 통일합니다.
- **kind**
  - `topup` — 구매/관리자 부여 등 잔여 증가 (`credit_*`에 대응)
  - `usage` — 수업 **완료 시** 등으로 잔여 감소 (`deduction`)
  - `refund` — 취소 등으로 잔여 복구 (`refund`)
  - `manual_adjustment` — 수동 조정·결제 조정 감소 등
- **minutesDelta**: 잔여 기준 증감(소비는 음수, 충전·환급은 양수).
- **lessonMinuteLogId**: 대응하는 `lessonMinuteLogs[].id` (추적용).
- 최초 로드 시 기존 로그로부터 **1회 백필**(`lessonMinuteLedgerBackfilled`) 후, 이후는 신규 기록만 추가합니다.

### 3) 학생 스냅샷 `student.lessonMinutes` (기존)

- `totalMinutes`, `usedMinutes`, `remainingMinutes` — 화면 표시의 1차 근거.
- 원장과 이중 기록이며, **진실 공급원은 스냅샷 + 로그**의 조합으로 운영합니다.

## 잔여 시간 계산

- **표시용 잔여**: `migrateStudentShape` 후 `remainingMinutes = max(0, totalMinutes - usedMinutes)` (기존과 동일).
- **공통 헬퍼**: `lib/adapters/lessonMinutesSummary.js`의 `computeLessonMinutesBalance`, `buildLessonMinutesCompletionPreview`.
- **다음 예약 완료 시 예상 소비**: 확정/요청 중인 다음 예약의 `durationMinutes`와 현재 잔여를 비교해 **부족 여부**만 안내(실제 차감은 완료 처리 시).

## 수업 완료 시 차감 흐름

1. 관리자가 예약을 **`completed`** 로 변경할 때, 출석이 `attended`(또는 환경 변수에 따라 `no_show`)이면 차감 로직이 동작합니다.
2. **중복 방지**: 예약당 `lessonMinutesDeducted`가 이미 양수면 재차감하지 않습니다.
3. **잔여보다 긴 레슨**: 그대로 `used`를 올리고 잔여는 0으로 맞추며, **`reservation.lesson_minutes_shortfall`** 감사 로그를 추가합니다(위험한 자동 과다 차감의 가시화).
4. **환경 변수**
   - `LESSON_MINUTES_DEDUCT_ON_COMPLETION_ONLY` (기본 `true`): **`completed`로 바뀌는 순간**에만 차감(출석만 표시하고 완료 전이면 차감 안 함).
   - `LESSON_MINUTES_DEDUCT_ON_ATTENDED_LEGACY=true` 이면, 예전처럼 출석만으로도 차감 시도하는 경로로 되돌릴 수 있습니다(운영 롤백용).

## 학생 화면

- **ホーム / 個人情報**: `buildLessonMinutesCompletionPreview`로 「완료時に約○分」/「不足」힌트(일본어).
- 기존 `StudentLessonTimeFlow`의 잔여·予約可能時間 표시는 유지.

## 관리자 화면

- **学生詳細**: 잔여 경고(0 이하, 180분 이하), 다음 예약 대비 부족 안내, **内部原簿** 목록.
- **ダッシュボード**: 잔여 0 이하·180 이하·次回不足恐れ 인원 수 카드 + 要フォロー学生 링크.
- **学生一覧 V2 フィルター**: `minutes_depleted`, `minutes_low`, `minutes_short_next` (리스크 배지와 연동).

## 롤백 방법

1. **차감 타이밍만 과거 방식으로**: `.env`에 `LESSON_MINUTES_DEDUCT_ON_COMPLETION_ONLY=false`, `LESSON_MINUTES_DEDUCT_ON_ATTENDED_LEGACY=true` 후 재배포.
2. **원장 배열 제거**: `lessonMinuteLedger`·`lessonMinuteLedgerBackfilled` 키를 스토어 JSON에서 삭제하고, `appendLessonMinuteLedgerEntry` 호출부를 코드에서 제거(커밋 되돌리기 권장).
3. **앱 전체**: 이전 릴리스로 `current`/`releases` 배포 롤백.

## 운영 주의점

- 완료 처리 전에는 시간이 차감되지 않으므로, **運用ルールで「いつ完了にするか」**를 팀과 맞춥니다.
- 잔여 0 이하에서도 레슨을 완료로 두면 기록상 초과 사용이 될 수 있으므로, 감사 로그·要フォローで 추적합니다.
- 원장 백필은 **최초 1회**이며, 이후 데이터는 신규 이벤트만 반영됩니다.

## 관련 코드

- `lib/auth/store.js` — 원장, 차감, 리스크, `getAdminLessonMinuteRiskSummary`
- `lib/adapters/lessonMinutesSummary.js` — 잔여·미리보기 헬퍼
- `app/student/page.js`, `StudentDashboard.js`, `app/student/profile/page.js`, `StudentProfilePanel.js`
- `app/admin/students/[id]/StudentEditForm.js`, `app/admin/page.js`, `AdminStudentsPanelV2.js`
