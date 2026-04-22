# MalMoi 전체 시스템 아키텍처

본 문서는 MalMoi의 전체 시스템 구조를 운영/확장 관점에서 정리한 기준 문서입니다.

## 1) 시스템 개요

- 포털 도메인 역할: `portal.hanguru.blog` (MalMoi 학생/보호자/교사/관리자 포털)
- 스테이징 운영 서버: 28 서버
- 개발 환경: 교실 맥미니
- 데이터 저장: JSON 파일(`AUTH_STORE_PATH`)
- 메일 발송: SMTP (`MAIL_SEND_MODE=smtp`)

---

## 2) 사용자/역할 구조

### 학생 (Student)
- 로그인
- 최초 등록(메일 인증 -> 규정 동의 -> 개인정보 입력)
- 예약/공지/개인정보/비밀번호 변경

### 보호자 (Parent)
- 연결된 자녀 조회
- 예약/공지/레슨노트 등 읽기(권한 플래그 기반)

### 교사 (Teacher)
- 담당 수업 관련 화면
- 레슨노트 작성/수정(권한 범위 내)

### 관리자 (Admin)
- 학생/예약/공지/정책/페어/감사로그 관리

---

## 3) 인증 구조

현재 기준 인증 축:

1. ID/비밀번호 로그인 (학생 메인)
2. 비밀번호 재설정 링크
3. 세션 쿠키 기반 접근 제어
4. 최초 로그인 강제 비밀번호 변경(`mustChangePassword`)

핵심 데이터:
- `users` (`passwordHash`, `mustChangePassword` 포함)
- `sessions`
- `loginTokens` (등록/링크 인증)
- `passwordResetTokens` (재설정 전용 1회성 토큰)
- `userStudentLinks`

---

## 4) 등록/로그인 흐름 (학생)

```text
학생 등록 시작
 -> 확인 메일 발송
 -> 메일 링크 클릭
 -> /student/register/consent (규정/입회 동의)
 -> /student/register/profile (개인정보 입력)
 -> 등록 완료(studentNumber 생성 + 초기비번 + mustChangePassword=true)
 -> 로그인
 -> /password/change-required
```

운영 원칙:
- 화면에 개발용 직접 링크 노출 금지
- 인증 링크는 이메일로만 전달

---

## 5) 28 서버 데이터 역할

- 외부 테스트용 스테이징 데이터 저장소 역할
- 실제 SMTP/도메인/HTTPS 동작 검증 데이터 보관
- 정식 공개 전 운영 시나리오 검증 데이터 축적

주의:
- JSON 저장 특성상 정기 백업 필수

---

## 6) SMTP 메일 시스템

필수 환경 변수:
- `MAIL_SEND_MODE=smtp`
- `MAIL_FROM`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `APP_BASE_URL`

메일 사용 영역:
- 학생 등록 확인 메일
- 로그인 링크(운영 정책에 따라)
- 비밀번호 재설정 메일

---

## 7) 도메인/서비스 역할

- `hanguru.blog` -> 메인 사이트
- `portal.hanguru.blog` -> MalMoi 포털
- `hanguru.blog` -> 블로그

권장:
- 스테이징 검증 완료 후 `portal.hanguru.blog` 정식 연결

---

## 8) 핵심 도메인 모델

- 학생/관계
  - `students`, `studentParents`, `studentPairs`
- 예약
  - `reservationSlots`, `reservations`, `reservationPolicy`
- 학습기록
  - `lessonNotes`, `lessonNoteStudents`
- 운영/정책
  - `notices`, `auditLogs`
  - `points`, `lessonMinutes`
  - `pointConversionRules`, `pointTimeConversionRules`

---

## 9) 향후 확장 방향

### 결제
- `payments`, 상품/패키지, 구매 이력
- 포인트/시간 지급/차감과 연결

### 숙제
- 레슨노트/수업단위(`lessonUnitId`) 기반 연결
- 학생 제출/교사 피드백 워크플로우

### 통계
- 출석률, 예약 이행률, 숙제 수행률
- 학생/교사/관리자별 대시보드 지표

---

## 10) 연계 문서

- 운영 루틴: `docs/dev-and-staging-workflow.md`
- 운영 대응: `docs/operations-runbook.md`
- 배포 절차: `docs/deployment-guide.md`
- 메일 최종 점검: `docs/mail-delivery-final-checklist.md`

