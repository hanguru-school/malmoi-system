# 선생 레슨노트·숙제 빠른 입력 및 학생 직근 요약 (운영 가이드)

## 1. 목적

- 수업 직후 **생각·타이핑 부담을 줄이고**, 레슨노트 → 숙제까지 **클릭 중심**으로 이어지게 한다.
- 관리자·선생 화면에서 **학생별 최근 흐름**을 한눈에 읽기만 해도 파악할 수 있게 한다.
- **AUTH_STORE_PATH, 세션, 기존 REST 경로, JSON 저장 형식**은 변경하지 않는다. UI·클라이언트 보조·표시 전용 로직만 추가한다.

---

## 2. 레슨노트 빠른 입력 구조

### 2.1 구성 요소

| 요소 | 위치 | 설명 |
|------|------|------|
| 기존 **定型テンプレート** | `AdminLessonNotesPanel` (선생 API 경로일 때) | 제목·요약·본문 등 일괄 채움 |
| **学習ポイント（ワンタップ）** | 동일 | `発音` / `助詞` / `語尾` / `会話練習` / `復習必要` / `宿題確認` 버튼. **反映先**으로 `要約` 또는 `次回計画` 선택 후 클릭 시 해당 필드에 문장 삽입 |
| **直近の文** | 동일 | localStorage `malmoi:lessonNote:recentSummaryLines:v1` — 요약/본문 삽입 |
| **保存後に宿題画面へ進む** | 동일 | 체크 시 저장 후 `/teacher/homework?...` 로 이동 |

정의 데이터: `lib/lessonNotes/teacherQuickCompose.js` (`TEACHER_POINT_SNIPPETS`, `TEACHER_QUICK_TEMPLATES`).

### 2.2 주요 동선

1. 선생이 일정·학생 링크로 `/teacher/lesson-notes?lessonUnitId=...&refDate=...` 진입 (또는 `studentId`로 필터).
2. 포인트 버튼으로 요약·차회 계획을 채운 뒤 저장.
3. (권장) 저장 후 숙제 화면으로 이동 시, **sessionStorage**에 `malmoi:hwPrefillFromNote:v1` 로 제목·본문·종류·학생·일자·lessonUnitId 프리필 payload 저장 (약 **45분** 유효는 숙제 화면 측 소비 시 제거).

### 2.3 롤백 방법

- 코드 롤백: `AdminLessonNotesPanel.js`, `teacherQuickCompose.js` 를 이전 커밋으로 되돌린다.
- 브라우저만 초기화할 경우: 사용자 localStorage/sessionStorage 키 위 이름으로 수동 삭제 가능 (운영 필수는 아님).

### 2.4 운영상 주의

- 포인트 문구는 **일본어 고정**이며, API 필드(`summary`, `nextLessonPlan` 등)는 기존과 동일.
- `反映先`이 `次回計画`일 때는 `nextLessonPlan`에만 붙는다.

---

## 3. 숙제 빠른 작성 구조

### 3.1 구성 요소

| 요소 | 설명 |
|------|------|
| **クイック定型** | `HW_QUICK_PRESETS` — 단어·문법·발음·회화·듣기·복습 등 버튼 한 번에 `title` / `description` / `type` 설정 (`lib/homework/quickHomework.js`) |
| **直近に登録した宿題を再利用** | localStorage `malmoi:homework:recentQuickEntries:v1`, 최대 6건 |
| **レッスンノートからの引き継ぎ** | `sessionStorage` 키 `malmoi:hwPrefillFromNote:v1` — 노트 저장 직후·또는 수동으로 숙제 화면 열 때 폼에 반영 후 **1회 소비 시 삭제** |

### 3.2 주요 동선

1. 노트 저장 후 자동 이동 또는 `/teacher/homework?studentId=...&lessonUnitId=...&lessonDate=...` 진입.
2. 상단 퀵 프리셋 또는 최근 숙제 칩으로 채우고 제출.
3. 선생 모드에서만 안내 문구: 노트에서 온 경우 sessionStorage 프리필이 있을 수 있음을 표시.

### 3.3 롤백 방법

- `AdminHomeworkPanel.js`, `lib/homework/quickHomework.js` 롤백.
- 기존 **관리자 템플릿 API** (`/api/admin/homework-templates`) 동작은 그대로 유지.

### 3.4 운영상 주의

- 프리필은 **studentId가 URL·폼과 일치할 때만** 적용 (다른 학생 화면 오염 방지).
- 과거 프리필이 남아 있으면 45분 경과 시 무시·삭제.

---

## 4. 학생별 최근 수업 기록 요약 (읽기 전용)

### 4.1 구성

- 컴포넌트: `app/admin/students/[id]/StudentRecentFlowSummary.js`
- **관리자**: 학생 상세(`StudentEditForm`) 탭 영역 상단에 표시 (`apiRole="admin"`).
- **선생**: `/teacher/students/[id]` 페이지에 동일 컴포넌트 (`apiRole="teacher"`).

데이터 소스 (클라이언트 fetch):

- 노트: `GET /api/admin/lesson-notes?studentId=` 또는 `GET /api/teacher/lesson-notes?studentId=` (선생 API에 `studentId` 쿼리 지원 추가).
- 숙제: `GET /api/admin/homework?studentId=` (선생·관리자 공통 권한).

표시 내용:

- 최근 3회 노트 요약(한 줄 요약)
- 키워드 빈도(발음·助詞·語尾 등) **2회 이상** 노트에 등장 시 “반복 주의”로 나열 (휴리스틱)
- 최근 숙제 5건 (일자·상태·제목 일부)
- 최신 노트의 **次回計画** 텍스트

### 4.2 롤백 방법

- 컴포넌트 제거 및 `app/api/teacher/lesson-notes/route.js` 의 `studentId` 파라미터 처리 제거 시 이전과 동일하게 동작.

### 4.3 운영상 주의

- 요약은 **읽기 전용**이며, 분석은 단순 키워드 기반이라 교육적 판단은 강의록·노트 원문을 병행한다.

---

## 5. 배포 시 체크리스트

- `npm run build` 성공.
- 서버에 `apps/malmoi/` 등 배포 경로에 동일 트리 반영 후 프로세스 재시작.
- 별도 DB 마이그레이션 없음.
