# 자동 검수·자동 배포 운영 가이드 (MalMoi)

## 원칙

- **운영 반영은 `main` 브랜치만** 사용합니다.
- **`db-check-update`** 는 개발·검수용 브랜치이며, 이 브랜치로는 자동 배포를 실행하지 않습니다.
- GitHub Actions **CI**는 `main`, `db-check-update` 에 대한 push·PR 에서 `npm ci`, `npm run build`, `scripts/ci-verify.mjs` 를 실행합니다.
- **`main` 에 push** 되면 (별도 설정 시) **Deploy production** 워크플로가 SSH 로 서버에서 `deploy/deploy-prod.sh` 만 실행합니다.

## 서버 측 배포 스크립트

- 경로 예: `/srv/malmoi/apps/malmoi-integrated/current/deploy/deploy-prod.sh`
- **기본 모드** (`MALMOI_USE_RELEASES` 미설정 또는 `0`): **`/srv/malmoi/apps/malmoi-integrated/current`** 에서 `git fetch`·`reset --hard origin/main`·**`rm -rf .next`** 후 `npm ci`·`npm run build`·`systemctl restart`.
- **릴리스 모드** (`MALMOI_USE_RELEASES=1`): `releases/<타임スタンプ>-<커밋>` 에 `git archive` 로 트리를 풀고 빌드한 뒤, **`current` 심볼릭 링크만 원자적으로 교체**합니다. 빌드 실패 시 새 디렉터리만 삭제하고 **기존 `current` 는 유지**합니다.
- 릴리스 모드 사용 시 **systemd `WorkingDirectory`** 가 앱의 `current` 를 가리키도록 서버에서 한 번 맞춰야 합니다.

## 변경 금지 (스크립트 준수)

- **`AUTH_STORE_PATH`** 및 **`/srv/malmoi/shared/*`** 를 배포 스크립트에서 변경하지 않습니다. 진단 로그만 출력합니다.

## GitHub Secrets (Deploy)

- `MALMOI_DEPLOY_HOST`, `MALMOI_DEPLOY_USER`, `MALMOI_DEPLOY_SSH_KEY`
- (선택) `MALMOI_REMOTE_DEPLOY_SCRIPT` — 기본값은 위 deploy-prod.sh 경로

`production` 환경 보호 규칙·승인을 켜 두는 것을 권장합니다.

## 로컬 수동 배포

- `npm run deploy` → `scripts/deploy-from-local.sh` (`origin main` 푸시 + SSH). **작업 브랜치만 푸시하는 용도로는 사용하지 마세요.**
