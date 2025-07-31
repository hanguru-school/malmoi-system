# Production Deployment Guide

This guide explains how to deploy the booking system directly to production using Vercel with automatic deployments from GitHub.

## 🚀 Production Setup

### 1. Vercel Configuration

The project is configured for automatic deployment to `https://app.hanguru.school` via Vercel.

#### Key Configuration Files:
- `vercel.json` - Vercel deployment configuration
- `next.config.ts` - Next.js production optimizations
- `package.json` - Build scripts optimized for production

### 2. Environment Variables

All production environment variables are configured in `vercel.json`:

#### Database Configuration:
```json
"DATABASE_URL": "postgresql://malmoi_admin:malmoi_admin_password_2024@malmoi-system-db-tokyo.crooggsemeim.ap-northeast-1.rds.amazonaws.com:5432/malmoi_system?sslmode=require"
```

#### AWS Configuration:
```json
"AWS_REGION": "ap-northeast-1",
"AWS_ACCESS_KEY_ID": "your-access-key",
"AWS_SECRET_ACCESS_KEY": "your-secret-key",
"S3_BUCKET_NAME": "malmoi-system-files"
```

#### Cognito Configuration:
```json
"COGNITO_USER_POOL_ID": "ap-northeast-1_ojlXfDMDm",
"COGNITO_CLIENT_ID": "4bdn0n9r92huqpcs21e0th1nve"
```

### 3. Automatic Deployment Workflow

#### GitHub Actions (`/.github/workflows/deploy.yml`):
- Triggers on push to `main` branch
- Runs type checking and linting
- Builds the application
- Deploys to Vercel production environment

#### Deployment Process:
1. **Code Push**: Push changes to `main` branch
2. **GitHub Actions**: Automatically runs tests and builds
3. **Vercel Deployment**: Deploys to production domain
4. **Live Update**: Site is immediately available at `https://app.hanguru.school`

### 4. Production Optimizations

#### Build Optimizations:
- Prisma client generation during build
- SWC minification enabled
- Bundle splitting for vendor code
- Image optimization with WebP/AVIF support

#### Security Headers:
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

#### Performance Optimizations:
- Automatic code splitting
- Static asset optimization
- CDN distribution via Vercel

### 5. Development Workflow

#### Local Development:
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run linting
npm run type-check   # Run TypeScript checks
```

#### Production Deployment:
```bash
git add .
git commit -m "Your commit message"
git push origin main
# Automatic deployment to production
```

### 6. Monitoring and Maintenance

#### Health Checks:
- Production health endpoint: `https://app.hanguru.school/api/health`
- Database connectivity monitoring
- AWS service status monitoring

#### Error Monitoring:
- Vercel function logs
- Database connection monitoring
- API error tracking

### 7. Rollback Strategy

If issues occur in production:

1. **Immediate Rollback**: Use Vercel dashboard to rollback to previous deployment
2. **Hot Fix**: Push emergency fixes to `main` branch
3. **Database Rollback**: Use Prisma migrations if needed

### 8. Security Considerations

#### Environment Variables:
- All sensitive data stored in Vercel environment variables
- No secrets in code repository
- AWS credentials properly configured

#### Authentication:
- AWS Cognito for user authentication
- JWT tokens for session management
- Role-based access control implemented

### 9. Performance Monitoring

#### Key Metrics:
- Page load times
- API response times
- Database query performance
- Error rates

#### Tools:
- Vercel Analytics
- Database performance monitoring
- AWS CloudWatch metrics

### 10. Backup Strategy

#### Database Backups:
- Automated daily backups via AWS RDS
- Point-in-time recovery available
- Backup retention: 30 days

#### Code Backups:
- GitHub repository as primary backup
- Vercel deployment history
- Local development copies

## 🎯 Quick Start

1. **Clone Repository**:
   ```bash
   git clone https://github.com/hanguru-school/malmoi-system.git
   cd malmoi-system
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Local Development**:
   ```bash
   npm run dev
   ```

4. **Deploy to Production**:
   ```bash
   git push origin main
   ```

## 📋 Production Checklist

- [ ] All environment variables configured in Vercel
- [ ] Database migrations applied
- [ ] AWS services properly configured
- [ ] Cognito user pool set up
- [ ] S3 bucket permissions configured
- [ ] Health checks passing
- [ ] SSL certificate valid
- [ ] Domain properly configured
- [ ] Monitoring alerts set up
- [ ] Backup strategy implemented

## 🔧 Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check TypeScript errors
   - Verify all dependencies installed
   - Review Vercel build logs

2. **Database Connection Issues**:
   - Verify DATABASE_URL in Vercel
   - Check AWS RDS security groups
   - Confirm database is running

3. **Authentication Issues**:
   - Verify Cognito configuration
   - Check callback URLs
   - Review JWT secret configuration

4. **File Upload Issues**:
   - Check S3 bucket permissions
   - Verify AWS credentials
   - Review CORS configuration

## 📞 Support

For production issues:
1. Check Vercel deployment logs
2. Review GitHub Actions workflow
3. Monitor AWS CloudWatch metrics
4. Contact development team

---

**Last Updated**: July 31, 2025
**Version**: 1.0.0 