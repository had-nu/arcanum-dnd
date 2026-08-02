#!/bin/bash
# Run both backend and frontend without Docker

set -e

# Resolve project root from script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
BUILD_DIR="$PROJECT_ROOT/build"
BACKEND_BIN="$BUILD_DIR/server"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Ensure Go is in PATH (standard locations)
export PATH="$PATH:/usr/local/go/bin:$HOME/go/bin"

echo "Starting Arcanum D&D Character Builder..."
echo "Backend: http://localhost:8080"
echo "Frontend: http://localhost:5173"
echo ""

# Build backend if not present
if [[ ! -x "$BACKEND_BIN" ]]; then
    echo "Building backend..."
    cd "$PROJECT_ROOT"
    make build-backend
fi

# Start backend
cd "$PROJECT_ROOT"
echo "Starting backend on :8080..."
"$BACKEND_BIN" &
BACKEND_PID=$!

# Wait for backend to be ready (health check instead of sleep)
echo "Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -sf http://localhost:8080/health >/dev/null 2>&1; then
        echo "Backend ready"
        break
    fi
    sleep 0.2
done

# Start frontend
cd "$FRONTEND_DIR"
echo "Starting frontend on :5173..."
npm run dev &
FRONTEND_PID=$!

# Handle shutdown
trap "echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID