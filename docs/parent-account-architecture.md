# MalMoi 보호자 계정(Parent) 아키텍처 설계

본 문서는 보호자 계정을 "학생 데이터 소유자"가 아니라 "권한 연결 사용자"로 설계하기 위한 기준입니다.

## 1. 설계 원칙

- 보호자는 관리자 권한이 아니라 `자녀 확인용 대시보드` 권한이다.
- 학생 계정과 보호자 계정은 분리한다.
- 학생-보호자 연결은 다대다 확장 가능한 관계 테이블로 관리한다.
- 1단계는 읽기 전용으로 시작한다.

---

## 2. 역할(Role) 확장

`users.role`에 `parent` 추가

- `student`
- `parent`
- `teacher`
- `admin`

로그인 분기 권장:

- `parent` -> `/parent`

---

## 3. 핵심 데이터 모델

## `studentParents` (핵심 연결)

- `id`
- `studentId`
- `parentUserId`
- `relationship` (母/父/保護者 등)
- `status` (`active`/`inactive`)
- `isPrimary`
- `canViewReservations`
- `canViewLessonNotes`
- `canViewHomework`
- `canViewPayments`
- `canReceiveNotifications`
- `createdAt`
- `updatedAt`
- `linkedByUserId`
- `unlinkedAt`
- `unlinkedByUserId`
- `notes`

## `students` 확장 필드 권장

- `isMinor`
- `guardianRequired`
- `guardianMemo` (선택)

---

## 4. 보호자 화면 구조(권장)

## 홈
- `/parent`
- 연결된 자녀 목록, 다음 예약, 최근 공지/레슨노트 요약

## 자녀별 보기
- `/parent/children/[studentId]`

하위 조회 페이지(읽기 전용):

- `/parent/children/[studentId]/reservations`
- `/parent/children/[studentId]/notices`
- `/parent/children/[studentId]/lesson-notes`
- `/parent/children/[studentId]/homework`
- `/parent/children/[studentId]/attendance`
- `/parent/children/[studentId]/points`

---

## 5. 권한 정책(초기)

## 기본 허용
- 자녀 기본정보 조회
- 예약 조회
- 공지 조회
- 레슨노트 조회
- 숙제 조회
- 출석 조회

## 초기 제한
- 학생 개인정보 직접 수정
- 관리자 내부 메모 열람
- 다른 학생 정보 접근

---

## 6. 기존 구조와의 연결

- 인증: `users`, `sessions`, `loginTokens`
- 학생: `students`
- 예약: `reservations` (`studentId` 기반)
- 공지: `notices`
- 레슨노트(향후): `lessonNotes`, `lessonNoteStudents`
- 포인트/시간: `points`, `lessonMinutes`

조회 시 핵심 조건:

- parent 유저가 `studentParents(status=active)`로 연결된 학생만 접근 가능
- 세부 권한은 `canView*` 플래그로 체크

---

## 7. 단계별 도입 계획

## Phase 1 (기본)
- role `parent` 추가
- `studentParents` 추가
- `/parent` 대시보드 추가
- 연결 학생 기본 정보/예약/공지 읽기 가능

## Phase 2 (학습 연계)
- 레슨노트/숙제/출석 조회 연결
- 학생 수가 여러 명일 때 자녀 선택 UX 보강

## Phase 3 (운영 확장)
- 알림 수신 제어(`canReceiveNotifications`)
- 결제/포인트 사용 이력 조회
- 제한 승인/요청 플로우

---

## 8. 결제/포인트 확장 연결(권장)

향후 결제 주체가 보호자가 될 경우:

`payments` 예시

- `id`
- `studentId`
- `payerUserId`
- `payerRole`
- `amountYen`
- `pointsGranted`
- `minutesGranted`
- `status`
- `createdAt`
- `updatedAt`

효과:
- 학생에게 부여된 포인트/시간과
- 누가 결제했는지를 명확히 분리 추적 가능

---

## 9. 핵심 원칙 한 줄

보호자는 학생 데이터를 "대신 소유"하는 계정이 아니라, 학생 데이터에 "권한을 가진 연결 사용자"로 설계한다.

