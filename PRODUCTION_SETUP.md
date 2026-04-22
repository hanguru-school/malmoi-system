# 운영 환경 설정 가이드

## 🚀 운영 환경 고정 설정

이 프로젝트는 **오직 운영 서버(https://portal.hanguru.blog)에서만** 모든 기능을 개발하고 배포합니다.

### 1. 배포 환경 설정

#### Vercel 설정

- **Production 배포**: `main` 브랜치만 대상
- **Preview 배포**: 비활성화
- **Git 연동**: "Only deploy on production branch (main)" 활성화

#### Vercel 대시보드에서 설정:

1. Project Settings → Git
2. "Only deploy on production branch" 체크
3. Production Branch를 `main`으로 설정

### 2. GitHub 브랜치 보호 설정

#### main 브랜치 보호 규칙:

- ✅ **Force push 금지**
- ✅ **병합 전 PR 리뷰 필수**
- ✅ **CI/CD 체크 통과 후에만 병합 허용**
- ✅ **특정 관리자 계정 외 push 금지**

#### 설정 방법:

1. GitHub Repository → Settings → Branches
2. Add rule for `main`
3. 다음 옵션들 활성화:
   - Require a pull request before merging
   - Require approvals (최소 1명)
   - Dismiss stale PR approvals when new commits are pushed
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
   - Restrict pushes that create files that use the git push --force-with-lease command

### 3. 팀 권한 설정 (선택사항)

#### Vercel 팀 권한:

- **Developer**: 배포 불가
- **Owner/Admin**: 실제 배포 가능

#### 설정 방법:

1. Vercel Dashboard → Team Settings → Members
2. 각 멤버의 역할을 적절히 설정

### 4. 코드 작성 및 배포 흐름

#### 개발 흐름:

```bash
# 1. main 브랜치에서 직접 개발
git checkout main

# 2. 로컬에서 테스트
npm run dev

# 3. 변경사항 커밋 및 푸시
git add .
git commit -m "기능 추가: [설명]"
git push origin main

# 4. 자동으로 운영 서버에 배포됨
```

#### 배포 확인:

- GitHub Actions에서 배포 상태 확인
- https://portal.hanguru.blog 에서 변경사항 확인

### 5. 환경 검증 시스템

#### 자동 경고 시스템:

- 운영 서버가 아닌 환경 접속 시 경고 메시지 표시
- 5초 후 자동으로 https://portal.hanguru.blog 로 리다이렉트

#### 경고 메시지:

```
現在の環境はテスト用のため、正式な動作を保証していません。
必ず https://portal.hanguru.blog を使用してください。
```

### 6. 환경 변수 설정

#### 필수 환경 변수:

```bash
# Vercel
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id

# GitHub Secrets
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

### 7. 배포 스크립트 사용

#### 수동 배포:

```bash
# 배포 스크립트 실행 (main 브랜치에서만)
./scripts/deploy.sh
```

#### 자동 배포:

- main 브랜치에 푸시 시 자동 배포
- GitHub Actions에서 처리

### 8. 보안 설정

#### Vercel 보안 헤더:

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

#### 환경 변수 보안:

- 모든 민감한 정보는 Vercel 환경 변수로 관리
- GitHub Secrets에 저장
- 코드에 직접 입력 금지

### 9. 모니터링 및 로그

#### 배포 모니터링:

- Vercel Dashboard에서 배포 상태 확인
- GitHub Actions에서 빌드/배포 로그 확인

#### 에러 모니터링:

- Vercel Function Logs 확인
- 브라우저 콘솔 에러 확인

### 10. 롤백 절차

#### 긴급 롤백:

1. Vercel Dashboard → Deployments
2. 이전 배포 버전 선택
3. "Redeploy" 클릭

#### 코드 롤백:

```bash
# 이전 커밋으로 되돌리기
git revert HEAD
git push origin main
```

---

## ⚠️ 중요 사항

1. **테스트 환경 사용 금지**: Preview 환경이나 개발 환경에서 테스트하지 마세요
2. **main 브랜치 전용**: 모든 개발은 main 브랜치에서만 진행
3. **운영 서버 확인**: 모든 기능은 https://portal.hanguru.blog 에서 확인
4. **자동 배포**: main 브랜치 푸시 시 자동으로 운영 서버에 배포됨

## 🆘 문제 해결

### 배포 실패 시:

1. GitHub Actions 로그 확인
2. Vercel Dashboard에서 에러 확인
3. 환경 변수 설정 확인
4. 빌드 에러 수정 후 재배포

### 환경 검증 실패 시:

1. 브라우저 캐시 삭제
2. 올바른 URL 확인 (https://portal.hanguru.blog)
3. 네트워크 연결 확인
