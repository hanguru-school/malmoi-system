# 🏫 MalMoi Classroom Booking System

## 🚀 Live System
- **Main Domain**: `hanguru.school` (WordPress Landing Page)
- **Admin System**: `app.hanguru.school` (Booking System)
- **Last Updated**: 2025-01-27 (System Cleanup)

## 🏗️ System Architecture

### **Frontend**
- **Next.js 15.4.1** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Vercel Deployment**

### **Backend**
- **AWS Cognito** - User Authentication
- **AWS RDS PostgreSQL** - Database
- **AWS S3** - File Storage
- **Next.js API Routes** - Serverless Functions

### **Key Features**
- ✅ **User Authentication & Authorization**
- ✅ **Role-based Access Control** (Master, Teacher, Staff, Student)
- ✅ **Reservation Management System**
- ✅ **FeliCa/NFC Tagging System**
- ✅ **Automated Notification System**
- ✅ **Analytics & Reporting**
- ✅ **Curriculum Management**
- ✅ **Student Progress Tracking**
- ✅ **Payment & Points System**
- ✅ **LINE Integration**
- ✅ **Hardware Integration (RC-S380)**

## 🔧 Quick Start

### **Local Development**
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
```

### **Production Build**
```bash
npm run build
```

## 📋 Environment Variables

### **Required Environment Variables**
```env
# AWS Configuration
AWS_REGION=ap-northeast-2
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# Database
DATABASE_URL=postgresql://malmoi_admin:password@malmoi-system-db.cp4q8o4akkqg.ap-northeast-2.rds.amazonaws.com:5432/malmoi_system

# AWS Cognito
COGNITO_USER_POOL_ID=ap-northeast-2_gnMo24nfg
COGNITO_CLIENT_ID=597vkd6rjamd92p6s3bvk21

# AWS S3
S3_BUCKET_NAME=malmoi-system-files
S3_REGION=ap-northeast-2

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=https://app.hanguru.school
```

## 🎯 System Status

### ✅ **Production Ready**
- **Build Status**: ✅ Successful
- **TypeScript**: ✅ No errors
- **API Routes**: ✅ All functional
- **Database**: ✅ Connected
- **Authentication**: ✅ Working

### 🔧 **Available Scripts**
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run lint` - Code linting
- `npm run optimize` - Performance optimization
- `npm run type-check` - TypeScript checking

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard
│   ├── student/           # Student portal
│   ├── teacher/           # Teacher portal
│   ├── staff/             # Staff portal
│   ├── auth/              # Authentication
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utility libraries
├── hooks/                 # Custom hooks
└── types/                 # TypeScript types
```

## 🔒 Security Features

- **Role-based Access Control**
- **JWT Authentication**
- **CORS Protection**
- **XSS Prevention**
- **CSRF Protection**
- **Rate Limiting**

## 📊 Performance

- **Build Time**: ~5.0s
- **Bundle Size**: Optimized
- **Static Pages**: 144/144 generated
- **API Response**: <200ms average

## 🚀 Deployment

The system is automatically deployed to Vercel on every push to the main branch.

**Deployment URL**: https://app.hanguru.school

## 📞 Support

For technical support or questions, please contact the development team.

---

**Status**: 🟢 **PRODUCTION READY**
**Version**: 1.0.0
**Last Updated**: 2025-01-27
