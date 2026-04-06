# 설정 허브·영업시간·초대·講師日程·예약캘린더·알림·관리자 계정 (한국어)

## 목적

실제 교실 운영에 맞춰 **설정 메뉴를 한 곳으로 모으고**, **JSON 스토어를 확장**하여 영업시간 계층·서비스(레슨) 카탈로그·알림 규칙·講師可否時間·**초대 기반** 講師/保護者登録·관리자 프로필 편집을 지원합니다. 기존 `AUTH_STORE_PATH`, 세션 쿠키, 메일 로그, REST 경로 패턴은 유지합니다.

---

## 1. 설정 메뉴 재구성

### 동선

- 상단 네비 **「設定」** → `/admin/settings/classroom` (하위는 모두 `/admin/settings/*`).
- 허브 탭: **教室運営 / 予約ポリシー / 講師日程 / レッスン/サービス / 通知 / アカウント/権限 / システム/ログ**.
- 구 **システム設定** 단일 페이지는 **`/admin/settings` → `/admin/settings/classroom` 리다이렉트**로 흡수.
- **管理者設定** (`/admin/admin-users`) → **`/admin/settings/accounts` 리다이렉트** (북마크 호환).

### 롤백

- `app/admin/settings/layout.js`·하위 `page.js`·`SettingsHubNav.js` 제거 후 기존 단일 `settings/page.js` 복구.
- `AdminTopNav.js`의 `設定・監査` 그룹을 이전 `監査・システム` 항목으로 복원.

### 운영 주의

- 결제 관련 설정은 계속 **`/admin/payments/settings`** (설정 허브 설명 문구에 링크).

---

## 2. 講師 / 保護者 초대 등록

### 흐름

1. 관리자 **設定 → アカウント/権限** 에서 **招待メール送信** (`POST /api/admin/role-invitations`).
2. 스토어 `roleInvitations[]`에 `tokenHash`·`role`(teacher|parent)·`email`·保護者時 `studentId`·`relationship` 저장.
3. 메일(또는 응답의 `inviteUrl`)로 **`/register/invite?token=...`** 안내.
4. **`GET /api/auth/invite-preview`** 로 표시 검증 → **`POST /api/auth/complete-invite`** 로 비밀번호·프로필 확정.
5. 保護者は `studentParents` に自動連携、講師は `users.role=teacher` で 생성/更新。
6. 감사: `role_invitation.created`, `role_invitation.completed`, 保護者時 `student.parent_linked`.

### 롤백

- `roleInvitations` 배열·관련 API·`app/register/invite` 제거 후 Git 복원.

### 운영 주의

- 동일 메일이 **다른 역할**로 이미 있으면 거절.
- 초대 만료 기본 **7일** (`createRoleInvitationByAdmin` 내부).
- 메일 실패 시 API가 `inviteUrl`과 `mailWarning`을 반환할 수 있음 → **URL 수동 공유**.

---

## 3. 교실 영업시간·講師日程 구조

### 교실 (`systemSettings.classroomOperations`)

- **defaultOpen / defaultClose / defaultBreaks**: 전역 기본.
- **weekdayHours**: 요일 키 `0=日 … 6=土` JSON 객체.
- **dateOverrides**: 일자별 `closed` / `short` / `special` 등 배열 (해석은 운영 규칙으로 단계적 연동 가능).
- 우선순위 문구: **日付例外 > 曜日別 > 基本** (UI에 명시).

### 講師 (`teacherAvailabilityProfiles[]`)

- 필드: `teacherUserId`, `weekly`, `exceptions`, `adminLocks`, `changeRequests`.
- 관리자: **`GET/PATCH /api/admin/teacher-availability`** + 설정 **講師日程** 화면 JSON 편집.
- 講師: **`GET/PATCH /api/teacher/my-availability`**, 메뉴 **担当可能時間** (`/teacher/availability`).

### 변경 정책 (`systemSettings.teacherSchedulePolicy`)

- `editableDaysBefore`, `lockHoursBeforeLesson`, `forcedLocks[]`, `adminOnlyEdit`.
- 서버는 현 단계에서 **`adminOnlyEdit` 시 講師 PATCH 거부** 중심; 세밀한 시간 잠금은 추후 강화 가능.

### 롤백

