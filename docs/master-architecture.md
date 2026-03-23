# MalMoi Master Architecture (최종 완성 설계도)

본 문서는 MalMoi의 "최종판 구조 기준"입니다.  
현재 운영은 **A(예약 중심)** 으로 유지하되, 최종 목표는 **C(혼합형: 예약 + 코스 중심)** 입니다.

- 예약 중심 운영을 깨지 않고 점진 확장
- 코스 중심 학습 계획(진도/숙제/평가/결제)을 상위 레이어로 추가
- **인증·연락**: 이메일·전화·학생번호·비밀번호. 외부 메신저(LINE 등) 로그인·연동·푸시 알림은 제공하지 않음
- **알림**: SMTP 메일을 기본으로 하고, 공지·예약·노트·숙제는 포털 UI에서 확인하는 흐름을 우선

---

## 1) 제품 운영 전략: A -> C 로드맵

### 현재: A (예약 중심)
- 시간 슬롯 기반 예약 생성/변경/취소
- 페어/그룹/1:1 예약 운영
- 공지, 포인트/시간, 레슨노트, 보호자 읽기 권한 운영

### 중간: B (예약 + 코스 보조)
- 예약 시 코스/레벨 태그 연결
- 레슨노트/숙제를 코스 단원과 약하게 연결
- 교사 운영 화면에서 코스 진도 확인 가능

### 최종: C (혼합형: 예약 + 코스 중심)
- 예약은 "실행 레이어", 코스는 "학습 설계 레이어"
- 코스 로드맵(단원/목표/평가) 위에서 예약이 실행됨
- 출석/레슨노트/숙제/결제/패키지가 코스 단위 KPI와 연결됨

---

## 2) 전체 사용자 구조

### 역할
- `student`: 본인 학습/예약/공지 확인 및 최소 조작
- `parent`: 연결된 자녀 정보 읽기 중심(권한 플래그 기반)
- `teacher`: 담당 수업 운영(예약 확인, 레슨노트, 출석, 숙제 피드백)
- `admin`: 전체 운영/정책/예외 처리

### 공통 인증 구조
- 로그인 링크 기반 인증 (`/login`, `/api/auth/request-link`, `/api/auth/verify`)
- 세션 기반 역할 분기 (`/login/next`)
- 분기 경로:
  - `student` -> `/student` 또는 `/student/register/*`
  - `parent` -> `/parent`
  - `teacher` -> `/teacher`
  - `admin` -> `/admin`

---

## 3) 사용자별 핵심 흐름

### 학생 흐름
1. 로그인/등록
2. 홈에서 잔여시간/다음예약/공지 확인
3. 예약 생성/변경/취소
4. 수업 후 레슨노트/숙제 확인(확장)
5. 학습 이력/포인트 이력 확인(확장)

### 보호자 흐름
1. 로그인 후 `/parent`
2. 연결 자녀 선택
3. 예약/공지/레슨노트/숙제/출석 조회(권한 기반)
4. 결제/포인트 조회(확장)

### 교사 흐름
1. 로그인 후 `/teacher`
2. 담당 수업 예약 확인
3. `lessonUnitId` 기준 레슨노트 작성/수정
4. 출석 확정/숙제 피드백(확장)

### 관리자 흐름
1. 학생/보호자/교사 관계 관리
2. 예약/슬롯/정책 운영
3. 페어 연결/해제/재설정
4. 공지/포인트-시간 정책 운영
5. 감사로그/예외 처리

---

## 4) 도메인 아키텍처 (최종 기준)

```text
[Identity & Access]
users, loginTokens, sessions, userStudentLinks, studentParents

[Learning Core]
students, courses(확장), courseEnrollments(확장), learningGoals(확장)

[Scheduling]
reservationPolicy, reservationSlots, reservations

[Pairing]
studentPairs, reservations.lessonUnitId, reservations.pairLinkId

[Lesson Intelligence]
lessonNotes, lessonNoteStudents, lessonNoteAttachments(확장)

[Communication]
notices

[Economy]
points, lessonMinutes, lessonMinuteLogs, lessonMinutePackages,
pointConversionRules, pointTimeConversionRules, payments(확장)

[Governance]
auditLogs
```

---

## 5) 예약 시스템 구조 (핵심 엔진)

### 핵심 모델
- `reservationSlots`: 운영 가능한 시간 자원
- `reservations`: 학생별 예약 레코드
- `reservationPolicy`: 슬롯 생성/강사 배정/시간 정책

### 상태 흐름
- `requested -> confirmed -> completed`
- 분기: `cancelled`, `absent`(출석 고도화 시)

### 수업 유형
- `single`
- `open_group`
- `pair`

### 최종 C 모델에서의 위치
- 예약은 코스/단원 실행을 위한 캘린더 실행 계층
- 코스 진도는 예약 완료 이벤트를 통해 전진

---

## 6) 페어 수업 구조

### 관계와 수업 단위 분리
- 관계: `studentPairs` (`active/released`, 시작/해제 이력)
- 수업 단위: `lessonUnitId`
- 관계 연결 키: `pairLinkId`

### 운영 원칙
- 페어 학생은 같은 수업 단위를 공유
- 포인트/시간 차감은 학생별 독립
- 레슨노트는 `lessonUnitId` 기준 공통 공유 가능

---

## 7) 레슨노트 구조

### 설계 원칙
- 수업 공통 내용: `lessonNotes(lessonUnitId 기준)`
- 학생별 차이: `lessonNoteStudents(studentId 기준)`
- 예약 참조: `reservationId` 보조 키

### 현재 + 최종
- 현재: 관리자/교사 CRUD, 보호자 권한 기반 조회
- 최종: 코스 단원 연결, 숙제/평가/피드백 연동

