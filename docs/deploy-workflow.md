# MalMoi 배포 워크플로우 (운영)

기준 구조는 **Git push -> 서버 pull -> build -> restart -> health check** 입니다.
수동 `scp`/수동 파일 복사는 사용하지 않습니다.

## 1) 로컬 수정 후 배포 순서 (Cursor)

1. 코드 수정
2. `git add -A`
3. `git commit -m "작업 내용"`
4. `git push origin main`
5. SSH 로 서버에서 `deploy/deploy-prod.sh` 실행 (경로는 `/srv/malmoi/apps/malmoi-integrated/current`)

위 과정을 한 번에 실행:

```bash
npm run deploy
```

또는 Cursor Task:

- `MalMoi: Push main + deploy (SSH)`

## 2) 서버 배포 스크립트

경로:

- `/srv/malmoi/apps/malmoi-integrated/current/deploy/deploy-prod.sh`

동작:

1. 작업 경로 검증 (`DEPLOY_APP_DIR`, 기본 `.../current`)
2. `git fetch` + `checkout` + **`git reset --hard origin/<ref>`**
3. **`rm -rf .next`**
4. `npm ci --include=dev` (lock 없으면 `npm install --include=dev`)
5. `npm run build`
6. 빌드 성공 시에만 `sudo systemctl restart malmoi-web`
7. 내부 헬스체크 `curl -I http://127.0.0.1:3000/login`
8. 상태/로그 출력 (`systemctl status`, `journalctl`)

## 3) 실패 시 확인 방법

### build 실패

- 서비스 재시작이 실행되지 않음 (의도된 안전 동작)
- 서버 로그 확인:

```bash
cd /srv/malmoi/apps/malmoi-integrated/current
ls -lt deploy/logs | head
```

### 서비스 상태 확인

```bash
sudo systemctl status malmoi-web --no-pager
sudo journalctl -u malmoi-web -n 100 --no-pager
```

### 내부/외부 응답 확인

```bash
curl -I http://127.0.0.1:3000/login
curl -I https://portal.hanguru.blog/login
```

## 4) 롤백 전 기본 점검 순서

1. 현재 커밋 확인: `git rev-parse --short HEAD`
2. 직전 커밋 확인: `git log --oneline -n 5`
3. 환경파일 보존 확인: `.env.local`, `.env.production` 수정 여부
4. `systemctl status` / `journalctl` 로 실패 원인 먼저 확인
5. 필요 시 운영자가 승인한 커밋으로 `git checkout <commit>` 후 build/restart

## 5) 환경 파일 보호 원칙

- `.env.local`, `.env.production`, 비밀키 파일은 Git으로 배포하지 않음
- `.gitignore`에서 환경 파일 제외 유지
- 배포 스크립트는 코드/의존성/빌드/재시작만 수행하고 환경파일을 덮어쓰지 않음
