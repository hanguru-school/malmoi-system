# Booking System - Production Ready

A comprehensive booking and management system for educational institutions, built with Next.js 15, Prisma, and AWS services.

## 🚀 Production Deployment

This project is configured for **direct deployment to production** via Vercel with automatic deployments from GitHub.

### Live Site
- **Production URL**: https://app.hanguru.school
- **Health Check**: https://app.hanguru.school/api/health

### Automatic Deployment
- Push to `main` branch triggers automatic deployment
- GitHub Actions runs tests and builds
- Vercel deploys to production immediately
- Zero-downtime deployments

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15 with App Router
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (AWS RDS)
- **Authentication**: AWS Cognito
- **File Storage**: AWS S3
- **Hosting**: Vercel
- **ORM**: Prisma

### Key Features
- Role-based access control (Admin, Student, Teacher, Staff)
- Real-time booking system
- File upload and management
- Authentication with AWS Cognito
- Responsive design
- PWA support

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Local Development
```bash
# Clone repository
git clone https://github.com/hanguru-school/malmoi-system.git
cd malmoi-system

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your local configuration

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin pages
│   ├── student/           # Student pages
│   ├── teacher/           # Teacher pages
│   ├── staff/             # Staff pages
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utility functions
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript type definitions
```

## 🔐 Authentication

### User Roles
- **Admin**: Full system access
- **Student**: Booking and learning features
- **Teacher**: Class management
- **Staff**: Administrative tasks

### Login Credentials
- **Admin**: admin@hanguru.school / admin123
- **Student**: hp9419@gmail.com / gtbtyj

## 🚀 Deployment

### Production Deployment
The project is configured for automatic deployment to production:

1. **Push to main branch**
2. **GitHub Actions** runs tests and builds
3. **Vercel** deploys to production
4. **Live site** updated at https://app.hanguru.school

### Environment Variables
All production environment variables are configured in Vercel:
- Database connection
- AWS credentials
- Cognito configuration
- JWT secrets

## 📊 Monitoring

### Health Checks
- Production health: https://app.hanguru.school/api/health
- Database connectivity monitoring
- AWS service status

### Performance
- Vercel Analytics
- Database performance monitoring
- Error tracking

## 🔧 Configuration

### Key Files
- `vercel.json` - Vercel deployment configuration
- `next.config.ts` - Next.js production optimizations
- `prisma/schema.prisma` - Database schema
- `.github/workflows/deploy.yml` - CI/CD pipeline

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://...

# AWS
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# Cognito
COGNITO_USER_POOL_ID=your-pool-id
COGNITO_CLIENT_ID=your-client-id

# JWT
JWT_SECRET=your-secret
SESSION_SECRET=your-session-secret
```

## 🛡️ Security

### Security Features
- HTTPS enforced
- Security headers configured
- Role-based access control
- JWT token authentication
- CORS properly configured

### Best Practices
- Environment variables for secrets
- Input validation
- SQL injection prevention
- XSS protection

## 📈 Performance

### Optimizations
- SWC minification
- Bundle splitting
- Image optimization
- CDN distribution
- Static generation where possible

### Monitoring
- Core Web Vitals
- API response times
- Database performance
- Error rates

## 🔄 Development Workflow

### Local Development
1. Make changes locally
2. Test with `npm run dev`
3. Run linting and type checks
4. Commit and push to main

### Production Deployment
1. Push to main branch
2. GitHub Actions automatically runs
3. Vercel deploys to production
4. Site is live immediately

## 🆘 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check TypeScript errors
npm run type-check

# Check linting errors
npm run lint

# Verify dependencies
npm install
```

#### Database Issues
```bash
# Reset database
npx prisma migrate reset

# Generate Prisma client
npx prisma generate
```

#### Deployment Issues
- Check Vercel deployment logs
- Verify environment variables
- Review GitHub Actions workflow

## 📞 Support

### Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [AWS Documentation](https://docs.aws.amazon.com/)

### Contact
For production issues:
1. Check Vercel deployment logs
2. Review GitHub Actions workflow
3. Monitor AWS CloudWatch metrics
4. Contact development team

## 📄 License

This project is proprietary software for Hanguru School.

---

**Last Updated**: July 31, 2025  
**Version**: 1.0.0  
**Production URL**: https://app.hanguru.school
