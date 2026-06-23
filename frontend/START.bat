@echo off
echo ================================
echo   VulnScanner - Starting up...
echo ================================
echo.

where node >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install from https://nodejs.org
    pause
    exit /b 1
)

where pnpm >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo Installing pnpm...
    npm install -g pnpm
)

echo Installing dependencies...
pnpm install --ignore-scripts

echo.
echo Building project (this takes 1-2 minutes)...
pnpm exec next build

echo.
echo Starting server...
echo Open your browser at: http://localhost:3000
echo.
pnpm exec next start -H 0.0.0.0 -p 3000
