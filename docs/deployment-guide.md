# MalMoi 배포 가이드 (맥 -> 28 서버 단독 운영)

본 문서는 Mac에서 개발한 내용을 28 서버에 반영하고, 서버 단독으로 운영하는 표준 절차입니다.

## 1) 배포 대상 단위 확인

아래 중 하나가 "테스트 가능한 단위"로 완성되었는지 확인:
- 학생 등록 흐름
- 로그인/비밀번호 재설정 흐름
- 학생 예약 화면
- 관리자 예약 화면
- 보호자 화면
- 레슨노트 흐름

기능 1개 수정마다 즉시 배포하지 않고, 단위로 묶어 반영합니다.

---

## 2) 맥미니 반영 전 준비

1. 변경사항 정리
2. lint/build 확인
   - `npm run lint`
   - `npm run build`
3. 주요 동선 수동 점검
   - 로그인/등록/동의/프로필
   - 학생/보호자/관리자 기본 접근

---

## 3) 반영 원칙

1. Mac은 개발/업로드 전용
2. 실제 서비스 실행은 28 서버 systemd(`malmoi-web`, `cloudflared`)만 사용
3. 서버에서는 `npm run build` + `npm run start`(production)만 허용
4. `npm run dev`/임시 터널/수동 세션 실행 금지
5. 운영 데이터(`.data`)는 코드 배포 대상에서 항상 제외

데이터 보호 원칙:
- 코드 변경/배포는 UI/로직 반영만 수행
- 기존 운영 데이터(학생/관리자/교사/학부모/예약/노트)는 배포로 덮어쓰지 않음
- 데이터 생성/수정은 포털에 접속한 사용자 액션(API)으로만 발생

---

## 4) 28 서버 반영 절차 (고정)

1. 코드 업로드(예: rsync) → `/home/malmoi_deploy/apps/malmoi`
   - 반드시 `.data` 제외 (운영 계정/잠금/비밀번호 상태 보존)
   - 예시:
     - `rsync -avz --delete --exclude .git --exclude node_modules --exclude .next --exclude .data ./ malmoi_deploy@<server>:/home/malmoi_deploy/apps/malmoi/`
   - 또는 안전 스크립트 실행:
     - `bash deploy/safe-deploy-28.sh`
2. 서버에서 패키지 설치
   - `npm install`
3. 서버에서 production build
   - `npm run build`
4. 환경변수 확인
   - `APP_BASE_URL`, `APP_URL`, `BASE_URL`, `NEXTAUTH_URL`, `MAIL_LINK_BASE_URL` = `https://portal.hanguru.blog`
   - `MAIL_SEND_MODE=smtp`, `SMTP_*`, `MAIL_FROM`
5. 서비스 재시작
   - `sudo systemctl restart malmoi-web`
   - `sudo systemctl restart nginx`
6. 확인
   - `systemctl is-active malmoi-web cloudflared`
   - `curl -I https://portal.hanguru.blog/login`
   - `curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/login` (내부 포트)

### UI가 배포 후에도 안 바뀔 때

1. **실제 실행 경로 확인**  
   배포 스크립트는 보통 `~/apps/malmoi` 등으로 rsync 한다. systemd 유닛이 **같은 경로**를 쓰는지 확인한다.  
   - `systemctl cat malmoi-web` → `WorkingDirectory`, `ExecStart`에 적힌 디렉터리가 rsync 대상과 일치해야 한다.

2. **서버에 소스가 들어갔는지 확인** (예시)
   - `grep -r "緊急連絡先の氏名（漢字）" ~/apps/malmoi/app/student/profile/ || echo "소스 없음"`
   - 문자열이 없으면 **다른 폴더에 배포** 중이거나 **빌드 전**이다.

3. **Cloudflare 등 CDN**  
   캐시 퍼지(Purge Everything) 후 시크릿 창에서 다시 연다.

4. **브라우저에서 최신 번들 여부**  
   개인정보 수정 화면에서 개발자 도구로 `<form>`을 보면 `data-profile-edit="emergency-v2-kanji-relation-select"` 속성이 있어야 한다. 없으면 **옛 JS**다.

---

## 5) 반영 후 확인 체크리스트

- [ ] 외부 접속 가능
- [ ] HTTPS 정상
- [ ] 로그인 동작 정상
- [ ] 학생 등록 메일 수신 가능
- [ ] 메일 링크 클릭 후 동선 정상
- [ ] 학생/보호자/관리자 권한 정상
- [ ] 모바일 화면 레이아웃 정상
- [ ] 세션/쿠키 문제 없음
- [ ] 동일 브라우저에서 학생/관리자 동시 로그인 시 세션 간섭 없음
- [ ] 역할별 로그아웃(`POST /api/auth/logout`, body `{"role":"student|admin|teacher|parent"}`) 정상

---

## 6) 롤백 기준 및 방법

롤백 기준:
- 로그인 불가
- 등록 메일 발송 불가
- 주요 페이지 500 에러

롤백 방법(운영 구조에 맞춰 선택):
1. 이전 안정 릴리스로 코드 되돌림
2. 서비스 재시작
3. 핵심 동선 재검증

---

## 7) 배포 후 문서 업데이트

배포 후 아래 문서에 테스트 결과 기록:
- `docs/monthly-execution-checklist.md`
- `docs/mail-delivery-final-checklist.md`
- 필요 시 `docs/operations-runbook.md`에 장애/대응 이력 반영
