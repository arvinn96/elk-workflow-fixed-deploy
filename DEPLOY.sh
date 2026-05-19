#!/usr/bin/env bash
# ELK-Workflow — One-click Vercel deploy
# Run: chmod +x DEPLOY.sh && ./DEPLOY.sh
set -e

echo "▶  Installing dependencies..."
npm install --legacy-peer-deps

echo "▶  Deploying to Vercel..."
npx vercel@latest deploy \
  --token "YOUR_VERCEL_TOKEN" \
  --project "elk-workflow-fixed" \
  --prod --yes \
  -e NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY" \
  -e SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY" \
  -e OPENROUTER_API_KEY="YOUR_OPENROUTER_API_KEY"

echo "✅ Done! Your live URL is printed above."
