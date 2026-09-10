@echo off
echo.
echo ============================================================
echo   MANGANAI - Starting Application
echo ============================================================
echo.

:: Start backend
echo Starting FastAPI backend on http://localhost:8000 ...
start "MANGANAI Backend" cmd /k "cd /d %~dp0..\backend && venv\Scripts\uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

:: Wait a moment for backend to initialize
ping -n 4 127.0.0.1 >nul

:: Start frontend
echo Starting Vite frontend on http://localhost:5173 ...
start "MANGANAI Frontend" cmd /k "cd /d %~dp0..\frontend && npm run dev"

:: Wait for frontend to start
ping -n 5 127.0.0.1 >nul

:: Open browser
echo.
echo Opening browser...
start http://localhost:5173

echo.
echo ============================================================
echo   MANGANAI is running!
echo   Backend API:  http://localhost:8000
echo   Frontend:     http://localhost:5173
echo   API Docs:     http://localhost:8000/docs
echo.
echo   Close the two terminal windows to stop the application.
echo ============================================================
echo.