---

## 8) 공지 구조

### 현재
- 관리자 CRUD -> 학생/보호자 읽기
- 중요 공지 배지, 게시 상태 관리

### 최종
- 대상 세분화(학생군/코스군/보호자군)
- 예약/코스 이벤트 기반 자동 공지(확장)

---

## 9) 포인트/시간 구조

### 현재
- `points.balance`
- `lessonMinutes.total/used/remaining`
- 변환 규칙: `pointConversionRules`, `pointTimeConversionRules`

### 최종
- 결제/패키지/구매 이력과 연동
- 환불/조정/감사 추적 강화
- 코스 상품(월정액/패키지)과 연결

---

## 10) 보호자 계정 구조

### 핵심
- `studentParents`로 학생-보호자 연결
- `canViewReservations`, `canViewLessonNotes`, `canViewHomework`, `canViewPayments` 등 권한 분리

### 최종
- 읽기 중심 유지 + 제한적 승인 기능(선택)
- 형제자매/복수 보호자/결제 주체 분리 지원

---

## 11) 향후 확장 위치 (출석/숙제/결제/패키지)

### 출석
- 기본 연결: `reservations` 상태/출석 필드
- 확장: 출석 이벤트 -> 코스 진도/평가 연동

### 숙제
- 기본 연결: `lessonNotes` 및 `lessonUnitId`
- 확장: 코스 단원/마감/제출/피드백 워크플로우

### 결제/패키지
- 기본 연결: 포인트/시간 잔액 변화
- 확장: `payments`, `products`, `orders`, `packageEntitlements`

### 코스 중심 확장
- `courses`, `courseUnits`, `courseEnrollments` 추가
- 예약 완료 시 courseUnit 진행률 자동 갱신

---

## 12) 데이터 저장 전략

### 현재
- JSON 파일 저장(`AUTH_STORE_PATH`) 기반 운영
- 단일 운영자/소규모 베타에 적합

### 전환 조건(중장기)
- 동시 접속/트랜잭션 증가
- 정산/결제/감사 요구 강화
- 이 시점에 DB(PostgreSQL 등) 전환

---

## 13) 운영 원칙 (이번 확정)

- 운영 방향: **현재 A(예약 중심) 유지**
- 최종 목표: **C(예약 + 코스 중심 혼합형)**
- **외부 메신저(LINE 등) 연동 없음** — 알림은 메일 + 포털 내 확인
- 확장 우선순위:
  1) 출석 정교화
  2) 숙제 워크플로우
  3) 결제/패키지
  4) 코스 중심 학습 레이어 완성

---

## 14) Phase별 실행 TODO (이번 달/다음 달)

아래 일정은 "현재 A(예약 중심) 안정 운영"을 유지하면서 "C(혼합형)"으로 가기 위한 최소 실행 기준입니다.

실행 체크박스 버전은 `docs/monthly-execution-checklist.md`를 사용합니다.

### Phase 0 - 즉시 (이번 주)
- [ ] SMTP 실발송 검증 완료 (`mail.sent=true` 2회 이상)
- [ ] 실학생 1~2명 등록/로그인/예약 E2E 리허설 완료
- [ ] 운영 백업/복구 절차 문서화 완료(JSON 스토어 기준)
- [ ] 관리자 일괄 작업(레슨노트 담당 지정) 운영 가이드 공유

### Phase 1 - 이번 달 (A 안정화)
- [ ] 예약 운영 품질 고정
  - [ ] 학생 예약 변경/취소 컷오프 정책 최종값 확정
  - [ ] 관리자 예약 예외 처리 시나리오 점검
- [ ] 페어 운영 고정
  - [ ] 페어 생성/해제/재지정 운영 규칙 확정
  - [ ] `lessonUnitId` 단위 운영 가이드 확정
- [ ] 레슨노트 운영 정착
  - [ ] 교사별 작성 범위 정책 최종 확정
  - [ ] 보호자 공개 기준(`canViewLessonNotes`) 확정

### Phase 2 - 다음 달 (B: 예약 + 코스 보조)
- [ ] 코스 메타데이터 최소 도입
  - [ ] 예약/레슨노트에 코스/단원 태그 연결
  - [ ] 학생/교사 화면에 코스 맥락 표시
- [ ] 출석/숙제 최소 버전
  - [ ] 출석 상태 확정 플로우 도입
  - [ ] 숙제 등록/조회/완료 체크 MVP 도입
- [ ] 보호자 화면 확장
  - [ ] 숙제/출석 조회를 권한 기반으로 노출

### Phase 3 - 차기 분기 (C: 혼합형 전환 시작)
- [ ] 코스 중심 학습 레이어 본격 도입
  - [ ] `courses`, `courseUnits`, `courseEnrollments` 모델 추가
  - [ ] 예약 완료 이벤트와 코스 진도 자동 연결
- [ ] 결제/패키지 확장
  - [ ] `payments`, 상품/패키지, 구매 이력 도입
  - [ ] 포인트/시간 지급/차감 감사 추적 정교화
- [ ] 리포팅/지표
  - [ ] 코스 진도율, 출석률, 숙제 수행률 대시보드 추가

### Phase 완료 기준 (Go/No-Go)
- A 유지 기준:
  - [ ] 예약 실패율/운영 장애가 허용 범위 내
  - [ ] 관리자 수작업 복구 없이 일상 운영 가능
- B 진입 기준:
  - [ ] 코스 태그/출석/숙제 MVP가 교사 운영에 부담을 주지 않음
- C 진입 기준:
  - [ ] 결제/패키지 정산 요구사항과 감사 추적 요구사항 충족

