# 운영 핵심 흐름: 선생님 화면 · 레슨노트 · 숙제

**대상:** malmoi-integrated (학생 등록/예약 V2, 기존 JSON 스토어 유지)  
**목적:** 매일 쓰는 **최소 화면**으로 예약 → 수업 → 레슨노트 → 숙제 **접근만** 연결한다. (자동 생성·고급 편집은 범위 밖)

**화면 UI 문구:** 일본어 유지 (코드·라벨 변경 없음)  
**일본어 상세:** `docs/ops-core-flows-lesson-homework-teacher.md` 참고

---

## 1. 선생님 최소 화면 (구현 완료)

### 목적

수업 당일 진행과 기록(노트·숙제)에 집중. 결제·시스템 설정·전체 학생 일괄 편집은 제외.

### 경로와 역할

| 화면 | 경로 | 설명 |
|------|------|------|
| 홈 | `/teacher` | 요약 KPI, 주요 메뉴 버튼, 숙제 보조 링크 |
| 오늘 레슨 | `/teacher/today` | 당일 JST 담당 예약. 카드마다 **レッスンノートへ** · **宿題** |
| 예약 목록 | `/teacher/schedule` | 날짜 선택으로 담당 예약 (동일 `TeacherDayView` UI) |
| 레슨노트 | `/teacher/lesson-notes` | 기존 패널, API `/api/teacher/lesson-notes` |
| 학생 메모 | `/teacher/students` | 검색·개별 진입 (표기: 生徒メモ・検索) |
| 공지 | `/teacher/notices` | 공개 중 공지 목록 (학생용과 동일 데이터 소스, 읽기 전용) |
| 공지 상세 | `/teacher/notices/[id]` | 공개·유효 공지만 |

**레거시:** `/teacher/lessons` → `/teacher/today` 로 리다이렉트.

### 주요 동선

1. **오늘 레슨** → 각 카드 **レッスンノートへ** (`lessonUnitId` 쿼리)
2. 같은 카드 **宿題** → `/teacher/homework?...` (기존)
3. **예약 목록**에서 날짜 변경 → 동일 카드 목록

### 스타일

- `app/teacher/teacher.module.css` — 셸·카드·버튼 (모바일 우선)

### 롤백 방법

- `app/teacher/` 아래 `TeacherTopNav.js`, `page.js`, `TeacherDayView.js`, `today/`, `schedule/`, `notices/`, `lessons/`(리다이렉트) 등을 Git 이전 커밋으로 복원.
- 구 북마크 `/teacher/lessons` 를 살리려면 리다이렉트 라우트는 유지하는 편이 안전.

### 운영상 주의

- 공지는 **학생에게 공개되는 목록과 동일 로직** (관리자가 공지를 올리는 운영 전제).
- 선생님 전용 추가 필드는 없음.

---

## 2. 레슨노트 접근 흐름

### 선생님

- **오늘 레슨 / 예약 목록** 각 예약 → **レッスンノートへ** → `/teacher/lesson-notes?lessonUnitId=...`
- 목록 화면에서 작성·수정 (기존)

### 학생

- **홈** 대시보드·미니 링크 (기존)
- **레슨노트 목록** `/student/lesson-notes`
  - 상단: **最新のノートへ** (`#latest-lesson-note`), **一覧へ** (`#all-lesson-notes`), 宿題, 次のレッスン
  - 스크롤 앵커 `latest-lesson-note`, 각 카드 `note-{id}`

### 관리자

- **학생 상세** `StudentEditForm`: 탭「レッスンノート」, `/admin/lesson-notes?studentId=` 버튼 (기존 유지)

### 롤백 (학생 노트만 되돌릴 때)

- `app/student/lesson-notes/page.js` 만 이전 버전으로 복원.

---

## 3. 숙제 기본 화면 (학생)

### 목적

학습 분석보다 **미완료 숙제 누락 방지** 우선.

### `/student/homework` 구성

- **요약:** 미완료 건수, 제출·확인 중 건수
- **レッスン関連のおすすめ:** 레슨노트(연결 ID 있으면 `#note-{id}`, 없으면 `#latest-lesson-note`) + 다음 레슨
- **未完了の宿題** — 제출 전·미완료만
- **提出済み（確認待ち）** — `submitted`
- **最近完了した宿題** — `reviewed`/`completed`, 최신순 최대 8건

### 홈과의 연결

- 홈 **宿題** 타일 → `/student/homework`
- 배너: 최신 노트 / 전체 노트 / 다음 레슨

### 롤백

- `app/student/homework/StudentHomeworkPanel.js`, `homework/page.js` 복원.

### 운영상 주의

- API·JSON 스키마 변경 없음 (`listHomeworksForStudent`, PATCH 동일).

---

## 4. 변경 파일 목록

| 구분 | 파일 |
|------|------|
| 선생님 | `app/teacher/teacher.module.css`, `TeacherDayView.js`, `TeacherTopNav.js`, `page.js`, `today/page.js`, `schedule/page.js`, `lessons/page.js`, `notices/page.js`, `notices/[id]/page.js`, `lesson-notes/page.js` |
| 학생 | `app/student/homework/StudentHomeworkPanel.js`, `homework/page.js`, `lesson-notes/page.js` |
| 문서 | 본 파일, `docs/ops-core-flows-lesson-homework-teacher.md` (일본어) |

---

## 5. 빌드·배포

```bash
NEXT_PUBLIC_USE_STUDENT_REGISTRATION_UI_V2=true \
NEXT_PUBLIC_USE_RESERVATION_UI_V2=true \
npm run build
```

배포는 기존 **releases / current** 절차. (이 저장소에서 원격 서버에 직접 업로드는 하지 않음.)

---

## 6. 기술 원칙 (준수)

- `AUTH_STORE_PATH`, 세션·쿠키, 메일 verify, REST, JSON 저장 형식 유지.
- 등록·예약 V1/V2 롤백: `docs/registration-v2-integration.md`, `?ui=v1` / 환경 변수.
