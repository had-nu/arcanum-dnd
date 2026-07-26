# ARCANUM

D&D 5.5 Edition Manager — TUI-first, Event-Sourced, Living World Engine

## Status

**v0.2.0 — Alpha estrutural.** Engine core compilando com Plan/Commit/Apply/Replay.

## Quick Start

### Docker (Recommended)

```sh
# Development with hot reload
docker compose --profile dev up -d
# Access at http://localhost:5173

# Production (single container)
docker compose --profile prod up -d
# Access at http://localhost:8080
```

### Local Development

```sh
# Backend
go run ./cmd/server/

# Frontend (separate terminal)
cd frontend && npm run dev
```

### TUI Commands

```sh
go run ./cmd/tui-player/
```

## Commands

```sh
make build      # compila tudo
make test       # roda testes
make lint       # golangci-lint + gosec
make run-player # go run ./cmd/tui-player/
make run-master # go run ./cmd/tui-master/
```

## Architecture

```
internal/
  engine/       Plan/Commit/Apply/Replay + Derive
  schemas/      Event types, Effect primitives, Content pack schemas
  types/        Branded ULIDs, enums (Ability, Skill, DamageType)
  content/      YAML → ResolvedContent loader
  rng/          RNG interface (default + seeded)
```

Patterns ported from [greghcarr/dnd-srd-engine](https://github.com/greghcarr/dnd-srd-engine):
Event Sourcing, Plan/Commit split, Effect Primitives, Branded IDs, Derive layer.

## Spec

[SPEC.md](SPEC.md)
