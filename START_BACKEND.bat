@echo off
echo ========================================
echo  VulnScanner Pro - Backend (FastAPI)
echo ========================================
cd /d "%~dp0backend"
echo Installing requirements...
pip install -r requirements.txt
echo.
echo Starting FastAPI on http://localhost:8000
echo Press Ctrl+C to stop.
echo.
uvicorn main:app --reload --port 8000
pause
