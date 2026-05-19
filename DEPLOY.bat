@echo off
echo.
echo Installing dependencies...
call npm install --legacy-peer-deps

echo.
echo Deploying to Vercel...
call npx vercel@latest deploy ^
  --token "YOUR_VERCEL_TOKEN" ^
  --project "elk-workflow-fixed" ^
  --prod ^
  --yes ^
  -e NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL" ^
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY" ^
  -e SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY" ^
  -e OPENROUTER_API_KEY="YOUR_OPENROUTER_API_KEY"

echo.
echo Done! Your live URL is shown above.
pause
