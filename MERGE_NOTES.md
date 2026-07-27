# Merge Notes: Docker Compose Dev/Prod Setup

**Source Branch:** `origin/feat/docker-compose-setup` (commit `8516cd7`)
**Target Branch:** `main` (HEAD `3d574cd` → merged as `fc2f02c`)
**Base Commit:** `26ddaa2`
**Merge Date:** 2026-07-27

---

## Overview

Integrated Docker Compose development and production setup from PR `feat/docker-compose-setup` with modifications to preserve existing working versions and local development workflows.

---

## What Was Implemented (Accepted from PR)

### New Files Added

| File | Purpose |
|------|---------|
| `.dockerignore` | Excludes git, binaries, node_modules, large assets (src/, images), data, logs |
| `docker-compose.yml` | Dev (3 services) + Prod (1 service) profiles |
| `Dockerfile.prod` | Multi-stage: frontend build → backend build → alpine runtime |
| `backend/Dockerfile.dev` | Backend dev container with air hot reload |
| `backend/.air.toml` | Air config: watches .go/.yaml, excludes frontend/data/var/src |
| `frontend/Dockerfile.dev` | Frontend Vite dev server container |
| `frontend/nginx.dev.conf` | Nginx reverse proxy for dev (single port :5173) |

### Dev Profile (`docker compose --profile dev up`)
- **backend-dev**: Go 1.26-alpine, air hot reload, mounts source + data + var
- **frontend-dev**: Node 22-alpine, Vite dev server, mounts source + node_modules volume
- **nginx-dev**: Nginx alpine, proxies `/api/*` → backend-dev:8080, `/*` → frontend-dev:5173

### Prod Profile (`docker compose --profile prod up`)
- **app-prod**: Multi-stage build
  - Stage 1: Frontend build (npm ci + npm run build)
  - Stage 2: Backend build (go build -o server)
  - Stage 3: Alpine 3.20 runtime with server binary + frontend/dist + config + data + var

---

## What Was NOT Implemented (Rejected/Modified)

### 1. `@vitejs/plugin-react` Version Upgrade (REJECTED)
| | |
|---|---|
| **PR Requested** | `^5.0.0` |
| **Our Version** | `^4.7.0` (current, working) |
| **Reason** | Our Vite 8.1.5 + plugin-react 4.7.0 works correctly (only deprecation warnings). No compelling reason to upgrade. Avoids potential breaking changes with React 18 / Radix UI / TanStack Query stack. |

### 2. `http-proxy-middleware` Dependency (REJECTED)
| | |
|---|---|
| **PR Added** | `"http-proxy-middleware": "^4.2.0"` in devDependencies |
| **Our Decision** | Removed |
| **Reason** | Not imported anywhere in our codebase. Vite's built-in proxy handles `/api` for local dev. Nginx handles proxy in Docker. Unnecessary dependency. |

### 3. `vite.config.ts` Proxy Removal (MODIFIED)
| | |
|---|---|
| **PR Removed** | `/api` proxy configuration |
| **PR Added** | `host: '0.0.0.0'` only |
| **Our Resolution** | **KEEP BOTH** |
| **Result** | ```ts<br>server: {<br>  port: 5173,<br>  host: '0.0.0.0',        // for Docker<br>  proxy: {                // for local dev<br>    '/api': { target: 'http://localhost:8080', changeOrigin: true }<br>  }<br>}``` |
| **Reason** | Local `npm run dev` needs Vite proxy to reach backend on localhost:8080. Docker dev uses nginx for proxy. Both coexist without conflict. |

### 4. `README.md` Rewrite (MERGED SELECTIVELY)
| | |
|---|---|
| **PR Approach** | Replaced entire Quick Start with Docker-first, renamed sections to English |
| **Our Approach** | Prepend Docker as **Optional**, keep all detailed sections (Architecture, API, Builder, License, Development, Data Structure, Roadmap) in Portuguese as-is |
| **Reason** | Documentation depth preserved. Docker is an option, not the standard for early alpha. |

### 5. `backend/backend/config.yaml` (DELETED)
| | |
|---|---|
| **PR Created** | Empty file at `backend/backend/config.yaml` |
| **Our Action** | Deleted |
| **Reason** | Not used. Our config loads from `backend/config.yaml` via `CONFIG_PATH` env or default paths. Prod Dockerfile copies to `/app/backend/config.yaml` which works with `CONFIG_PATH=/app/backend/config.yaml`. |

---

## Modifications Made During Integration

### 1. `.dockerignore` — Expanded Exclusions
**Added:**
```
src/
*.png
*.webp
*.jpg
*.jpeg
.opencode/
```
**Impact:** Build context reduced from ~1.3GB to ~32MB. Excludes PDF sources, images, wiki files not needed in container.

