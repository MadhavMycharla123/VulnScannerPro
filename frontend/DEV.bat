@echo off
echo ================================
echo   VulnScanner - DEV MODE
echo ================================
echo.
echo Installing dependencies...
pnpm install --ignore-scripts

echo.
echo Starting dev server...
echo Open your browser at: http://localhost:3000
echo.
pnpm exec next dev -H 0.0.0.0 -p 3000
