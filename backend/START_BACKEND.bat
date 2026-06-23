@echo off
echo ============================================
echo   VulnScanner Pro - Python Backend v2.0
echo ============================================
echo.

where python >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    where py >nul 2>nul
    IF %ERRORLEVEL% NEQ 0 (
        echo ERROR: Python not found! Install from https://www.python.org
        pause
        exit /b 1
    )
    set PYTHON=py -3
) ELSE (
    set PYTHON=python
)

echo Installing packages...
%PYTHON% -m pip install --user -r requirements.txt --quiet

echo.
echo Starting backend on http://localhost:8000
echo API docs: http://localhost:8000/docs
echo Press CTRL+C to stop
echo.
%PYTHON% -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
