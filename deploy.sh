#!/bin/bash
# TechUs — Vercel Deployment Script
# Run this script after importing the GitHub repo on Vercel
#
# Prerequisites:
# 1. Vercel CLI installed: npm install -g vercel
# 2. Vercel account created at https://vercel.com
# 3. This repo imported on Vercel: https://vercel.com/new
#
# After running this script, set the env vars on Vercel dashboard:
#   Settings → Environment Variables
#   - DATABASE_URL (Neon Postgres connection)
#   - NEXTAUTH_SECRET (random 32+ char string)
#   - NEXTAUTH_URL (your Vercel URL)

set -e

echo "=== TechUs Vercel Deployment ==="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "Installing Vercel CLI..."
  npm install -g vercel
fi

# Login (will open browser)
echo "Step 1: Login to Vercel (will open browser)..."
vercel login

# Pull environment variables from Vercel
echo ""
echo "Step 2: Linking project to Vercel..."
vercel link

# Set environment variables
echo ""
echo "Step 3: Setting environment variables..."
read -p "Enter your Neon DATABASE_URL: " DB_URL
read -p "Enter NEXTAUTH_SECRET (or press Enter to auto-generate): " AUTH_SECRET
if [ -z "$AUTH_SECRET" ]; then
  AUTH_SECRET=$(openssl rand -base64 32)
  echo "Generated NEXTAUTH_SECRET: $AUTH_SECRET"
fi

echo "Adding env vars to Vercel..."
echo "$DB_URL" | vercel env add DATABASE_URL production
echo "$AUTH_SECRET" | vercel env add NEXTAUTH_SECRET production

# Deploy to production
echo ""
echo "Step 4: Deploying to production..."
DEPLOY_URL=$(vercel --prod --yes 2>&1 | grep -oE "https://[a-z0-9-]+\.vercel\.app" | head -1)

if [ -z "$DEPLOY_URL" ]; then
  echo "Setting NEXTAUTH_URL to deployment URL..."
  echo "$DEPLOY_URL" | vercel env add NEXTAUTH_URL production
  vercel --prod --yes
fi

echo ""
echo "=== Deployment Complete ==="
echo "URL: $DEPLOY_URL"
echo "Login URL: $DEPLOY_URL"