- `ensureSystemSettings` 병합 블록과 스토어 배열·API 제거.

### 운영 주의

- JSON 직접 편집이므로 **백업 후** 운영 권장.

---

## 4. 관리자 예약 캘린더 공통 이벤트 모델

### 구현

- `lib/admin/reservationCalendarModel.js`: **`computeReservationFetchRange(view, anchorDate)`** 로 월/주/일 **API fromDate/toDate** 일치.
- **`reservationRowToCalendarEvent`**: `id, date, startAt, endAt, studentName, teacherName, lessonName, status, mode`.
- V1 `AdminReservationsPanel`: 단일 **`calendarDate`**, `load()`가 범위 로딩 + **`studentId`** 유지, **月/週の前後**は月単位/日単位ステップ.

### 롤백

- 패널을 이전 `selectedDate` 단일일 fetch 버전으로 복구하고 모듈 파일 삭제.

### 운영 주의

- V2 예약 UI는 별도; 월간 그리드 고도화는 V1 후속 과제.

---

## 5. 레슨/서비스 설정 (`lessonServiceCatalog`)

- `systemSettings.lessonServiceCatalog.services[]`: 이름, 설명, 이미지(data URL), 개인/페ア/グループ, 최대 인원, 시간·準備, 講師ID 목록, online/対面, 学生選択可.
- **予約ポリシー**(`reservation`)와 저장 키 분리.

### 롤백

- `lessonServiceCatalog` 섹션 및 UI 탭 제거.

### 운영 주의

- data URL은 스토어 크기 증가 → **가급적 짧은 문자열 또는 외부 URL 정책** 검토.

---

## 6. 알림 규칙 (`notifications.rules`)

- 기존 boolean 토글 유지 + **규칙 배열** 추가: 대상, 트리거 문자열, 채널(メール/ポータル), 제·본문 템플릿, 선행·지연 분, 활성.
- 변수 예: `{studentName}`, `{lessonDate}`, `{lessonTime}`, `{remainingMinutes}` (치환 로직은 메일/알림 엔진에 **단계적 연결**).

### 롤백

- `rules` 필드 및 UI 블록 제거, `ensureSystemSettings`에서 rules 기본 `[]`만 유지하거나 삭제.

---

## 7. 관리자 계정 구조

- `users` (admin): `profileImageDataUrl`, `jobTitle`, `signatureNote` 등 확장 + **`PATCH /api/admin/admin-users/[id]`** (본인 또는 SUPER_ADMIN).
- 목록 DTO: `listAdminUsersForAdmin`에 위 필드 포함.

### 롤백

- API 라우트·`updateAdminUserProfileByAdmin`·`migrateUserShape` 필드 제거.

### 운영 주의

- 이메일·権限·status 변경은 **SUPER_ADMIN**만.

---

## 관련 파일 (요약)

| 영역 | 경로 |
|------|------|
| 네비 | `app/admin/AdminTopNav.js` |
| 설정 레이아웃 | `app/admin/settings/layout.js`, `SettingsHubNav.js`, `SettingsAdminNav.js` |
| 패널 | `app/admin/settings/SystemSettingsPanel.js` |
| 講師日程 UI | `AdminTeacherScheduleClient.js` |
| 계정 | `AdminAccountsSettingsClient.js`, `app/api/admin/admin-users/[id]/route.js` |
| 초대 | `app/api/admin/role-invitations`, `app/api/auth/invite-preview`, `complete-invite`, `app/register/invite/page.js` |
| 講師可否 | `app/api/admin/teacher-availability`, `app/api/teacher/my-availability`, `app/teacher/availability/*` |
| 스토어 | `lib/auth/store.js` |
| 캘린더 모델 | `lib/admin/reservationCalendarModel.js` |
| 예약 패널 | `app/admin/reservations/AdminReservationsPanel.js` |
| 초대 메일 | `lib/auth/email.js` (`sendRoleInviteMail`) |

---

## 서버 배포

- 로컬에서 `scripts/deploy.env`에 `MALMOI_DEPLOY_SSH` 등이 설정된 경우에만 `npm run deploy`가 원격까지 진행됩니다. 미설정 시 저장소 커밋·빌드만 수행하고, SSH 대상은 운영 환경에서 구성하세요.
