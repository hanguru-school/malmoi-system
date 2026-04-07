# 메일 발송 + 실학생 소규모 테스트 운영 점검표

본 문서는 "지금 바로 1~2명 실학생 베타 테스트를 시작할 수 있는지"를 점검하기 위한 실행 문서입니다.  
기준: 현재 MalMoi는 JSON 저장(`AUTH_STORE_PATH`) 구조를 유지합니다.

---

## 1) 현재 코드 기준 결론

### 메일 발송 기능
- 구현되어 있음 (`lib/auth/email.js`, `nodemailer` 사용)
- 동작 모드:
  - `MAIL_SEND_MODE=log` -> 콘솔 출력(실메일 미발송)
  - `MAIL_SEND_MODE=smtp` -> 실제 SMTP 발송
  - `MAIL_SEND_MODE=disabled` -> 발송 비활성

### 학생 등록/로그인 테스트 흐름
- 구현되어 있음
  - `POST /api/auth/start-registration` (학생 등록 시작 + 링크 생성)
  - `POST /api/auth/request-link` (일반 로그인 링크 생성)
  - `/api/auth/verify` -> `/login/next` 분기
- 즉, **설정만 맞으면 실학생 1~2명 테스트 가능**

---

## 2) 실메일 발송 필수 설정

아래 값이 모두 유효해야 `mail.sent=true`를 기대할 수 있습니다.

- `MAIL_SEND_MODE=smtp`
- `MAIL_FROM=<발신 주소>`
- `SMTP_HOST=<호스트>`
- `SMTP_PORT=<포트>`
- `SMTP_SECURE=true|false`
- `SMTP_USER=<계정>` (서버 정책에 따라 선택)
- `SMTP_PASS=<비밀번호>` (서버 정책에 따라 선택)
- `APP_BASE_URL=https://실도메인` (링크 도메인 정확성)

참고:
- 현재 예시 파일: `.env.development.example`, `.env.production.example`, `.env.example`
- SMTP 값이 비어 있으면 smtp 모드에서 에러 발생 가능

---

## 3) 운영 전 즉시 점검 (체크리스트)

### 앱/스토리지
- [ ] `AUTH_STORE_PATH` 경로 존재 및 읽기/쓰기 권한 확인
- [ ] 서버 재시작 후 앱 정상 응답 (`/login`)
- [ ] JSON 저장 파일 백업 경로 확인

### 메일
- [ ] `MAIL_SEND_MODE=smtp`
- [ ] SMTP/발신자 설정 완료
- [ ] 테스트 이메일로 `POST /api/auth/request-link` 호출
- [ ] 응답에서 `mail.sent=true` 확인
- [ ] 수신함/스팸함에서 실제 수신 확인

### 학생 등록 리허설 (A/B 2명 권장)
- [ ] `/login` 또는 등록 시작 화면 진입
- [ ] 링크 수신 -> 링크 클릭
- [ ] `/student/register/profile` 입력
- [ ] `/student/register/consent` 동의
- [ ] `/student` 홈 진입 확인

---

## 4) 실학생 1~2명 테스트 운영 가능 여부

### 가능한 상태
- 현재 구조(JSON 저장)로도 **소규모 베타 테스트 가능**
- 조건:
  - SMTP 실발송 설정 완료
  - `APP_BASE_URL` 실도메인 정확히 설정
  - `AUTH_STORE_PATH` 쓰기 권한 보장
  - 운영자가 백업/복구 절차 보유

### 주의 사항
- JSON 저장은 소규모/저동시성에 적합
- 동시 사용자 증가 시 파일 잠금/운영 복잡도 증가 가능
- 베타 단계에서는 "일일 백업 + 장애시 복구 절차" 필수

---

## 5) 권장 베타 운영 절차 (이번 주기)

1. SMTP 설정 반영 후 서버 재기동  
2. 테스트 메일 2회 발송 성공 확인 (`mail.sent=true`)  
3. 실학생 A/B 온보딩 리허설  
4. 예약 1건 생성/변경/취소 E2E 확인  
5. 문제 없으면 소규모 실제 운영 시작

---

## 6) 장애 발생 시 우선 점검 순서

1. `APP_BASE_URL`이 내부 주소로 잘못 설정되지 않았는지
2. SMTP 인증/포트/보안(`SMTP_*`, `MAIL_FROM`)
3. 서버 로그의 `[auth] ... mail send failed` 확인
4. `AUTH_STORE_PATH` 읽기/쓰기 권한 확인
5. 베타 운영 체크리스트(`docs/beta-open-checklist.md`) 재실행

