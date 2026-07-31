#!/bin/bash
# Run both backend and frontend without Docker

set -e

# Add Go to PATH
export PATH=$PATH:~/.local/go/bin

PROJECT_ROOT="/home/lobo/projects/arcanum-dnd"
BACKEND_BIN="$PROJECT_ROOT/server"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "Starting Arcanum D&D Character Builder..."
echo "Backend: http://localhost:8080"
echo "Frontend: http://localhost:5173"
echo ""

# Start backend
cd "$PROJECT_ROOT"
echo "Starting backend on :8080..."
"$BACKEND_BIN" &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend
cd "$FRONTEND_DIR"
echo "Starting frontend on :5173..."
npm run dev &
FRONTEND_PID=$!

# Handle shutdown
trap "echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID