# 레슨 시간 내부 원장·잔여·완료 시 차감

## 목적

외부 결제(Stripe 등)와 분리하여, **교실 내부에서 보유·충전·소비·조정**되는 레슨 시간(分)을 JSON 스토어에 일관되게 남기고, 학생/관리 화면에서 동일한 기준으로 잔여를 보여 주기 위함입니다.

## 저장 구조 (확장, 기존 JSON 유지)

### 1) `lessonMinuteJournal` (공식 시간 원장·배열)

학생별 시간 흐름의 **내부 원장**입니다. `student.lessonMinutes` 숫자만 단독으로 신뢰하지 않고, **원장이 있으면 원장 합산으로 잔여를 재계산**해 동기화합니다.

- **type**
  - `charge` — 충전·구매·관리자 부여 등(분은 **양수**)
  - `usage` — 수업 **완료 후** 차감(분은 **양수**, 의미는 소비량)
  - `manual_adjustment` — 관리자 보정·취소 환급 등(분은 **부호 포함**, 잔여에 직접 가산)
- **필드(최소)**
  - `id`, `studentId`, `type`, `minutes`
  - `relatedReservationId` (해당 시, 예: usage가 어느 예약에 묶였는지)
  - `memo`, `createdAt`, `createdByRole`, `createdByUserId`
  - `legacyLessonMinuteLogId` (선택, `lessonMinuteLogs` 백필·추적용)
- **감사(audit)**: 차감 시 `reservation.lesson_minutes_deducted` 감사 로그의 `meta.lessonMinuteJournalEntryId`로 원장 행과 연결됩니다. 충전·수동 조정은 기존 `student.lesson_minutes_*` 계열 감사와 병행됩니다.

### 2) `lessonMinuteLogs` (기존)

운영 이벤트 단위의 상세 로그 (`deduction`, `refund`, `credit_*`, `manual_adjustment` 등). 원장과 **이중 기록**이며, 최초 1회 `ensureLessonMinuteJournalFromLogs`로 과거 로그에서 원장을 백필할 수 있습니다.

### 3) `lessonMinuteLedger` (레거시 정규화 원장)

`kind`/`minutesDelta` 형태의 구버전 요약입니다. UI에서는 **「レガシー内部原簿」**로 표시하며, 신규 운영의 기준은 `lessonMinuteJournal`입니다.

### 4) 학생 스냅샷 `student.lessonMinutes` (기존)

`totalMinutes`, `usedMinutes`, `remainingMinutes` — 화면·API 편의용. **`lessonMinuteJournal`에 해당 학생 행이 하나라도 있으면** `applyLessonMinutesFromJournal`이 호출되는 경로에서 **원장 합산 결과로 덮어씁니다**(하드코딩 단일 숫자 저장을 진실 공급원으로 쓰지 않음).

## 잔여 시간 계산

- **원장이 있는 경우(권장·운영 기준)**  
  `lib/adapters/lessonMinutesSummary.js`의 `summarizeLessonMinuteJournalEntries`:

  `remainingMinutes = max(0, Σcharge − Σusage + Σmanual_adjustment)`

  - `charge`·`usage`의 `minutes`는 절댓값으로 합산(내부적으로 음수 저장을 허용하지 않는 것이 안전).
  - `manual_adjustment`는 부호 그대로 합산.

- **동기화**  
  `lib/auth/store.js`의 `applyLessonMinutesFromJournal(store, student)`가 위 합산으로 `student.lessonMinutes`를 갱신합니다.  
  호출 예: `getSessionUser`, `listStudentsForAdmin`, `getStudentByIdForAdmin`, `getAdminLessonMinuteRiskSummary`, `buildRiskBadgesForStudent`, `listAtRiskStudentsForAdmin`, 예약 완료 차감 직후 등.

- **미리보기**  
  `buildLessonMinutesCompletionPreview` — 다음 확정/요청 예약의 `durationMinutes`와 현재 잔여 비교, **완료 후 목표 잔여**(`projectedRemainingAfterNext`) 및 일본어 힌트(`completionHintJa`, `projectedRemainingHintJa`).

## 수업 완료 시 차감

1. 예약이 **`completed`**로 바뀌고, 출석·환경 변수 조건을 만족할 때 `applyLessonMinuteDeduction`이 동작합니다.
2. **예약 생성 시에는 차감하지 않습니다.** 차감은 완료 처리 시에만.
3. **중복 차감 방지**
   - 동일 `relatedReservationId`에 대해 이미 `type === "usage"` 원장 행이 있으면 **추가 usage를 만들지 않음** (`journalHasUsageForReservation`).
   - 예약 객체의 `lessonMinutesDeducted`가 이미 양수면 **재실행하지 않음**.
