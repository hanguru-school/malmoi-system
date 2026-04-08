# 본番 배포 (Actions 버튼 한 번)

워크플로 파일: `.github/workflows/deploy-production.yml`  
Actions 표시 이름: **Deploy production (manual)**

## 어디서 버튼을 누르나요

1. GitHub 저장소 **Actions** 탭
2. 왼쪽 목록에서 **Deploy production (manual)** 선택
3. 오른쪽 **Run workflow** → **branch** 확인(기본 `main`) 후 **Run workflow** 실행

## 브랜치는 무엇을 고르나요

- **branch** 입력: 서버에서 `git checkout`·`git pull` 할 **origin 브랜치 이름**입니다.  
- 운영 기본값은 **`main`** 입니다.

## 성공·실패는 어디서 보나요

- 같은 실행 건을 열고 **각 Step 로그**를 봅니다. 실패한 단계에 빨간 표시가 나며, **exit code**가 그대로 반영됩니다.
- PR용 빌드 검증은 **Production Deployment** (`production-deploy.yml`) — 이름·트리거가 다릅니다.

## 필요한 Repository Secrets

| 이름 | 용도 |
|------|------|
| `DEPLOY_HOST` | SSH 호스트 |
| `DEPLOY_USER` | SSH 사용자 |
| `DEPLOY_PORT` | SSH 포트 (예: `22`) |
| `DEPLOY_APP_DIR` | 서버 앱 루트 (예: `/home/malmoi_deploy/apps/malmoi`) |
| `DEPLOY_SSH_KEY` | 배포용 개인키 (PEM 전체) |

`environment: production` 을 쓰므로, 환경별 Secrets가 있으면 그쪽 값이 우선될 수 있습니다.

## 실행 순서 (요약)

1. 저장소 checkout  
2. SSH 키 파일 생성·권한(`600`)  
3. `known_hosts` 등록  
4. SSH 접속 테스트  
5. 서버: `cd` → `git fetch` → `git checkout` → `git pull`  
6. 서버: `bash deploy/deploy-prod.sh`  
7. 서버: `systemctl status malmoi-web`  
8. 서버: `curl` 로컬·공개 URL 헬스 확인  

## main 머지 시 자동 배포로 바꾸려면

- 이미 **main push** 시 자동 배포는 `.github/workflows/deploy-main.yml` (**Deploy production**) 에서 동작하도록 둘 수 있습니다.  
- 수동 워크플로만 쓰려면 `deploy-main.yml`의 `on.push` 를 제거하거나 비활성화하면 됩니다.
