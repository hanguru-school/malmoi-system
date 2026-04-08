## MalMoi Integrated (운영 기준 Intro + Login + Role Areas)

`malmoi-integrated`는 MalMoi 시스템의 운영용 기준 Next.js 프로젝트입니다.

현재 단계 목표는 **공통 로그인 유지 + 역할별 영역 분리 + 학생 최초 등록 흐름 최소 구현**입니다.

## 운영 문서 허브

- 문서 인덱스: `docs/README.md`
- 개발/스테이징 루틴: `docs/dev-and-staging-workflow.md`
- 운영 대응 매뉴얼: `docs/operations-runbook.md`
- **Git 기반 서버 배포**: `docs/DEPLOY_GIT.md`（`npm run deploy` / Cursor Task）
- **Actions에서 버튼 배포**: `docs/deploy-one-click-ko.md`（`.github/workflows/deploy-production.yml`）

## Git 배포 (요약)

1. 원격 `origin` 이 `main` 을 가리키도록 설정
2. 서버 `/home/malmoi_deploy/apps/malmoi` 에 clone 후 `chmod +x deploy/deploy-prod.sh`
3. 로컬에 `scripts/deploy.env` 생성 (`scripts/deploy.env.example` 참고)
4. 배포: `npm run deploy` 또는 Cursor 작업 **MalMoi: Push main + deploy (SSH)**

자세한 절차·sudo 설정은 `docs/DEPLOY_GIT.md` 를 참고하세요.

## 현재 구현 범위

- Intro 페이지: `/`
- 공통 Login 페이지: `/login` (학생/관리자/선생님 확장 구조)
- 로그인 다음 경로: `/login/next` (세션/역할/등록상태 기반 분기)

### 인증 API

- `POST /api/auth/request-link`
- `GET /api/auth/verify`
- `GET /api/auth/session`
- `POST /api/auth/logout`
- `POST /api/auth/start-registration` (학생 최초 등록 시작)
- 로그인 링크는 개발환경에서는 URL 표시/로그 중심(`MAIL_SEND_MODE=log`), 운영환경에서는 SMTP 발송(`MAIL_SEND_MODE=smtp`)을 기본으로 사용합니다.

### 학생 영역

- 등록 시작: `/student/register/start`
- 개인정보 입력: `/student/register/profile`
- 규정 동의: `/student/register/consent`
- 학생 홈: `/student`
- 학생 개인정보: `/student/profile`
- 학생 예약/공지: `/student/reservations`, `/student/notices`

### 관리자 영역

- 관리자 홈: `/admin`
- 학생 상세/수정: `/admin/students/[id]`
- 학생 목록 검색/필터: `/api/admin/students?q=...&registrationStatus=...&consentStatus=...&linked=...`
- 최근 상태 이력 조회: `/api/admin/audit-logs?limit=30`
- 학생 목록 페이징: `/api/admin/students?page=1&pageSize=10`
- 이력 필터: `action`, `fromDate`, `toDate`, `studentId`, `page`, `pageSize`

### 예약 영역

- 학생 예약 화면: `/student/reservations`
- 관리자 예약 화면: `/admin/reservations`
- 학생 예약 API: `GET/POST /api/student/reservations`, `POST /api/student/reservations/[id]/cancel`
- 학생 예약 변경 API: `PATCH /api/student/reservations/[id]`
- 관리자 예약 API: `GET /api/admin/reservations`, `PATCH /api/admin/reservations/[id]`
- 슬롯 API: `GET /api/student/reservation-slots`, `GET /api/admin/reservation-slots`
- 예약 상태: `requested` -> `confirmed` -> `completed` (또는 `cancelled`)
- 기본 슬롯 모델: `reservationSlots` (date/time/duration/capacity/status)
- 학생 직접 변경/취소 제한: 수업 시작 전 `RESERVATION_STUDENT_CHANGE_CUTOFF_MINUTES`, `RESERVATION_STUDENT_CANCEL_CUTOFF_MINUTES`

## 데이터 구조 원칙

- 로그인 계정: `users`
- 로그인 토큰: `loginTokens`
- 세션: `sessions`
- 학생 엔티티(분리): `students`
- 계정-학생 연결: `userStudentLinks`
- 감사 로그: `auditLogs`
- 예약 엔티티: `reservations` (`studentId` 기준 연결)
- 슬롯 엔티티: `reservationSlots`

학생 개인정보는 `crmProfile`로 정규화해 저장합니다.
- `addressLine1`, `addressLine2`, `postalCode`
- `birthDate`
- `phoneMobile`, `phoneEmergency`
- `notes`

## 예약 시스템 연결 기준 (다음 단계 준비)

- 예약은 `users`가 아니라 **`students.id` 기준**으로 연결합니다.
- 로그인 계정(`users`)과 학생 엔티티(`students`)는 `userStudentLinks`로 분리/연결 유지합니다.
- 화면 분리는 역할별로 유지합니다.
  - 학생 화면: 내 예약/내 정보 중심(`student/*`)
  - 관리자 화면: 전체 예약 관리/검토 중심(`admin/*`)
- 같은 예약 데이터라도 조회 기준은 역할에 따라 다르게 둡니다.
  - 학생: 본인 `studentId`만 접근
  - 관리자: 다수 `studentId` 검색/필터/수정 가능

저장소는 `AUTH_STORE_PATH` JSON 파일 기반입니다.

## 현재 보류 항목

- 공지 실제 로직
- 교사 영역 실제 로직
- DB 영속화 (현재는 JSON 스토어)

## 환경 변수

- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_INTRO_URL` (선택)
- `NEXT_PUBLIC_LOGIN_URL` (선택)
- `NEXT_PUBLIC_LOGIN_NEXT_URL` (선택)
- `APP_BASE_URL`
- `AUTH_STORE_PATH`
- `AUTH_TOKEN_TTL_MINUTES`
- `AUTH_SESSION_TTL_HOURS`
- `AUTH_ADMIN_EMAILS` (쉼표 구분 관리자 이메일 목록)
- `RESERVATION_STUDENT_CHANGE_CUTOFF_MINUTES`
- `RESERVATION_STUDENT_CANCEL_CUTOFF_MINUTES`
- `MAIL_SEND_MODE` (`log` | `smtp` | `disabled`)
- `MAIL_FROM`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
