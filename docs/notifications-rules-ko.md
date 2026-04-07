# 알림 시스템 (규칙 추가형)

## 레거시 ON/OFF

- `notifications.noticePublished` 등 기존 불리언은 **호환용**으로 유지합니다.
- 운영에서는 **rules 배열**을 우선합니다.

## 규칙 객체 (예시)

- `audience`: student / parent / teacher 등
- `channelEmail`, `channelPortal`
- `subjectTemplate`, `bodyTemplate`
- `trigger`, `leadMinutes`, `lagMinutes`, `active`

## 변수 치환

템플릿에 예: `{studentName}`, `{lessonDate}`, `{lessonTime}`, `{remainingMinutes}`  
실제 발송 파이프라인은 단계적으로 규칙 엔진에 연결할 수 있도록 UI만 확장해 두었습니다.
