# Plan: Integrate Docker Compose PR Without Downgrades

**Source:** `origin/feat/docker-compose-setup` (commit `8516cd7`)
**Target:** `main` (HEAD `3d574cd`)
**Constraint:** No version downgrades - PR must adapt to our versions, or we update it ourselves

---

## Current Version Baseline (DO NOT DOWNGRADE)

| Component | Current Version | PR Version | Action |
|-----------|-----------------|------------|--------|
| Vite | `8.1.5` | `8.x` | ✅ Compatible |
| @vitejs/plugin-react | `4.7.0` | `^5.0.0` | **PR needs update** - we use 4.7.0 with Vite 8 (works with warnings) |
| React | `18.3.1` | `18.x` | ✅ Compatible |
| Go | `1.26` (Dockerfile) | `1.26` | ✅ Compatible |
| Node | `22-alpine` | `22-alpine` | ✅ Compatible |

**Note:** Our `@vitejs/plugin-react@4.7.0` works with Vite 8.1.5 (deprecation warnings only). We will NOT upgrade to plugin-react 5 unless there's a compelling reason. The PR should adapt to our version.

---

## Conflict Resolution Strategy

### 1. `vite.config.ts` — Keep Our Proxy + Add Host
```ts
server: {
  port: 5173,
  host: '0.0.0.0',        // ADD from PR (for Docker)
  proxy: {                // KEEP ours (for local dev)
    '/api': { target: 'http://localhost:8080', changeOrigin: true }
  }
}
```

### 2. `package.json` — Reject PR's Dependency Changes
- **Keep** `@vitejs/plugin-react: ^4.7.0` (our working version)
- **Reject** `http-proxy-middleware` (unused in our codebase)
- **Keep** all other dependencies as-is

### 3. `README.md` — Merge: Our Content + PR's Docker Section
Structure:
```markdown
# ARCANUM

## Quick Start

### Docker (Optional)                    ← FROM PR (adapted)
```sh
# Development with hot reload
docker compose --profile dev up -d
# Access at http://localhost:5173

# Production (single container)
docker compose --profile prod up -d
# Access at http://localhost:8080
```

### Local Development (Primary)          ← KEEP OURS
```sh
go run ./cmd/server/
cd frontend && npm run dev
```

... rest of our sections unchanged (Architecture, API, Builder, License, etc.)
```

### 4. `backend/backend/config.yaml` — Delete
Empty file, not used. Our config loads from `backend/config.yaml` via `CONFIG_PATH`.

---

## Files to Accept As-Is (No Conflicts)

| File | Status |
|------|--------|
| `.dockerignore` | ✅ New, correct |
| `docker-compose.yml` | ✅ New, dev/prod profiles |
| `Dockerfile.prod` | ✅ New, multi-stage |
| `backend/Dockerfile.dev` | ✅ New, air hot reload |
| `backend/.air.toml` | ✅ New, watches root, excludes frontend/data/var |
| `frontend/Dockerfile.dev` | ✅ New, Vite dev server |
| `frontend/nginx.dev.conf` | ✅ New, nginx proxy with Docker DNS resolver |

---

## Docker Compose Adjustments Needed

### Dev Profile (`docker-compose.yml`)
```yaml
frontend-dev:
  build:
    context: ./frontend
    dockerfile: Dockerfile.dev
  # Change: use our package.json (no http-proxy-middleware)
  # npm install will use our lockfile
```

### Prod Profile (`Dockerfile.prod`)
```dockerfile
# Stage 1: Frontend build
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --legacy-peer-deps    # Use our lockfile, no new deps
COPY frontend/ ./
RUN npm run build
# ... rest unchanged
```

---

## Testing Matrix

| Scenario | Command | Expected |
|----------|---------|----------|
| **Local dev (primary)** | `go run ./cmd/server/` + `npm run dev` | :5173 → proxies /api to :8080 |
| **Docker dev (optional)** | `docker compose --profile dev up --build` | :5173 (nginx → frontend + backend) |
| **Docker prod (optional)** | `docker compose --profile prod up --build` | :8080 (single container) |
| **Frontend build** | `cd frontend && npm run build` | Success, no version conflicts |

---

## 5etools Limitation (Document)

In Docker, `../5etools-src/data/` won't exist relative to container. Import skips with warning (already handled in code). Add note to README:
> **Note:** 5etools feature descriptions require local `../5etools-src/` directory. In Docker, this import is skipped (warning logged). For full feature data, run locally or mount the directory.

---

## Execution Steps

1. `git merge origin/feat/docker-compose-setup --no-commit`
2. Resolve conflicts per strategy above
3. Delete `backend/backend/config.yaml`
4. `cd frontend && npm install` (uses our package.json + lockfile)
5. `cd frontend && npm run build` (verify)
6. Test local dev workflow
7. Test Docker dev profile
8. Test Docker prod profile
9. Commit

---

## Questions for Clarification

1. **Air config**: PR's `.air.toml` watches project root. Any existing air config to merge?
2. **CORS in Docker dev**: nginx proxies from :5173 → backend. Our CORS allows `localhost:5173` — works. Confirm?
3. **Volume mounts**: PR mounts `./data:/app/data` and `./var:/app/var`. Our paths match. Confirm?
4. **Frontend Dockerfile.dev**: Uses `npm install --legacy-peer-deps`. Our lockfile is compatible?

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Plugin-react 4.7 + Vite 8 deprecation warnings | Acceptable - works correctly, warnings only |
| Docker dev doesn't hot-reload backend | `.air.toml` excludes correct dirs, watch mode enabled |
| Prod image too large | Multi-stage already minimizes; user handles size |
| 5etools import missing in Docker | Documented limitation, not a blocker |

---

**Decision**: Proceed with merge using OUR versions. PR adapts to us.