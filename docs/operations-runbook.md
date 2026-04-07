# MalMoi 운영 대응 매뉴얼 (Runbook)

본 문서는 MalMoi 운영 장애/이슈 대응 시, 운영자가 즉시 실행할 수 있는 기본 매뉴얼입니다.

## 1) 기본 운영 구조

- 앱: Next.js (`malmoi-integrated`)
- 스테이징: 28 서버 (외부 테스트)
- 개발: 교실 맥미니 (내부 전용)
- 인증/데이터 저장: JSON 파일 (`AUTH_STORE_PATH`)
- 메일: SMTP (`MAIL_SEND_MODE=smtp`)
- 데이터 원칙: 운영 데이터는 배포 대상이 아님 (`.data`는 sync 제외)

---

## 2) 서버 재시작 방법

## systemd 기반 (필수)
- 상태 확인:
  - `systemctl status malmoi-web --no-pager`
  - `systemctl status cloudflared --no-pager`
  - `systemctl status nginx --no-pager`
- 재시작:
  - `sudo systemctl restart malmoi-web`
  - `sudo systemctl restart cloudflared`
  - `sudo systemctl restart nginx`

---

## 3) 로그 확인 방법

- 앱 로그:
  - `journalctl -u malmoi-web -n 300 --no-pager`
- 터널 로그:
  - `journalctl -u cloudflared -n 200 --no-pager`
- Nginx 로그:
  - `journalctl -u nginx -n 200 --no-pager`

우선 확인 키워드:
- `[auth] start-registration mail send failed`
- `[auth] request-link mail send failed`
- `status: 5xx`, `token_expired`, `invalid_credentials`

---

## 4) SMTP 문제 확인

필수 환경값:
- `MAIL_SEND_MODE=smtp`
- `MAIL_FROM`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `APP_BASE_URL`
- `APP_URL`
- `BASE_URL`
- `NEXTAUTH_URL`
- `MAIL_LINK_BASE_URL`

확인 순서:
1. 환경값이 현재 프로세스에 실제 반영되었는지 확인  
2. 앱 재시작 후 반영 확인  
3. 등록 API 테스트 (`/api/auth/start-registration`)  
4. 응답에서 `mail.mode=smtp`, `mail.sent=true` 확인  
5. 수신함/스팸함 확인

참조: `docs/mail-delivery-final-checklist.md`

---

## 5) 세션 문제 확인

증상 예시:
- 로그인 후 다시 `/login`으로 이동
- 권한 페이지 접근 시 반복 리다이렉트

점검:
1. 역할별 쿠키 생성 여부
   - `malmoi_session_student`
   - `malmoi_session_admin`
   - `malmoi_session_teacher`
   - `malmoi_session_parent`
2. `APP_BASE_URL`/도메인/HTTPS 일치 여부
3. 서버 시간(토큰 만료 오차) 확인
4. `AUTH_SESSION_TTL_HOURS` 값 확인
5. `/api/auth/session` 응답 확인
6. 동일 브라우저 멀티 로그인(학생+관리자) 간섭 여부 확인

로그아웃 점검:
- 엔드포인트: `POST /api/auth/logout`
- body 예시: `{"role":"student"}` / `{"role":"admin"}`
- 역할 미지정 시 기본 쿠키만 정리될 수 있으므로 운영 점검 시 역할 지정 권장

---

## 6) 인증 문제 대응

증상 예시:
- 비밀번호 로그인 실패
- 재설정 링크 무효
- 최초 로그인 비밀번호 변경 강제 루프

점검:
1. 사용자 식별자(이메일/전화/학생번호) 정규화 값 확인
2. `mustChangePassword` 상태 확인
3. reset token 만료/재사용 여부 확인
4. 역할별 접근 제어(`requireRole`) 동작 확인

---

## 7) 데이터 백업 방법 (JSON 스토어)

대상:
- `AUTH_STORE_PATH` 파일

권장:
1. 배포 전 백업
2. 스테이징 반영 직전 백업
3. 일 1회 자동 백업(압축 + 날짜 버전)
4. 배포 rsync 시 `.data` 제외 (운영 DB 덮어쓰기 방지)

추가 원칙:
- 포털 데이터 생성/수정 주체는 로그인 사용자(학생/관리자/교사/학부모) 액션만 허용
- 운영자가 수동으로 `.data` 파일을 복사/덮어쓰기 하지 않도록 금지

예시:
- 원본: `/srv/malmoi/data/auth-store.json`
- 백업: `/srv/malmoi/backup/auth-store-YYYYMMDD-HHMM.json`

---

## 8) 장애 발생 시 기본 대응 순서

1. 서비스 상태 확인 (`malmoi-web`, `nginx`)
2. 터널 상태 확인 (`cloudflared`)
3. 도메인/HTTPS 상태 확인 (`curl -I https://...`)
4. 앱/터널 로그에서 5xx/연결 오류 확인
5. 환경변수 반영 여부 확인 (특히 URL/SMTP)
6. JSON 저장 경로 권한/용량 확인
7. 최근 변경 배포 롤백 여부 판단

---

## 9) 계정/보안 즉시 조치

- 임시 확인 계정은 인수인계 직후 즉시 비밀번호 변경
- 운영 계정은 관리자만 접근 가능하도록 최소 권한 유지
- 메신저/문서에 평문 비밀번호 공유 금지
- 필요 시 비밀번호 변경 후 세션 강제 로그아웃 수행

---

## 10) 운영 기준 문서 연결

- 개발/스테이징 루틴: `docs/dev-and-staging-workflow.md`
- 배포 절차: `docs/deployment-guide.md`
- 메일 최종 점검: `docs/mail-delivery-final-checklist.md`
- 베타 오픈 체크: `docs/beta-open-checklist.md`
