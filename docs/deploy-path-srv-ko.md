# MalMoi 운영 경로 정리 (헷갈림 방지)

## 정답 한 줄

| 무엇 | 경로 |
|------|------|
| **코드 원본** | GitHub 브랜치 `main` |
| **서버에서 Git + 빌드 + 실행** | `/srv/malmoi/apps/malmoi-integrated/current` |
| **배포 스크립트** | 위 디렉터리에서 `bash deploy/deploy-prod.sh` (또는 `deploy/deploy-now.sh`) |
| **systemd `WorkingDirectory`** | `/srv/malmoi/apps/malmoi-integrated/current` |
| **공유 인증 등** | `/srv/malmoi/shared/` (앱 코드와 분리) |

## 로컬(맥·Cursor)에서 쓰는 명령

- `npm run deploy` — 커밋(필요 시) → `git push origin main` → SSH 로 서버에서 `deploy-prod.sh`
- `npm run deploy:server` / `bash deploy-now.sh` — 푸시 없이 서버만 재배포

## `/home/malmoi_deploy/apps/malmoi`

과거 안내 경로입니다. **새 작업·문서·Secret 은 모두 `/srv/.../current` 기준**으로 맞춥니다. 기존 홈 디렉터리 clone 은 마이그레이션 후 사용 중지를 권장합니다.

## sudo

`deploy/sudoers/malmoi-web-systemctl.nopasswd.example` 를 참고해 `/etc/sudoers.d/` 에만 반영하세요.
