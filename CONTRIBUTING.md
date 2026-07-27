# Contributing to ARCANUM

Thank you for considering contributing to ARCANUM. This document outlines the process and standards for contributions.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Follow the project's licensing terms (AGPL-3.0)

## Development Setup

### Prerequisites

- Go 1.26+
- Node 22+
- Docker (optional, for containerized dev/prod)
- SQLite3 (for database inspection)

### Local Development

```bash
# Backend
go run ./cmd/server/

# Frontend (separate terminal)
cd frontend && npm run dev

# TUI Player
go run ./cmd/tui-player/

# Run tests
make test

# Lint
make lint
```

### Docker Development

```bash
# Dev profile (hot reload)
docker compose --profile dev up --build -d

# Prod profile (single container)
docker compose --profile prod up --build -d
```

## Branch Strategy

- `main` — stable, deployable
- Feature branches: `feat/<short-description>`
- Fix branches: `fix/<short-description>`
- Docs branches: `docs/<short-description>`

## Commit Messages

Follow conventional commits:

```
feat: add metamagic options endpoint
fix: resolve Go VCS stamping in Docker
docs: update README with Docker quickstart
refactor: restructure builder layout
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`

## Pull Request Process

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Run tests and lint: `make test && make lint`
5. Ensure frontend builds: `cd frontend && npm run build`
6. Submit PR with clear description

### PR Requirements

- Clear title and description
- Reference related issues
- No version downgrades without discussion
- Local dev workflow must remain functional
- Docker as optional, not required

## Code Standards

### Go

- Follow standard Go formatting (`gofmt`)
- Run `golangci-lint` before committing
- Use branded types from `internal/types/`
- Follow event-sourcing patterns (Plan/Commit/Apply/Replay)

### TypeScript/React

- Use TypeScript strictly (no `any` without justification)
- Follow existing component patterns in `frontend/src/shared/ui/`
- Use Zustand stores for state management
- Run `npm run typecheck` before committing
- Keep components under ~200 lines

### Database

- Migrations in `internal/database/db.go`
- Never delete data unless explicitly requested
- Seed via YAML content packs in `data/`

## Adding Content

### New Classes/Subclasses

1. Add YAML to `data/classes.yaml`
2. Run server to seed database
3. Import 5etools descriptions if available

### New Features/Feats/Spells

1. Add to appropriate YAML in `data/`
2. Or ensure 5etools-src has the data for import

## Testing

```bash
# Backend tests
go test ./...

# Frontend tests
cd frontend && npm test

# Full test suite
make test
```

## Documentation

- Update README.md for user-facing changes
- Update BLUEPRINT.md for architecture changes
- Update MERGE_NOTES.md for merge integrations
- Add comments for complex logic

## Licensing

All contributions must be compatible with AGPL-3.0. By contributing, you agree to license your contributions under AGPL-3.0.

## Questions

Open an issue for:
- Bug reports
- Feature requests
- Architecture discussions
- License questions

## Attribution

- D&D 5e content: Wizards of the Coast (SRD 5.1 CC BY 4.0, other content via 5e.tools MIT)
- 5e.tools data: MIT licensed (5etools-mirror-3/5etools-src)
- Engine patterns: greghcarr/dnd-srd-engine