# MalMoi Integrated 현재 구현 범위 체크리스트

## 기준 프로젝트

- [x] 운영용 최종 기준 프로젝트는 `malmoi-integrated`로 확정
- [x] `Intro v1`, `Login v1`은 시안/실험본으로 유지
- [x] 실제 기능 개발과 확장은 `malmoi-integrated` 중심으로 진행

## 현재 구현 범위

- [x] Intro 페이지 구현 (`/`)
- [x] Login 페이지 구현 (`/login`)
- [x] Login 다음 경로 placeholder 구현 (`/login/next`)
- [x] 이메일 로그인 링크 생성 API (`/api/auth/request-link`)
- [x] 로그인 토큰 검증 API (`/api/auth/verify`)
- [x] 세션 조회/로그아웃 API (`/api/auth/session`, `/api/auth/logout`)
- [x] 로그인 성공 시 세션 생성 후 `/login/next` 이동

## 아직 구현하지 않은 항목 (보류)

- [ ] 학생 대시보드 실제 기능
- [ ] 예약 시스템
- [ ] 관리자 페이지
- [ ] 데이터베이스 연동
- [ ] 학생 CRM 데이터 연결

## 연결 원칙

- [x] Intro -> Login 이동 경로 유지
- [x] Login -> Intro 복귀 경로 유지
- [x] Login 링크 검증 성공 후 다음 경로(`login/next`)로 이동 구조 확보
- [x] 추후 학생/예약/관리자 기능으로 확장 가능한 URL 구조 확보
