# 영업시간·예약·강사 일정 구조

## 교실 영업시간 우선순위

1. **일별 예외** (`classroomOperations.dateOverrides`)
2. **요일별** (`weekdayHours`, 키 0=일 … 6=토)
3. **기본** (`defaultOpen` / `defaultClose`, `defaultBreaks`)

설정 UI: **教室運営** → `?t=hours` (기본·요일·일별 예외를 한 섹션에서 JSON/필드로 편집).

## 강사 일정

- **정책** (`teacherSchedulePolicy`): `editableDaysBefore`, `lockHoursBeforeLesson`, `forcedLocks`, `adminOnlyEdit` 등.
- **개별 데이터**: 관리자/강사 API 및 `AdminTeacherScheduleClient` (주간 가능 시간·예외·락).

## 예약 데이터

- 예약 본문은 기존 예약 API·슬롯 모델을 따릅니다.
- 시스템 설정의 `reservation` 섹션에 **승인 모드**, **캘린더에 취소 표시**, **학생 변경 권장 마감(일 전)** 등을 추가했습니다.
