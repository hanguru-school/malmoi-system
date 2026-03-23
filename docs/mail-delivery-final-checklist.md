# MalMoi 등록 메일 최종 점검표

이 문서는 학생 최초 등록 메일이 실제 운영에서 정상 동작하는지 최종 확인하기 위한 체크리스트입니다.

## 1) 환경값 확인

- [ ] `MAIL_SEND_MODE=smtp`
- [ ] `MAIL_FROM` 설정 (표시명 포함 가능)
- [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`
- [ ] `SMTP_USER`, `SMTP_PASS`
- [ ] `APP_BASE_URL`가 실도메인 HTTPS

## 2) 서버 재시작 확인

- [ ] 앱 재시작 완료 (`npm run dev` 또는 운영 프로세스 재기동)
- [ ] 시작 로그에 환경 반영 확인 (`.env.local` 또는 운영 env)

## 3) 등록 메일 발송 테스트

학생 등록 화면(`/student/register/start`)에서:

- [ ] `お名前 (漢字)` 입력
- [ ] `フリガナ` 입력
- [ ] `メールアドレス` 입력
- [ ] `確認メールを送信` 클릭

API 기준 성공 조건:

- [ ] 응답 `ok=true`
- [ ] `mail.mode=smtp`
- [ ] `mail.sent=true`

## 4) 수신 메일함 확인

- [ ] 받은편지함 도착 확인
- [ ] 스팸함 도착 여부 확인
- [ ] 발신자 표시명 깨짐 여부 확인 (`MalMoi 韓国語教室`)
- [ ] 링크 도메인이 `APP_BASE_URL`과 일치하는지 확인

## 5) 링크 클릭 동작 확인

- [ ] 메일 링크 클릭 시 `/api/auth/verify?...` 호출
- [ ] 최종 이동 경로가 `/student/register/consent`인지 확인
- [ ] 동의 체크 후 `/student/register/profile`로 이동하는지 확인

## 6) 실패 시 점검 순서

1. `MAIL_SEND_MODE`가 `smtp`인지 확인  
2. SMTP 인증값(특히 `SMTP_PASS`) 재확인  
3. `MAIL_FROM` 도메인 정책(SPF/DKIM/DMARC) 확인  
4. 서버 로그에서 `[auth] ... mail send failed` 확인  
5. `APP_BASE_URL` 오타/내부주소 설정 여부 확인

## 7) 현재 정책 메모

- 등록 시작 화면에 개발용 직접 링크(`登録認証リンクを開く`)는 노출하지 않음
- 인증 링크는 반드시 이메일로만 전달
- 링크 클릭 후 동의 페이지(`/student/register/consent`) 먼저 진입

