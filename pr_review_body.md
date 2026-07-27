## Review: feat: docker-compose dev/prod setup

Thanks for the PR, Rafael. The Docker Compose setup is well-structured and follows good practices (multi-stage prod build, nginx reverse proxy for dev, proper volume mounts).

### Merged with modifications (commit fc2f02c)

I merged the PR locally with the following adjustments to preserve our working versions and local development workflow:

### Accepted as-is
- `.dockerignore`, `docker-compose.yml`, `Dockerfile.prod`
- `backend/Dockerfile.dev`, `backend/.air.toml`
- `frontend/Dockerfile.dev`, `frontend/nginx.dev.conf`
- Dev profile (3 services) and prod profile (1 service) structure

### Rejected / Modified

**1. @vitejs/plugin-react version (kept 4.7.0)**
- PR requested upgrade to ^5.0.0
- Our Vite 8.1.5 + plugin-react 4.7.0 works correctly (only deprecation warnings)
- No compelling reason to upgrade; avoids potential breaking changes with React 18 / Radix UI / TanStack Query stack

**2. http-proxy-middleware dependency (removed)**
- Added in PR but not imported anywhere in codebase
- Vite built-in proxy handles `/api` for local dev; nginx handles proxy in Docker
- Unnecessary dependency

**3. vite.config.ts proxy removal (kept both)**
- PR removed `/api` proxy, added only `host: '0.0.0.0'`
- Our resolution: keep proxy for local dev + add host for Docker
- Both coexist without conflict

**4. README.md (merged selectively)**
- PR replaced Quick Start with Docker-first, renamed sections to English
- Our approach: prepend Docker as Optional, keep all detailed sections (Architecture, API, Builder, License, Development, Data Structure, Roadmap) as-is
- Docker is an option, not the standard for early alpha

**5. backend/backend/config.yaml (deleted)**
- Empty file created by PR, not used
- Config loads from `backend/config.yaml` via CONFIG_PATH env

### Additional fixes during integration
- `.dockerignore`: expanded to exclude `src/`, images, binaries (build context 1.3GB -> 32MB)
- `backend/.air.toml`: added `-buildvcs=false` to fix Go VCS stamping error in container
- `cmd/server/main.go`: added `GET /api/health` endpoint for nginx health checks

### Testing verified
- Local dev: `go run ./cmd/server/` + `npm run dev` works
- Docker dev: `docker compose --profile dev up --build -d` works (nginx on :5173)
- Docker prod: `docker compose --profile prod up --build -d` works (single container on :8080)
- All API endpoints accessible via nginx

### Known limitations documented
- 5etools import skipped in Docker (no ../5etools-src mount)
- SQLite persistence differs between dev (mounted) and prod (copied at build)

---

**Strategy:** Ours-versions (PR adapts to our working baseline). No version downgrades or forced upgrades.

Ready to merge when you're aligned with these adjustments.