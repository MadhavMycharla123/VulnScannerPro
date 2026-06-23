@echo off
echo ============================================
echo   VulnScanner Pro - Frontend
echo ============================================
echo.
echo Installing packages (first time only)...
call pnpm install --ignore-scripts
echo.
echo Starting frontend at http://localhost:3000
echo.
pnpm exec next dev -H 0.0.0.0 -p 3000
