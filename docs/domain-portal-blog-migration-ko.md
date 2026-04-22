# 포털 도메인: `portal.hanguru.blog` 단일화 가이드

`portal.hanguru.school` 및 `hanguru.school` 기반 포털 URL은 사용하지 않습니다.  
운영·문서·스크립트는 **`https://portal.hanguru.blog`** 를 기준으로 맞춥니다.

## 1. 서버 환경 변수 (필수)

서버의 `.env` / `.env.production` 등에서 아래를 **모두** `https://portal.hanguru.blog` 로 통일합니다.

- `APP_BASE_URL`
- `APP_URL` / `BASE_URL` (사용 중인 경우)
- `NEXTAUTH_URL`
- `MAIL_LINK_BASE_URL`

이메일 발신 주소가 `@hanguru.school` 이면 SMTP 계정·`MAIL_FROM`·`SMTP_USER` 를 실제 사용하는 주소로 변경합니다.

## 2. Nginx

`portal.hanguru.school` 을 받는 `server { ... }` 블록을 **삭제**하거나, TLS 인증서 갱신 대상에서 제외합니다.

MalMoi 포털만 받는 예시(요지):

```nginx
server {
    listen 443 ssl http2;
    server_name portal.hanguru.blog;
    # ssl_certificate ... portal.hanguru.blog ...
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

- `server_name` 에 `portal.hanguru.school` 을 넣지 않습니다.
- 리다이렉트 전용으로 school 호스트를 남기지 않습니다(요청: 임시 redirect 없이 제거).

## 3. Caddy

Caddyfile 에서 `portal.hanguru.school` 블록을 제거하고, `portal.hanguru.blog` 만 남깁니다.

## 4. Cloudflare / DNS

1. **DNS**
   - `portal.hanguru.school` 의 A / AAAA / CNAME 레코드를 **삭제**하거나 비활성화합니다.
   - `portal.hanguru.blog` 만 MalMoi 서버(또는 프록시)를 가리키게 유지합니다.

2. **SSL/TLS**
   - `portal.hanguru.blog` 에 대해 Full(Strict) 등 기존 정책을 유지합니다.
   - school 호스트용 인증서·페이지 규칙이 있으면 정리합니다.

3. **리다이렉트 규칙**
   - school → blog 로 보내는 **임시 리다이렉트**는 넣지 않습니다(최종 제거 방향).

## 5. 배포·헬스체크

- `deploy/deploy-prod.sh` 의 `EXTERNAL_HEALTH_URL` 은 `https://portal.hanguru.blog/login` 을 사용합니다.
- GitHub Actions 등에서 외부 헬스 URL을 school 로 호출하지 않도록 저장소 설정을 확인합니다.

## 6. 외부 서비스

- LINE / OAuth / Cognito 등 **콜백 URL·허용 리다이렉트**에 `portal.hanguru.school` 이 남아 있으면 제거하고 `portal.hanguru.blog` 만 등록합니다.
