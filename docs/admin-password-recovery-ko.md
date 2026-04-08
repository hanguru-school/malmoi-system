# 관리자 비밀번호 분실·복구 가이드 (MalMoi)

운영 중 관리자 비밀번호 분실, 오설정, 로그인 불가가 발생해도 서비스를 재개할 수 있도록 **셀프 서비스 → SUPER 조치 → 서버 긴급 스크립트** 순으로 정리합니다.

## 1) 셀프 서비스 (로그인 전, 누구나 요청 가능)

1. 브라우저에서 **`/login/admin`** 접속  
2. **「パスワードをお忘れですか？」** → **`/login/admin/password-reset`**  
3. 등록된 **관리자 메일** 입력 후送信  
4. 메일의 링크 → **`/login/admin/password-reset/verify?token=...`** 에서 새 비밀번호 설정  
5. **`/login/admin`** 으로 로그인  

**보안 동작**

- 존재하지 않는 메일이어도 화면 메시지는 동일합니다.  
- IP·이메일별 **시간당 요청 수 제한**이 있습니다.  
- 토큰은 **해시만 저장**, 원문은 메일 링크에만 1회 표시, **사용 후 즉시 무효**, 만료는 기본 **60분** (`AUTH_ADMIN_PASSWORD_RESET_TOKEN_TTL_MINUTES` 로 변경 가능).  
- 재설정 완료 시 해당 관리자의 **기존 세션은 모두 무효화**됩니다.

## 2) SUPER_ADMIN 수동 조치 (한 명이라도 관리자로 로그인 가능할 때)

**경로:** **`/admin/admin-users`** (アカウント・権限 화면)

대상 관리자 블록의 **「権限とアカウントの安全」** 안에, 스ーパ만 보이는 도구가 있습니다.

| 동작 | 설명 |
|------|------|
| **パスワード再設定メール送信** | `POST /api/admin/admin-users/[id]/password-reset-mail` — 재설정 메일 발송 (토큰 신규 발급) |
| **仮パスワード発行** | `POST /api/admin/admin-users/[id]/temporary-password` — 임시 비밀번호 발급, **次回ログイン時にパスワード変更必須**, **모든 세션 무효** |

임시 비밀번호는 화면에 **한 번만** 표시되므로 안전한 채널로 전달하세요.

## 3) 메일·SMTP 장애 시 (서버 파일 접근 가능할 때)

저장소 루트에서 **auth 스토어 경로**는 환경변수 **`AUTH_STORE_PATH`** 와 동일해야 합니다 (미설정 시 기본 `.data/auth-store.json`).

```bash
cd /path/to/malmoi-app
MALMOI_RESET_CONFIRM=yes printf '%s\n' '새비밀번호4자이상' | \
  node scripts/reset-admin-password.mjs \
  --store "${AUTH_STORE_PATH:-/srv/malmoi/shared/auth-store.json}" \
  --email office@hanguru.school \
  --stdin
```

- 실행 전 스크립트가 **`.bak-타임스탬프` 백업**을 만듭니다.  
- 앱을 잠시 중지하거나 쓰기 경합이 없을 때 실행하는 것이 안전합니다.  
- 이후 앱 기동 → 로그인 → `/password/change-required` 등에서 비밀번호 변경을 권장합니다.

## 4) 운영자 체크리스트 (순서)

1. 사용자에게 **셀프 재설정 링크** 안내 (`/login/admin/password-reset`)  
2. 메일이 안 오면 **SMTP·`admin_password_reset` 템플릿 활성**·메일 로그 확인  
3. SUPER가 로그인 가능하면 **再設定メール送信** 또는 **仮パスワード**  
4. 그래도 안 되면 **서버에서 `reset-admin-password.mjs`** (또는 스토어 백업 복구)

## 5) 관련 저장소 구조 (요약)

| 항목 | 내용 |
|------|------|
| 토큰 배열 | `auth-store.json` 의 **`adminPasswordResetTokens`** (학생용 `passwordResetTokens` 와 분리) |
| 레이트 로그 | **`adminPasswordResetRateLog`** |
| 공개 API | `POST /api/auth/admin-password-reset/request`, `verify`, `complete` |
| SUPER API | `POST /api/admin/admin-users/[id]/password-reset-mail`, `temporary-password` |