4. 잔여보다 긴 레슨: 잔여는 0으로 맞추고 **`reservation.lesson_minutes_shortfall`** 감사 로그로 가시화.
5. **환경 변수**
   - `LESSON_MINUTES_DEDUCT_ON_COMPLETION_ONLY` (기본 `true`): 완료 전환 시에만 차감.
   - `LESSON_MINUTES_DEDUCT_ON_ATTENDED_LEGACY=true` 시 출석 기반 레거시 경로(롤백용).

## 학습 시그널(riskSignal) 확장

배지 ID(필터와 동일 로직으로 매칭):

| ID | 조건(요지) |
|----|------------|
| `minutes_low` | 잔여 ≤ 180분 (양수 구간) |
| `minutes_exhausted` | 잔여 ≤ 0 |
| `minutes_will_run_out` | 다음 `requested`/`confirmed` 예약 소요분 &gt; 현재 잔여 |

필터 `studentMatchesRiskSignalFilter`는 **`minutes_depleted` ↔ `minutes_exhausted`**, **`minutes_short_next` ↔ `minutes_will_run_out`** 상호 호환을 유지합니다.

## 학생 화면 (UI 문구는 일본어)

- **ホーム** (`StudentDashboard`): 잔여·`completionHintJa`·`projectedRemainingHintJa`.
- **個人情報** (`StudentProfilePanel`): 동일.
- 데이터는 세션(`getSessionUser`)에서 원장 동기화 후의 `lessonMinutes`를 사용.

## 관리자 화면

- **学生詳細** (`StudentEditForm` · 管理メモタブ): 잔여 경고, 다음 예약 힌트, **公式時間原簿**（charge / usage / manual_adjustment 各リスト）, 원장 요약 한 줄, 레거시 `lessonMinuteLedger`.
- **ダッシュボード**: `getAdminLessonMinuteRiskSummary` — 잔여 0 이하·180 이하·次回不足 인원(원장 동기화 후 집계).
- **学生一覧 V2**: 필터에 `minutes_exhausted`, `minutes_will_run_out` 및 구 ID 호환 옵션.

## 롤백 방법

1. **차감 타이밍만 과거 방식**: `.env`에 `LESSON_MINUTES_DEDUCT_ON_COMPLETION_ONLY=false`, `LESSON_MINUTES_DEDUCT_ON_ATTENDED_LEGACY=true` 후 재배포.
2. **원장 배열만 제거**: 스토어 JSON에서 `lessonMinuteJournal`, `lessonMinuteJournalBackfilledFromLogs` 키를 삭제(또는 Git으로 해당 커밋 되돌리기). 이후 `applyLessonMinutesFromJournal`은 원장이 비어 있으면 스냅샷을 바꾸지 않습니다.
3. **앱 전체**: `current`/`releases` 등 배포 파이프라인으로 이전 빌드로 롤백.

## 운영 주의점

- 완료 처리 전에는 시간이 차감되지 않으므로, **いつ「完了」にするか**를 팀 규칙으로 고정합니다.
- 원장 백필(`lessonMinuteJournalBackfilledFromLogs`)은 **최초 1회**; 이후 신규 분은 코드 경로에서만 추가됩니다.
- 동일 예약에 usage가 두 번 생기지 않도록 **`relatedReservationId` + `journalHasUsageForReservation`** 규칙을 유지합니다.

## 관련 코드

- `lib/auth/store.js` — `lessonMinuteJournal`, `applyLessonMinuteDeduction`, `applyLessonMinutesFromJournal`, `buildLessonMinuteJournalSlicesForAdmin`, `buildRiskBadgesForStudent`, `getAdminLessonMinuteRiskSummary`
- `lib/adapters/lessonMinutesSummary.js` — `summarizeLessonMinuteJournalEntries`, `buildLessonMinutesCompletionPreview`, `lessonMinuteJournalTypeLabelJa`
- `app/student/page.js`, `StudentDashboard.js`, `app/student/profile/page.js`, `StudentProfilePanel.js`
- `app/admin/students/[id]/StudentEditForm.js`, `app/admin/page.js`, `AdminStudentsPanelV2.js`

運営 UI・学生履歴・警告・安全装置の詳細は **`docs/lesson-minutes-operations-ko.md`** を参照してください。

クイック付与・画面トーン・警告の出し分け・月間サマリーは **`docs/lesson-minutes-ux-and-monthly-ko.md`** を参照してください。
