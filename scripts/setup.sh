#!/bin/bash
# MANGANAI - Setup Script (Linux/macOS)

set -e

echo ""
echo "============================================================"
echo "  MANGANAI - AI Manganese Exploration Intelligence Platform"
echo "  SIH 2026 Prototype"
echo "============================================================"
echo ""

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 not found. Please install Python 3.10+"
    exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Please install Node.js 18+"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "[1/4] Setting up Python virtual environment..."
if [ ! -d "backend/venv" ]; then
    python3 -m venv backend/venv
    echo "Virtual environment created."
else
    echo "Virtual environment already exists."
fi

echo ""
echo "[2/4] Installing backend dependencies..."
backend/venv/bin/pip install -r backend/requirements.txt -q
echo "Backend dependencies installed."

echo ""
echo "[3/4] Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "node_modules already exists, skipping npm install."
fi

echo ""
echo "[4/4] Setting up environment files..."
cd ..
if [ ! -f "frontend/.env" ]; then
    cp .env.example frontend/.env
    echo "Created frontend/.env from .env.example"
    echo ""
    echo "*** IMPORTANT: Edit frontend/.env and add your VITE_GOOGLE_MAPS_API_KEY ***"
    echo "    (The app works without it using the built-in demo map)"
else
    echo "frontend/.env already exists."
fi

echo ""
echo "============================================================"
echo "  Setup Complete! Run ./scripts/start.sh to launch the app."
echo "============================================================"
echo ""
