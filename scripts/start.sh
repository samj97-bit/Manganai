#!/bin/bash
# MANGANAI - Start Application (Linux/macOS)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo ""
echo "============================================================"
echo "  MANGANAI - Starting Application"
echo "============================================================"
echo ""

# Start backend in background
echo "Starting FastAPI backend on http://localhost:8000 ..."
backend/venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 --app-dir backend &
BACKEND_PID=$!

sleep 2

# Start frontend in background
echo "Starting Vite frontend on http://localhost:5173 ..."
cd frontend && npm run dev &
FRONTEND_PID=$!

sleep 3

echo ""
echo "============================================================"
echo "  MANGANAI is running!"
echo "  Backend API:  http://localhost:8000"
echo "  Frontend:     http://localhost:5173"
echo "  API Docs:     http://localhost:8000/docs"
echo ""
echo "  Press Ctrl+C to stop all services."
echo "============================================================"
echo ""

# Open browser (macOS / Linux)
if command -v open &> /dev/null; then
    open http://localhost:5173
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173
fi

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT
wait
