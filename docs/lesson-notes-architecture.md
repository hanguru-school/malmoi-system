# MalMoi 레슨노트 아키텍처 설계

본 문서는 MalMoi 레슨노트를 `학생 단위`가 아닌 `수업 단위(lesson unit)`로 설계하기 위한 기준입니다.

## 1. 설계 원칙

- 레슨노트 본문은 `lessonUnitId` 기준으로 1회 작성한다.
- 학생별 차이 정보(개별 메모/공개 여부)는 별도 연결 구조로 분리한다.
- 예약 참조는 `reservationId`를 보조 키로 사용한다.
- 1:1 / 페어 / 그룹 수업을 동일 모델로 처리한다.

---

## 2. 핵심 데이터 모델

## `lessonNotes` (수업 공통 노트)

- `id`
- `lessonUnitId` (필수, 수업 단위 키)
- `reservationSlotId` (선택)
- `teacherUserId`
- `date`
- `title`
- `summary`
- `content`
- `homeworkSummary`
- `nextLessonPlan`
- `isSharedToStudents`
- `createdAt`
- `updatedAt`

## `lessonNoteStudents` (학생별 연결/개별 정보)

- `id`
- `lessonNoteId`
- `studentId`
- `reservationId` (선택)
- `isVisibleToStudent`
- `studentPrivateMemo` (관리자/교사용 내부 메모)
- `studentFeedbackSummary` (학생별 요약)
- `createdAt`
- `updatedAt`

## `lessonNoteAttachments` (첨부)

- `id`
- `lessonNoteId`
- `fileName`
- `fileUrl`
- `fileType`
- `createdAt`

---

## 3. 기존 구조와의 연결

- 예약: `reservations.lessonUnitId`
- 페어: `reservations.pairLinkId`, `studentPairs`
- 학생: `students.id`

즉, 레슨노트는 다음처럼 연결됩니다.

- 공통: `lessonNotes.lessonUnitId` <-> `reservations.lessonUnitId`
- 개별: `lessonNoteStudents.studentId` <-> `students.id`
- 참조: `lessonNoteStudents.reservationId` <-> `reservations.id`

---

## 4. 수업 유형별 동작

### 1:1 수업
- `lessonUnitId` 1개
- 연결 학생 1명
- 공통 노트 + 학생별 연결 1건

### 페어 수업
- 동일 `lessonUnitId` 공유 예약 2건
- 연결 학생 2명
- 공통 노트 1건 + 학생별 연결 2건

### 그룹 수업
- 동일 `lessonUnitId` 공유 예약 N건
- 연결 학생 N명
- 공통 노트 1건 + 학생별 연결 N건

---

## 5. 화면 구조 권장

## 학생 화면

- 목록: `/student/lesson-notes`
  - 날짜, 제목, 요약, 숙제 요약, 다음 수업 안내
- 상세: `/student/lesson-notes/[id]`
  - 제목, 날짜, 본문, 숙제, 첨부

## 관리자/교사 화면

- 목록/작성: `/admin/lesson-notes` 또는 `/teacher/lesson-notes`
- 기능:
  - `lessonUnitId` 기준 작성
  - 학생별 공개/비공개 설정
  - 학생별 개별 메모 입력
  - 숙제 연결

---

## 6. 운영 흐름(권장)

```text
수업 완료
 -> 출석 확정
 -> lessonUnitId 기준 레슨노트 작성
 -> 학생별 연결(공개범위 설정)
 -> 학생/보호자 공개
 -> 숙제 연결
```

---

## 7. API 최소 설계(MVP)

- `GET /api/student/lesson-notes`
- `GET /api/student/lesson-notes/[id]`
- `GET /api/admin/lesson-notes`
- `POST /api/admin/lesson-notes`
- `PATCH /api/admin/lesson-notes/[id]`

권장: 관리자 저장 시 `lessonNoteStudents`를 함께 upsert 처리.

---

## 8. 확장 포인트

- 보호자 조회 권한 연동(`studentParents.canViewLessonNotes`)
- 첨부 파일 저장소 분리(업로드 정책)
- 자동 요약/템플릿(코스별)
- `lessonUnitId` 기반 수업 이력/통계

