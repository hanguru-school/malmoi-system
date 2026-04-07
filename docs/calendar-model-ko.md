# 관리자 예약 캘린더 공통 모델

## 이벤트 필드 (`lib/admin/reservationCalendarModel.js`)

예약 행을 `reservationRowToCalendarEvent` 로 정규화합니다.

- `id`, `date`, `time`, `startAt`, `endAt`
- `studentName`, `teacherName`, `lessonName`, `status`, `mode` (online / in_person)

## 상태 공유

- **기준일** `calendarDate`
- **뷰** `scheduleView`: `day` | `week` | `month`
- **표시 모드** `viewMode`: `list` | `timetable` | **`calendar`**
- 필터·검색은 기존 `filteredReservations` 와 동일 데이터 소스
- 표기: **Asia/Tokyo (JST)** (UI에 명시)

## 데이터 로딩

- `computeReservationFetchRange(scheduleView, calendarDate)` 로 `fromDate`/`toDate` 를 맞추고, 월/주/일 전환 시 **동일 API**로 재조회합니다.
- **주 뷰**에서 이전/다음 탐색은 **±7일**입니다 (±1일 버그 수정).

## 월 그리드

- `buildMonthGridCells` 로 월요일 시작 6주 그리드를 생성하고, 날짜별로 `eventsByDate` 를 매핑합니다.
