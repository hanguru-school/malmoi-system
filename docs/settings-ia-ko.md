# 설정(設定) 정보 구조 (IA) — 한국어 요약

UI 라벨은 일본어를 유지합니다. 상위 허브는 **「設定」** (`/admin/settings/*`) 한 곳으로 모았습니다.

## 상위 섹션

| 경로 | 내용 |
|------|------|
| `/admin/settings/classroom` | 교실 운영 — 기본 정보, 기본·요일별·일별 영업시간(우선순위: 일별 > 요일 > 기본), 페어, 숙제 |
| `/admin/settings/reservation-policy` | 예약 정책 — 수신·변경/취소·캘린더·승인, 보호자 정책 |
| `/admin/settings/teacher-schedule` | 강사 스케줄 — 변경 규칙·락 / 강사별 주간·예외 |
| `/admin/settings/lesson-services` | 레슨·서비스 카탈로그 및 공통 레슨 설정 |
| `/admin/settings/payments-usage` | 결제 수단·Web 준비 플래그, 교실 결제 메모, 공통 레슨(이용 시간 규칙과 연계 시) |
| `/admin/settings/notifications` | 알림 — 규칙 추가형 + 레거시 ON/OFF |
| `/admin/settings/accounts` | 관리자·초대(강사/보호자) |
| `/admin/settings/system` | 메일·보안·시스템 정보·설정 변경 로그 |

각 페이지 상단의 **서브 네비**는 쿼리 `?t=` 로 탭을 전환합니다.

## 예약 정책 vs 레슨 마스터

- **예약 정책**(`reservation` 섹션): 슬롯·취소·승인 흐름.
- **레슨 카탈로그**(`lessonServiceCatalog`): 상품(이름·시간·인원·강사 등). 서로 분리해 둡니다.
