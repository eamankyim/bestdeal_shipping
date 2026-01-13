#!/bin/bash

# ShipEASE Vercel Deployment Script
# This script helps deploy both frontend and backend to Vercel

echo "🚀 ShipEASE Vercel Deployment Script"
echo "======================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed."
    echo "   Install it with: npm i -g vercel"
    exit 1
fi

echo "✅ Vercel CLI found"
echo ""

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "⚠️  Not logged in to Vercel"
    echo "   Please run: vercel login"
    exit 1
fi

echo "✅ Logged in to Vercel"
echo ""

# Ask which project to deploy
echo "Which project would you like to deploy?"
echo "1) Backend only"
echo "2) Frontend only"
echo "3) Both (Backend first, then Frontend)"
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📦 Deploying Backend..."
        cd backend
        vercel --prod
        cd ..
        ;;
    2)
        echo ""
        echo "📦 Deploying Frontend..."
        cd frontend
        vercel --prod
        cd ..
        ;;
    3)
        echo ""
        echo "📦 Deploying Backend first..."
        cd backend
        vercel --prod
        BACKEND_URL=$(vercel ls | grep -o 'https://[^ ]*' | head -1)
        echo "✅ Backend deployed at: $BACKEND_URL"
        echo ""
        echo "⚠️  IMPORTANT: Update frontend REACT_APP_API_URL with: $BACKEND_URL"
        echo ""
        cd ..
        read -p "Press Enter to continue with frontend deployment..."
        echo ""
        echo "📦 Deploying Frontend..."
        cd frontend
        vercel --prod
        cd ..
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Set environment variables in Vercel dashboard"
echo "2. Update CORS_ORIGINS in backend with frontend URL"
echo "3. Update REACT_APP_API_URL in frontend with backend URL"
echo "4. Redeploy both projects"
echo ""
echo "See VERCEL_DEPLOYMENT.md for detailed instructions"

