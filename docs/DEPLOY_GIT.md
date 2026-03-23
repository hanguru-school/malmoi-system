# Git 기반 자동 배포 (MalMoi)

로컬에서 `main` 브랜치로 푸시한 뒤, 서버가 `git pull` → `npm ci` → `npm run build` → `systemctl restart malmoi-web` 까지 수행합니다.

**런타임 데이터** (`.data/` 등)는 Git에 포함하지 않으며, 배포 스크립트도 해당 디렉터리를 건드리지 않습니다.

## 1. 원격 저장소 (GitHub 등)

1. 비공개 저장소 생성 후 **로컬**에서:

   ```bash
   cd /path/to/malmoi-integrated
   git remote add origin git@github.com:YOUR_ORG/malmoi-integrated.git
   git push -u origin main
   ```

2. 서버에서 clone 할 **배포 전용** SSH 키 또는 Deploy key 를 저장소에 등록합니다.

## 2. 서버 초기 설정 (최초 1회)

경로: `/home/malmoi_deploy/apps/malmoi`

```bash
sudo mkdir -p /home/malmoi_deploy/apps
sudo chown -R malmoi_deploy:malmoi_deploy /home/malmoi_deploy/apps
sudo -u malmoi_deploy -H bash -lc '
  cd /home/malmoi_deploy/apps
  git clone git@github.com:YOUR_ORG/malmoi-integrated.git malmoi
  cd malmoi
  chmod +x deploy/deploy.sh
'
```

운영 환경 변수는 **서버에만** 둡니다 (Git에 올리지 않음):

```bash
# 예: .env.production 은 서버에서만 유지 (로컬 .gitignore와 동일 원칙)
sudo -u malmoi_deploy nano /home/malmoi_deploy/apps/malmoi/.env.production
```

`systemd` 유닛은 `deploy/systemd/malmoi-web.service` 를 참고합니다.

### sudo (systemctl) 무패스워드

배포 사용자가 비대화형 SSH로 재시작하려면 예:

```text
malmoi_deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart malmoi-web, /bin/systemctl is-active malmoi-web
```

`sudo visudo` 로 추가합니다.

## 3. 로컬 설정 (Cursor / 맥)

```bash
cp scripts/deploy.env.example scripts/deploy.env
# 편집: MALMOI_DEPLOY_SSH=malmoi_deploy@서버IP또는도메인
```

SSH 키 로그인이 되어 있어야 합니다 (`~/.ssh/config` 호스트 별칭 사용 가능).

## 4. 배포 실행

**터미널:**

```bash
npm run deploy
# 또는 커밋 메시지 지정:
bash scripts/deploy-from-local.sh "fix: 예약 UI"
```

**Cursor:** `Tasks: Run Task` → `MalMoi: Push main + deploy (SSH)`

동작 요약:

1. 변경 있으면 `git add` + `git commit`
2. `git push origin main`
3. SSH 로 서버에서 `deploy/deploy.sh` 실행

서버만 다시 돌리기 (푸시 없이):

```bash
npm run deploy:server
```

## 5. 안전 동작

- `npm run build` **실패 시** `systemctl restart` 는 실행되지 않습니다.
- 배포 로그: 서버 `deploy/logs/deploy-*.log`
- `git pull --ff-only` — 서버에 수동 수정이 꼬이면 pull 이 실패하고 재시작하지 않습니다.

## 6. 기존 rsync 방식

`deploy/safe-deploy-28.sh` 는 **레거시**입니다. 새로운 기준은 **Git push + 서버 `deploy/deploy.sh`** 입니다.
