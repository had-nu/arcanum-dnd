# Docker Compose Dev/Prod Setup — Integration Analysis

**Branch:** `origin/feat/docker-compose-setup` (commit `8516cd7`)
**Base:** `26ddaa2` (class sprint commit)
**Current HEAD:** `3d574cd` (metamagic/feats + AGPL + docs)

---

## Summary of Changes in PR

| File | Type | Purpose |
|------|------|---------|
| `docker-compose.yml` | New | Dev (3 services) + Prod (1 service) profiles |
| `backend/Dockerfile.dev` | New | Backend with air hot reload |
| `backend/.air.toml` | New | Air config (watches .go/.yaml, excludes frontend/data/var) |
| `frontend/Dockerfile.dev` | New | Frontend Vite dev server |
| `frontend/nginx.dev.conf` | New | Nginx reverse proxy for dev (single port :5173) |
| `Dockerfile.prod` | New | Multi-stage: frontend build → backend build → alpine runtime |
| `.dockerignore` | New | Excludes git, node_modules, binaries, data, var, logs |
| `frontend/package.json` | Modified | `@vitejs/plugin-react`: `^4.3.4` → `^5.0.0`; add `http-proxy-middleware` |
| `frontend/vite.config.ts` | Modified | Remove `/api` proxy; add `host: '0.0.0.0'` |
| `README.md` | Modified | Add Docker quickstart section |

---

## Impact Analysis

### ✅ Compatible / No Conflicts
- **Docker files** — New files, no overlap with current codebase
- **`.dockerignore`** — New, excludes `var/` (our SQLite DB) correctly
- **`backend/.air.toml`** — Watches project root, excludes `frontend/`, `data/`, `var/` — correct
- **Production Dockerfile** — Copies `backend/config.yaml`, `data/`, `var/`, `frontend/dist/` — matches our structure

### ⚠️ Needs Attention / Potential Conflicts

| Item | Current State | PR State | Action |
|------|---------------|----------|--------|
| **`frontend/vite.config.ts`** | Has `/api` proxy to `localhost:8080` | Proxy removed; `host: '0.0.0.0'` only | **Merge conflict likely** — need to keep proxy for local non-Docker dev |
| **`frontend/package.json`** | `@vitejs/plugin-react`: `^4.3.4` | `^5.0.0` + `http-proxy-middleware` | **Upgrade needed** — Vite 8 requires plugin-react 5 |
| **`README.md`** | Our updated version (endpoints, license, architecture) | Docker quickstart added | **Merge conflict** — need to combine both |
| **`backend/backend/config.yaml`** | Empty file created | — | **Remove** — we use `CONFIG_PATH` env, config is in repo root or `var/` |

### 🔧 Configuration Mismatches

1. **Config path**: PR uses `CONFIG_PATH=/app/backend/config.yaml` but our server loads config from `./config.yaml` or env. Need to verify `config.Load()` behavior.

2. **Data/var mounts**: PR mounts `./data:/app/data` and `./var:/app:var` — matches our structure ✅

3. **Backend dev Dockerfile**: Copies entire repo (`COPY . .`) — includes frontend source, which air watches but excludes via `.air.toml`. Works but heavy.

4. **Frontend dev**: Uses `npm install --legacy-peer-deps` — matches PR's package-lock changes.

---

## Integration Plan

### Step 1: Merge docker-compose files (no conflicts)
```bash
git merge origin/feat/docker-compose-setup --no-commit
# Resolve conflicts in vite.config.ts, package.json, README.md
```

### Step 2: Resolve `vite.config.ts` conflict
**Keep both:** Proxy for local dev, `host: '0.0.0.0'` for Docker.
```ts
server: {
  port: 5173,
  host: '0.0.0.0',
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },
}
```
- Local `npm run dev` → proxies to local backend :8080
- Docker `frontend-dev` → nginx handles `/api` → `backend-dev:8080`

### Step 3: Resolve `package.json`
- Accept `@vitejs/plugin-react: ^5.0.0`
- Accept `http-proxy-middleware` (needed by orval? verify)
- Run `cd frontend && npm install --legacy-peer-deps`

### Step 4: Resolve `README.md`
- Keep our detailed Architecture/API/Builder sections
- Add Docker quickstart at top (from PR)

### Step 5: Clean up `backend/backend/config.yaml`
- Remove empty file (not used)

### Step 6: Test
```bash
# Dev profile
docker compose --profile dev up --build -d
# → http://localhost:5173 (nginx → frontend-dev:5173 + backend-dev:8080)

# Prod profile
docker compose --profile prod up --build -d
# → http://localhost:8080 (single container: API + SPA)
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Vite 8 + plugin-react 5 breaking changes | Medium | Dev server fails | Test `npm run dev` after upgrade |
| Air hot reload not detecting changes | Low | Dev loop broken | `.air.toml` excludes correct dirs |
| Nginx DNS resolution fails in Docker | Low | Dev proxy broken | `resolver 127.0.0.11` + variables — standard pattern |
| Prod build fails (missing config.yaml) | Medium | Prod image broken | Verify `COPY --from=backend-builder /app/backend/config.yaml` exists |
| SQLite DB locked in container | Low | Data corruption | WAL mode + single writer (already set) |

---

## Files to Add to `.gitignore` (from PR's `.dockerignore`)
- `server` (binary) — already ignored?
- `spells`, `tui-player` — already in `.gitignore`?
- `graphify-out/` — **add** (generated analysis artifacts)

---

## Post-Merge Verification Checklist

- [ ] `docker compose --profile dev up --build` starts without errors
- [ ] Frontend accessible at `http://localhost:5173`
- [ ] API accessible at `http://localhost:5173/api/health` (via nginx)
- [ ] Hot reload works: edit `frontend/src/...` → browser updates
- [ ] Backend hot reload works: edit `cmd/server/main.go` → air restarts
- [ ] `docker compose --profile prod up --build` produces working image
- [ ] Prod container serves SPA at `/` and API at `/api/`
- [ ] Local `go run ./cmd/server/` still works
- [ ] Local `cd frontend && npm run dev` still works (proxy to :8080)

---

## Notes for Collaborator (Rafael)

1. **Config location**: Our server uses `config.Load()` which searches `./config.yaml`, `./var/config.yaml`, env `CONFIG_PATH`. The prod Dockerfile copies to `/app/backend/config.yaml` — set `CONFIG_PATH=/app/backend/config.yaml` (already in compose).

2. **Database**: SQLite at `./var/arcanum.db` — mounted as `./var:/app/var` in both profiles. WAL mode enabled in code.

3. **5etools import**: Expects `../5etools-src/data/` relative to server binary. In Docker: `/app/../5etools-src` won't exist. Import will skip with warning (already handled in code). Document this.

4. **Frontend build**: `npm run build` outputs to `frontend/dist/` — prod Dockerfile copies this correctly.

5. **CORS**: Backend allows `localhost:5173` in config. In Docker dev, nginx proxies from `:5173` so origin matches.

---

**Recommendation**: Merge with conflict resolution as described. The setup is solid and follows Docker best practices (multi-stage prod, hot-reload dev, single-port nginx proxy).