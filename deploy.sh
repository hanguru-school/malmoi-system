#!/bin/bash

echo "🚀 Deploying Booking System to Vercel + AWS..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment completed!"
echo "📝 Next steps:"
echo "1. Set up AWS S3 bucket"
echo "2. Configure environment variables in Vercel dashboard"
echo "3. Set up AWS RDS database (optional)"
echo "4. Configure AWS credentials" 