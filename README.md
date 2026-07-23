# ARCANUM

D&D 5.5 Edition Manager — TUI-first, Event-Sourced, Living World Engine

## Status

**v0.2.0 — Alpha estrutural.** Engine core compilando com Plan/Commit/Apply/Replay.

## Quick Start

```sh
go run ./cmd/tui-player/
```

## Comandos

```sh
make build      # compila tudo
make test       # roda testes
make lint       # golangci-lint + gosec
make run-player # go run ./cmd/tui-player/
make run-master # go run ./cmd/tui-master/
```

## Arquitetura

```
internal/
  engine/       Plan/Commit/Apply/Replay + Derive
  schemas/      Event types, Effect primitives, Content pack schemas
  types/        Branded ULIDs, enums (Ability, Skill, DamageType)
  content/      YAML → ResolvedContent loader
  rng/          RNG interface (default + seeded)
```

Padrões portados de [greghcarr/dnd-srd-engine](https://github.com/greghcarr/dnd-srd-engine):
Event Sourcing, Plan/Commit split, Effect Primitives, Branded IDs, Derive layer.

## Spec

[SPEC.md](SPEC.md)
