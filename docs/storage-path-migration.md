# 운영 JSON 저장소 경로 고정 (`/srv/malmoi/shared/auth-store.json`)

## 목적

- 배포(git pull / 빌드) 시 **앱 디렉터리 내부의 `.data/auth-store.json`에 의존하지 않음**
- 운영 데이터를 **고정 shared 경로**에 두어, 릴리스 교체 후에도 **데이터가 흔들리지 않게** 함
- **서버 리셋·데이터 삭제·Prisma/migrate reset 금지** — 복사 + 백업 + 환경변수 전환만 수행

## 전제 (MalMoi 아키텍처)

본 앱은 **RDB가 아니라 단일 JSON 파일**(`auth-store.json`)에 사용자·학생·예약·감사로그 등을 저장합니다.  
`DATABASE_URL` / Prisma는 사용하지 않습니다.

## 최종 완료 기준 (체크리스트)

- [ ] `systemd` 유닛 `malmoi-web`에 **`Environment=AUTH_STORE_PATH=/srv/malmoi/shared/auth-store.json`** (또는 동등한 `EnvironmentFile`) 반영
- [ ] `/srv/malmoi/shared/` 디렉터리 존재, 소유·퍼미션은 **서비스 실행 유저**가 읽기/쓰기 가능
- [ ] `/srv/malmoi/shared/auth-store.json` 존재 (마이그레이션 복사 완료)
- [ ] 기존 앱 디렉터리 `.data/auth-store.json`은 **삭제하지 않고 백업 보관**
- [ ] `sudo systemctl daemon-reload && sudo systemctl restart malmoi-web` 후 서비스 active
- [ ] `AUTH_STORE_PATH=/srv/malmoi/shared/auth-store.json npm run check:db` (앱 루트에서) 정상
- [ ] 관리자 **저장 진단**: `/admin/system/db-check` 또는 `GET /api/admin/debug/db-check`에서 `persistence.fileExists: true`, counts 일치
- [ ] 예약 1건 생성 후 `reservations` 증가·`auditLogs` 갱신 확인

---

## 1) shared 디렉터리 준비 (서버)

```bash
sudo mkdir -p /srv/malmoi/shared/backups
sudo chown -R malmoi_deploy:malmoi_deploy /srv/malmoi/shared
# ※ 실제 User= 가 malmoi_deploy 가 아니면 해당 유저/그룹으로 맞출 것
```

---

## 2) 기존 파일 백업 + shared 로 복사

앱 루트를 `/home/malmoi_deploy/apps/malmoi` 로 둔 경우:

```bash
cd /home/malmoi_deploy/apps/malmoi
bash scripts/migrate-auth-store-to-shared.sh
```

스크립트 동작 요약:

- 레거시: `$APP_DIR/.data/auth-store.json` (첫 번째 인자로 다른 경로 지정 가능)
- 대상: `/srv/malmoi/shared/auth-store.json`
- `backups/` 아래에 **타임스탬프 백업** (레거시·기존 shared 모두)
- 대상 파일이 이미 있으면 기본 **중단** (`FORCE=1` 시 덮어쓰기 전 백업)

수동으로 할 경우(동일 정책):

```bash
TS=$(date -u +%Y%m%dT%H%M%SZ)
sudo mkdir -p /srv/malmoi/shared/backups
sudo cp -a /home/malmoi_deploy/apps/malmoi/.data/auth-store.json "/srv/malmoi/shared/backups/auth-store.legacy-$TS.json"
# shared 에 이미 있으면 그것도 백업
[[ -f /srv/malmoi/shared/auth-store.json ]] && sudo cp -a /srv/malmoi/shared/auth-store.json "/srv/malmoi/shared/backups/auth-store.shared-before-$TS.json"
sudo cp -a /home/malmoi_deploy/apps/malmoi/.data/auth-store.json /srv/malmoi/shared/auth-store.json
sudo chown malmoi_deploy:malmoi_deploy /srv/malmoi/shared/auth-store.json
```

**원본 `.data/auth-store.json`은 삭제하지 말 것** (백업·롤백용).

---

## 3) systemd 에 `AUTH_STORE_PATH` 설정

### 권장: drop-in 디렉터리

```bash
sudo mkdir -p /etc/systemd/system/malmoi-web.service.d
sudo cp /home/malmoi_deploy/apps/malmoi/deploy/systemd/malmoi-web.d-auth-store.conf.example \
  /etc/systemd/system/malmoi-web.service.d/10-auth-store.conf
sudo systemctl daemon-reload
sudo systemctl restart malmoi-web
```

예시 파일 내용 (`deploy/systemd/malmoi-web.d-auth-store.conf.example`):

```ini
[Service]
Environment=AUTH_STORE_PATH=/srv/malmoi/shared/auth-store.json
```

### 반영 확인

```bash
sudo systemctl show malmoi-web -p Environment --value | tr ' ' '\n' | grep AUTH_STORE_PATH
```

기대: `AUTH_STORE_PATH=/srv/malmoi/shared/auth-store.json`

---

## 4) 배포 후에도 shared 만 보도록 (코드 측)

- 앱은 **`AUTH_STORE_PATH`가 설정되면 그 경로만** 사용합니다 (`lib/auth/store.js`).
- 로컬 개발은 미설정 시 `.data/auth-store.json` (변경 없음).
- 운영 `.env` / `EnvironmentFile`에 **동일 키를 중복 정의하지 않도록** 정리 (systemd가 진실의 원천으로 충분).

`deploy/deploy-prod.sh`는 배포 마지막에 **systemd에 `AUTH_STORE_PATH`가 잡혀 있는지**와 **기본 shared 파일 존재**를 best-effort로 로그합니다.

---

## 5) 검증 (`check:db` · 관리자 진단 · 예약 테스트)

```bash
cd /home/malmoi_deploy/apps/malmoi
AUTH_STORE_PATH=/srv/malmoi/shared/auth-store.json npm run check:db
```

브라우저(관리자): `/admin/system/db-check`

예약 1건 생성 → 다시 `check:db` 또는 진단 페이지에서 `reservations` 증가 확인.

---

## 6) 앞으로 `.data` 를 주 저장소로 쓰지 않기

- **배포/rsync 시 `.data` 제외**는 기존과 동일 (`docs/deployment-guide.md`).
- 운영이 shared 로 전환된 뒤에도 **`.data`에 남은 파일은 백업**으로만 두고, 새 운영 쓰기는 **반드시 `AUTH_STORE_PATH` 경로**만 사용.
- 혼선 방지: 관리자/문서에 “운영 단일 소스는 `/srv/malmoi/shared/auth-store.json`”을 명시.

---

## 7) 롤백 (필요 시만)

1. systemd drop-in 에서 `AUTH_STORE_PATH` 줄 제거 또는 이전 경로로 변경  
2. `sudo systemctl daemon-reload && sudo systemctl restart malmoi-web`  
3. 백업 파일(`backups/auth-store.*.json`)에서 필요 시 복원  

데이터 삭제 없이 **설정과 파일 경로만** 되돌리면 됩니다.

---

## 관련 문서

- `docs/db-verification-report.md` — 저장 구조·진단 API 설명
- `docs/deployment-guide.md` — 배포 절차·`.data` 제외
