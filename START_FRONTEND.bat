@echo off
echo ========================================
echo  VulnScanner Pro - Frontend (Next.js)
echo ========================================
cd /d "%~dp0frontend"
echo Installing npm packages...
npm install
echo.
echo Starting Next.js on http://localhost:3000
echo Press Ctrl+C to stop.
echo.
npm run dev
pause
