# 브랜치 구조·포털 운영 기준 (MalMoi)

## 1. 현재 원격 브랜치 역할 정리

| 브랜치 | 코드베이스 성격 | 비고 |
|--------|-----------------|------|
| **`origin/main`** | 과거 **booking-system** 계열이 병합된 기본 브랜치 | Prisma·Vercel·`src/app` 중심 레이아웃이 섞여 있던 시기의 기준. 저장소 규칙·필수 체크가 이 브랜치를 향해 설정되어 있음. |
| **`origin/main-sync`** | **MalMoi 포털** (`malmoi-integrated`, `package.json` name) | Next App Router 루트 `app/`, JSON 스토어·관리자 포털 등 **현재 운영 대상에 가까운 코드**. |
| **`origin/db-check-update`** | 포털 기능 개발·검수용 | CI 대상. `main` 반영 전 검증 브랜치로 사용. |

**정리:** GitHub 기본 브랜치는 여전히 `main`일 수 있으나, **애플리케이션 소스의 “진실”은 `main-sync`(및 그에서 갈라진 작업 브랜치)** 에 더 가깝습니다. `main`과 포털 코드를 합치기 전까지는 두 계열이 한 저장소에 공존하는 상태로 이해하면 됩니다.

## 2. 운영 후보 브랜치 제안

| 단계 | 제안 |
|------|------|
| **당분간** | 포털 작업의 **통합·릴리스 후보는 `main-sync`** 로 두고, 모든 PR/CI를 포털 `package.json` 기준으로 맞춥니다. |
| **중기** | `main`을 포털 코드로 **fast-forward 또는 병합 이전**에, `main`을 포털 전용으로 정리하거나, GitHub 기본 브랜치를 `main-sync`로 변경하는 것을 검토합니다. |
| **이름 정리** | 팀 합의 하에 `main-sync` → `portal` / `malmoi` 등으로 **rename** 하면 역할이 더 분명해집니다 (원격 브랜치 rename + 로컬 정리 필요). |

**원칙:** `AUTH_STORE_PATH` 및 서버 `shared` 데이터 경로는 **코드만 교체**하고 저장 경로 정책은 유지합니다.

## 3. 빌드·CI 상태 (포털 기준)

- **로컬/CI:** `npm ci` 후 `npm run build` 가 **통과**해야 합니다 (Next 16.x, `malmoi-integrated`).
- **Tailwind / PostCSS:** `postcss.config.mjs` + `tailwind.config.js` + `app/globals.css` 의 `@tailwind` 지시문.
- **워크플로 분리:**
  - **`ci.yml`:** `main`, **`main-sync`**, `db-check-update` 에 대해 `npm ci` → `build` → (있으면) `ci-verify.mjs`.
  - **`production-deploy.yml`:** `main` 대상 **PR** 에서만 실행, **PR 헤드 SHA** 기준으로 `npm ci` + `npm run build` (+ 선택적 `ci-verify`, HTTP 스모크는 `CI_SKIP_HTTP_SMOKE=1` 로 생략 가능). 필수 체크 이름 **`production-deploy`** 와 맞춤.
  - **`deploy-main.yml`:** **`main`에 push** 될 때 SSH로 `deploy-prod.sh` (MalMoi 서버).
  - **`deploy.yml`:** 예전 Vercel/booking 용 **레거시** — 자동 트리거 제거, **`workflow_dispatch`만** (포털 `package.json`과 충돌 방지).

## 4. `main-sync` ↔ `main` 병합·PR 전략

1. **작업:** `db-check-update` 또는 토픽 브랜치에서 개발 → `main-sync`로 PR/머지해 포털 기준선을 갱신합니다.
2. **운영 반영(최종):** 포털을 `main`에 합치는 PR을 엽니다 (base: `main`, head: `main-sync` 또는 그 하위 통합 브랜치).
3. **필수 체크:** 저장소 규칙에 **`production-deploy`** 가 걸려 있으면, 위 **Production Deployment** 워크플로가 PR에서 통과해야 머지 가능합니다. (PR 헤드가 포털이면 `npm ci`/`build`가 포털 lockfile 기준으로 돕니다.)
4. **직접 `git push origin main` 이 거절되는 경우:** Branch protection(필수 리뷰·필수 상태 검사) 때문입니다. **PR로만 머지**하거나, 관리자 권한으로 예외를 두는 정책을 따릅니다.
5. **머지 후:** `main`에 push 되면 **`deploy-main.yml`** 이 SSH 배포를 시도합니다 (시크릿·서버 경로 준비 필요).

## 5. 로컬 브랜치 추적 정리

포털 작업 브랜치가 실수로 `origin/main`을 추적하면 `ahead/behind` 표시가 혼란스러울 수 있습니다.

```bash
git fetch origin
git checkout main-sync
git branch --set-upstream-to=origin/main-sync main-sync
```

## 6. 커밋 금지·주의

- **`.data/`**, **`scripts/deploy.env`** 등 비밀·로컬 데이터는 **커밋하지 않음**.
- **UI 문구**는 일본어 유지 (코드 리뷰 시 혼입 방지).

## 7. 서버 반영 “가능한 상태”의 의미

- `main-sync`에서 **`npm run build` 성공**.
- CI 워크플로가 위 구조와 일치.
- `main` 머지 + `deploy-main.yml` 시크릿 + 서버 `deploy-prod.sh` 가 준비되면 **파이프라인 상 배포 가능**. 실제 서버 반영은 머지·Actions 성공·SSH 환경에 따라 달라집니다.
