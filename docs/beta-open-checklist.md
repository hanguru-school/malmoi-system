# MalMoi 외부 베타 오픈 체크리스트

## 1) 실도메인/HTTPS 확인

- 도메인 DNS 확인
  - `dig +short your-domain.example`
  - 기대값: 운영 서버 공인 IP
- HTTPS 응답 확인
  - `curl -I https://your-domain.example/login`
  - 기대값: `HTTP/2 200` 또는 `302`, 인증서 오류 없음
- HTTP -> HTTPS 리다이렉트 확인
  - `curl -I http://your-domain.example/login`
  - 기대값: `301/308` + `Location: https://...`
- 인증서 체인/만료 확인
  - `echo | openssl s_client -connect your-domain.example:443 -servername your-domain.example 2>/dev/null | openssl x509 -noout -dates -issuer -subject`

## 2) 앱 환경값 확인 (서버)

- `APP_BASE_URL=https://your-domain.example` 로 설정되어 있는지 확인
- `HOSTNAME=127.0.0.1`, `PORT=3000` 유지 확인 (Node 직접 외부 노출 금지)
- `AUTH_STORE_PATH` 쓰기 권한 확인
- 서비스 재시작 후 상태 확인
  - `sudo systemctl restart malmoi-web nginx`
  - `systemctl status malmoi-web --no-pager`
  - `systemctl status nginx --no-pager`

## 3) SMTP/메일 발송 확인

- 운영 모드: `MAIL_SEND_MODE=smtp`
- 필수 값 확인
  - `MAIL_FROM`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
- 테스트 API 호출
  - `POST /api/auth/request-link?email=<test-email>&role=student`
  - 기대값: 응답 JSON `mail.sent=true`
- 수신 테스트
  - 실제 메일함에서 수신 여부/스팸함 확인
  - 링크 클릭 시 `/api/auth/verify` -> `/login/next` 분기 확인

## 4) 외부 학생 리허설 (1~2명)

테스트 계정 A/B 각각 동일 절차로 점검:

1. 외부 네트워크에서 `/login` 접속
2. 이메일 입력 -> 로그인 링크 발송
3. 메일 수신/링크 클릭
4. `/student/register/profile` 입력
5. `/student/register/consent` 동의
6. `/student` 진입 확인
7. `/api/auth/session`에서 `role=student`, student 연결 확인

권장 확인 포인트:
- 모바일 브라우저 1종 + 데스크톱 1종
- 링크 만료(토큰 TTL) 동작 확인
- 이미 사용한 링크 재사용 차단 확인

## 5) 문제 발생 시 우선 점검 순서

1. **도메인/HTTPS**
   - DNS, 인증서, 리다이렉트
2. **Nginx -> Node 연결**
   - Nginx 상태, 502 여부, Node 리슨 주소
3. **APP_BASE_URL**
   - 로그인 링크 도메인이 내부 주소로 생성되지 않는지 확인
4. **SMTP**
   - `mail.sent`, 서버 로그의 `mail send failed`, SMTP 자격증명/포트
5. **앱 로그**
   - `journalctl -u malmoi-web -n 300 --no-pager`
6. **데이터 파일 권한**
   - `AUTH_STORE_PATH` 읽기/쓰기 가능 여부

## 6) 베타 오픈 전 최소 완료 기준

- [ ] HTTPS 정상, 인증서 유효
- [ ] `APP_BASE_URL` 실도메인 반영 완료
- [ ] SMTP 실제 수신 테스트 성공 (최소 2회)
- [ ] 외부 학생 리허설 A/B 완료
- [ ] 장애 시 점검 순서 운영자 공유 완료
- [ ] 백업/복구 경로 확인 완료
