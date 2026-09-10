@echo off
echo.
echo ============================================================
echo   MANGANAI - AI Manganese Exploration Intelligence Platform
echo   SIH 2026 Prototype
echo ============================================================
echo.

:: Switch to the directory containing the project root
cd /d %~dp0..

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python not found. Please install Python 3.10+
    pause
    exit /b 1
)

:: Check for Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)

echo [1/4] Setting up Python virtual environment...
if not exist "backend\venv" (
    python -m venv backend\venv
    echo Virtual environment created.
) else (
    echo Virtual environment already exists.
)

echo.
echo [2/4] Installing backend dependencies...
call backend\venv\Scripts\pip install -r backend\requirements.txt -q
echo Backend dependencies installed.

echo.
echo [3/4] Installing frontend dependencies...
cd frontend
if not exist "node_modules" (
    call npm install
) else (
    echo node_modules already exists, skipping npm install.
)

echo.
echo [4/4] Setting up environment files...
cd ..
if not exist "frontend\.env" (
    copy ".env.example" "frontend\.env" >nul
    echo Created frontend/.env from .env.example
    echo.
    echo *** IMPORTANT: Edit frontend/.env and add your VITE_GOOGLE_MAPS_API_KEY ***
    echo     (The app works without it using the built-in demo map)
    echo.
) else (
    echo frontend/.env already exists.
)

echo.
echo ============================================================
echo   Setup Complete! Run start.bat to launch the application.
echo ============================================================
echo.
pause
