# MalMoi 한국어 교실 시스템

## 🚀 자동 배포 시스템

이제 `feature/production-system-setup` 브랜치에 push하면 자동으로 배포됩니다!

### 배포 방법
1. 코드 수정
2. `git add . && git commit -m "메시지" && git push origin feature/production-system-setup`
3. 자동 배포 완료! 🎉

### 배포 확인
- **Vercel 대시보드**: https://vercel.com/dashboard
- **사이트 접속**: https://app.hanguru.school

---

## 프로젝트 개요

한국어 교실을 위한 종합적인 예약 및 관리 시스템입니다.

### 주요 기능

- **학생 관리**: 학생 정보, 수업 예약, 진도 추적
- **교사 관리**: 수업 일정, 학생 관리, 자료 공유
- **예약 시스템**: 실시간 예약, 알림, 결제 연동
- **학습 관리**: 진도 추적, 과제 관리, 성과 분석
- **통신 시스템**: 메시지, 알림, 리뷰 시스템

### 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (AWS RDS)
- **Authentication**: AWS Cognito
- **Deployment**: Vercel
- **Styling**: Tailwind CSS

### 환경 설정

1. **환경 변수 설정**
   ```bash
   cp .env.example .env.local
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **데이터베이스 설정**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **개발 서버 실행**
   ```bash
   npm run dev
   ```

### 배포

프로젝트는 Vercel을 통해 자동 배포됩니다.

- **Production**: https://app.hanguru.school
- **Preview**: 각 브랜치별 자동 배포

### 개발 가이드

- **코딩 스타일**: ESLint + Prettier
- **타입 체크**: TypeScript
- **테스트**: Jest + React Testing Library

### 라이센스

MIT License
