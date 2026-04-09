# Git 기반 자동 배포 (MalMoi)

**유일한 코드 원본:** GitHub `main`. 서버는 `git fetch` → `origin/main`에 **hard reset** → **`.next` 삭제** → `npm ci` → `npm run build` → `sudo systemctl restart malmoi-web` 를 **한 경로**에서만 수행합니다.

**정답 경로(실행·Git clone 루트):** `/srv/malmoi/apps/malmoi-integrated/current`

**런타임 데이터** (`.data/` 등)는 Git에 포함하지 않으며, 배포 스크립트도 해당 디렉터리를 건드리지 않습니다.

## 1. 원격 저장소 (GitHub)

1. 저장소에 **로컬**에서 푸시:

   ```bash
   cd /path/to/malmoi-integrated
   git remote add origin git@github.com:YOUR_ORG/malmoi-integrated.git
   git push -u origin main
   ```

2. 서버 clone용 **배포 전용** SSH 키 또는 Deploy key 를 저장소에 등록합니다.

## 2. 서버 초기 설정 (최초 1회)

MalMoi 서버 구조 원칙에 맞게 **웹 앱은 `/srv/malmoi/apps/`** 아래에 둡니다.

```bash
sudo mkdir -p /srv/malmoi/apps/malmoi-integrated
sudo chown -R malmoi_deploy:malmoi_deploy /srv/malmoi/apps/malmoi-integrated
sudo -u malmoi_deploy -H bash -lc '
  cd /srv/malmoi/apps/malmoi-integrated
  git clone git@github.com:YOUR_ORG/malmoi-integrated.git current
  cd current
  chmod +x deploy/deploy-prod.sh deploy/deploy-now.sh
'
```

운영 환경 변수는 **서버에만** 둡니다:

```bash
sudo -u malmoi_deploy nano /srv/malmoi/apps/malmoi-integrated/current/.env.production
```

`systemd` 는 `deploy/systemd/malmoi-web.service` 를 복사·설치하고 `WorkingDirectory` 가 위 `current` 와 일치하는지 확인합니다.

### sudo (systemctl / journalctl) 무패스워드

비대화형 SSH·GitHub Actions 에서 `sudo -n systemctl` 이 동작하려면 **제한적** NOPASSWD 가 필요합니다. 저장소 예시:

- `deploy/sudoers/malmoi-web-systemctl.nopasswd.example`

서버에서 (root):

```bash
sudo cp /srv/malmoi/apps/malmoi-integrated/current/deploy/sudoers/malmoi-web-systemctl.nopasswd.example \
  /etc/sudoers.d/malmoi-web-systemctl
sudo chmod 0440 /etc/sudoers.d/malmoi-web-systemctl
sudo chown root:root /etc/sudoers.d/malmoi-web-systemctl
sudo visudo -cf /etc/sudoers.d/malmoi-web-systemctl
```

파일 안의 `malmoi_deploy` 를 실제 배포 계정으로 바꿉니다.

### 레거시 `/home/malmoi_deploy/apps/malmoi`

과거 경로는 **운영 기준에서 제외**합니다. 이미 해당 경로만 쓰는 경우:

1. 위 절차로 `/srv/malmoi/.../current` 에 clone 후 `.env.production` 등 필요 파일만 복사
2. `systemd` 유닛의 `WorkingDirectory` 를 `current` 로 변경 후 `daemon-reload` 및 재시작
3. (선택) 혼동 방지용으로 예전 디렉터리는 비우거나 이름을 `malmoi.legacy-disabled` 등으로 변경

## 3. 로컬 설정 (Cursor / 맥)

```bash
cp scripts/deploy.env.example scripts/deploy.env
# 편집: MALMOI_DEPLOY_SSH=malmoi_deploy@서버IP또는도메인
```

## 4. 배포 실행

**푸시 + 서버 배포:**

```bash
npm run deploy
bash scripts/deploy-from-local.sh "fix: 예약 UI"
```

**푸시 없이 서버만** GitHub 기준으로 재배포:

```bash
npm run deploy:server
bash deploy-now.sh
```

서버에 직접 로그인한 경우:

```bash
cd /srv/malmoi/apps/malmoi-integrated/current
bash deploy/deploy-now.sh
# 또는
bash deploy/deploy-prod.sh
```

**Cursor:** `Tasks: Run Task` → `MalMoi: Push main + deploy (SSH)`

동작 요약 (`deploy-prod.sh`):

1. `git fetch` + `checkout` + **`git reset --hard origin/<ref>`**
2. **`rm -rf .next`**
3. `npm ci` (또는 install) → `npm run build`
4. `sudo -n systemctl restart malmoi-web` 및 헬스 체크

## 5. GitHub Actions

- `deploy-main.yml`: `main` 푸시 시 원격에서 기본 스크립트 경로  
  `/srv/malmoi/apps/malmoi-integrated/current/deploy/deploy-prod.sh`
- `deploy-production.yml`: Secret `DEPLOY_APP_DIR` = `/srv/malmoi/apps/malmoi-integrated/current`

## 6. 안전 동작

- `npm run build` **실패 시** `systemctl restart` 는 실행되지 않습니다.
- 배포 로그: 서버 `deploy/logs/deploy-prod-*.log`
- 서버 로컬 수정이 있어도 **reset --hard** 로 원격 `main` 과 맞춥니다 (미커밋 변경은 사라짐).

## 7. 기타

- `deploy/safe-deploy-28.sh` 등 rsync 기반은 **레거시**입니다. 기준은 **GitHub `main` + `deploy/deploy-prod.sh`** 입니다.
- 경로 한눈 요약: `docs/deploy-path-srv-ko.md`