### 2. `backend/.air.toml` — Fixed Go VCS Stamping
**Changed:**
```toml
cmd = "go build -buildvcs=false -o ./tmp/main ./cmd/server"
```
**Reason:** Go 1.26+ embeds VCS info by default. In Docker container (no .git), this causes build failure: `error obtaining VCS status: exit status 128`. `-buildvcs=false` disables this.

### 3. `cmd/server/main.go` — Added `/api/health` Endpoint
**Added:**
```go
mux.HandleFunc("GET /api/health", srv.handleHealth)
```
**Reason:** Nginx dev profile health checks and API consumers expect `/api/health`. Previously only `/health` existed.

### 4. `frontend/vite.config.ts` — Dual Config
**Kept proxy + added host:**
```ts
server: {
  port: 5173,
  host: '0.0.0.0',
  proxy: { '/api': { target: 'http://localhost:8080', changeOrigin: true } }
}
```

### 5. `frontend/package.json` — Preserved Versions
- `@vitejs/plugin-react`: `^4.7.0` (not upgraded to ^5.0.0)
- No `http-proxy-middleware` added
- All other deps unchanged

---

## Testing Results

| Scenario | Command | Result |
|----------|---------|--------|
| **Local dev (primary)** | `go run ./cmd/server/` + `cd frontend && npm run dev` | ✅ Works — API on :8080, Vite on :5173 with proxy |
| **Docker dev (optional)** | `docker compose --profile dev up --build -d` | ✅ Works — nginx on :5173 routes to both |
| **Docker prod (optional)** | `docker compose --profile prod up --build -d` | ✅ Works — single container on :8080 serves API + SPA |
| **Frontend build** | `cd frontend && npm run build` | ✅ Success — 278KB gzipped JS |
| **Backend build** | `go build -o server ./cmd/server/` | ✅ Success |
| **API endpoints via nginx** | `curl localhost:5173/api/*` | ✅ All working (health, content, metamagic, feats, spells, etc.) |

---

## Known Limitations / Caveats

### 1. 5etools Import in Docker
- **Issue:** 5etools feature descriptions expect `../5etools-src/data/` relative to binary
- **In Docker:** Path doesn't exist → import skipped with warning (already handled gracefully in code)
- **Workaround:** Run locally for full 5etools data, or mount `../5etools-src:/app/5etools-src` in compose (not added)

### 2. SQLite Database in Container
- **Dev:** Mounted `./var:/app/var` — persists on host, shared with local runs
- **Prod:** Copied `var/` at build time — fresh DB on each build unless volume mounted
- **Note:** WAL mode enabled, single writer (air + server don't run simultaneously in same profile)

### 3. Large Build Context Initially
- **Fixed by** expanded `.dockerignore` (excludes `src/`, images, binaries)
- **Before:** 1.3GB context, 5+ min transfer
- **After:** ~32MB context, ~30s transfer

### 4. Go VCS Stamping
- **Fixed by** `-buildvcs=false` in air build command
- **Note:** Prod build doesn't use air, so `go build` in Dockerfile.prod works without flag (build context has .git)

---

## Migration Guide for Team

### To Use Docker Dev
```bash
docker compose --profile dev up --build -d
# Access: http://localhost:5173
# API: http://localhost:5173/api/
```

### To Use Docker Prod
```bash
docker compose --profile prod up --build -d
# Access: http://localhost:8080
# API: http://localhost:8080/api/
```

### To Use Local Dev (Recommended for Active Development)
```bash
# Terminal 1
go run ./cmd/server/

# Terminal 2
cd frontend && npm run dev
# Access: http://localhost:5173
# API proxies to http://localhost:8080
```

### Cleanup
```bash
docker compose --profile dev down -v
docker compose --profile prod down -v
```

---

## Related Commits

| Commit | Description |
|--------|-------------|
| `fc2f02c` | **This merge** — Docker Compose dev/prod setup |
| `3d574cd` | Sorcerer metamagic + feat/ASI infrastructure + AGPL-3.0 + docs |
| `8516cd7` | PR source: feat: docker-compose dev/prod setup (Rafael Lobo) |

---

## Acceptance Criteria Met

- Dev profile: hot reload for frontend (Vite HMR) + backend (air)
- Prod profile: single container, multi-stage build, serves SPA + API
- Local dev workflow unchanged and working
- No version downgrades or forced upgrades
- Build context optimized (< 50MB)
- All API endpoints accessible via nginx in dev
- Documentation updated: Docker as optional, local as primary
- License, AGPL, 5e.tools attribution preserved

---

**Merged by:** hadnu  
**Date:** 2026-07-27  
**Strategy:** Ours-versions (PR adapts to our working baseline)