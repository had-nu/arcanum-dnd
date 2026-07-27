# ARCANUM

D&D 5.5 Edition Manager — TUI-first, Event-Sourced, Living World Engine

## Status

**v0.2.0 — Alpha estrutural.** Engine core compilando com Plan/Commit/Apply/Replay.
Frontend React SPA servido pelo backend Go. Character builder funcional com classes, subclasses, spells, feats, metamagia.

## Quick Start

### Docker (Optional)

```sh
# Development with hot reload
docker compose --profile dev up -d
# Access at http://localhost:5173

# Production (single container)
docker compose --profile prod up -d
# Access at http://localhost:8080
```

### Local Development (Primary)

```sh
# Backend (serve API + frontend SPA)
go run ./cmd/server/

# Frontend (separate terminal)
cd frontend && npm run dev
```

Frontend available at `http://localhost:5173` (proxies API to backend `:8080`).

### TUI Commands

```sh
go run ./cmd/tui-player/
```

Or build + run:

```sh
make build
./server
make run-player
make run-master
```

## Commands

```sh
make build      # compila tudo (backend + frontend)
make test       # roda testes
make lint       # golangci-lint + gosec
make run-player # go run ./cmd/tui-player/
make run-master # go run ./cmd/tui-master/
make frontend   # build apenas frontend (Vite)
make dev        # backend + frontend em modo dev (concurrently)
```

## Architecture

```
cmd/
  server/       # HTTP API + React SPA serving (Go + chi)
  tui-player/   # TUI character player (Bubble Tea)
  tui-master/   # TUI DM tools (WIP)

internal/
  engine/       # Plan/Commit/Apply/Replay + Derive
  schemas/      # Event types, Effect primitives, Content pack schemas
  types/        # Branded ULIDs, enums (Ability, Skill, DamageType)
  content/      # YAML → ResolvedContent loader
  rng/          # RNG interface (default + seeded)
  database/     # SQLite schema, migrations, 5etools import, inbox processing

frontend/       # React + TypeScript + Vite + Zustand
  src/
    api/        # Generated types + endpoints
    stores/     # Zustand stores (content, builder, wizardUI)
    features/   # Feature modules (vault, builder steps)
    shared/     # UI atoms, theme (wine/gold/parchment)
```

Patterns ported from [greghcarr/dnd-srd-engine](https://github.com/greghcarr/dnd-srd-engine):
Event Sourcing, Plan/Commit split, Effect Primitives, Branded IDs, Derive layer.

## API Endpoints

```
GET    /api/health              → Health check
GET    /api/content             → Bulk content (classes, species, backgrounds, feats, skills, abilities)
GET    /api/spells?class=&level= → Spells (cantrips + leveled by spell level)
GET    /api/features/{classId}?subclassId= → Class + subclass features (with 5etools entries)
GET    /api/metamagic-options   → Metamagic options (from 5etools optionalfeatures.json)
GET    /api/feats               → All feats (from database)
POST   /api/build               → Build character sheet from BuildRequest (stateless)
GET    /api/characters          → List saved characters
POST   /api/characters          → Save character
GET    /api/characters/{name}   → Load character
PUT    /api/characters/{name}   → Update character
DELETE /api/characters/{name}   → Delete character
```

## Character Builder (Frontend)

Wizard multi-step em `/builder/new` ou `/builder/:name`:

1. **Class** — Adicionar classes, níveis, subclass (level 3+), spells, metamagia (Sorcerer)
2. **Background** — Background + skill/feat grants
3. **Species** — Species + variant
4. **Abilities** — Point buy / standard array / manual
5. **Equipment** — Starting equipment por classe/background
6. **What's Next** — Resumo + pending choices badges

Estado: `builderStore` (Zustand) mantém `draft` (BuildRequest) + `preview` (CharacterSheet from `/build`).
Debounced POST `/build` a cada mudança relevante → painel live de HP/AC/Spell Slots.

## Data Sources

- **YAML content packs** em `data/` (classes, species, backgrounds, feats, spells, items)
- **5etools-src** (opcional) em `../5etools-src/data/` — feature descriptions, optional features (metamagic), spell lists
  - Import automático no startup se diretório existir
  - Não redistribui arquivos originais; usa localmente apenas

## License

**GNU AGPL v3.0** — veja [LICENSE](LICENSE).

### Third-Party Attributions

- **5e.tools / 5etools-mirror-3** — Data for class features, subclass features, metamagic, spells, feats, items. MIT licensed (https://github.com/5etools-mirror-3/5etools-src).
- **D&D 5e SRD 5.1** — Wizards of the Coast, CC BY 4.0
- **greghcarr/dnd-srd-engine** — Architectural patterns (Event Sourcing, Plan/Commit, Effect Primitives, Branded IDs)
- Go/React ecosystem dependencies — respective MIT/BSD/Apache-2.0 licenses

Full attribution details in [LICENSE](LICENSE).

## Development

```sh
# Frontend dev server (proxy to backend :8080)
cd frontend && npm run dev

# Backend com hot reload (air)
air -c .air.toml

# Database
sqlite3 var/arcanum.db ".schema"
sqlite3 var/arcanum.db "SELECT * FROM metamagic_options;"
```

## Estrutura de Dados (Personagem salvo)

Arquivos YAML em `data/characters/{name}.yaml`:

```yaml
name: "Aberon"
classes:
  - id: "sorcerer"
    name: "Sorcerer"
    level: 5
    subclassId: "draconic-bloodline"
backgroundId: "sage"
backgroundName: "Sage"
speciesId: "human"
level: 5
abilityMethod: "point-buy"
abilities:
  STR: 8
  DEX: 14
  CON: 14
  INT: 12
  WIS: 10
  CHA: 17
skills: ["arcana", "insight", "persuasion", "perception"]
spells: ["fire-bolt", "shield", "magic-missile", "misty-step", "fireball"]
feats: ["elemental-adept-fire"]
equipment: []
createdAt: "2025-07-27T12:00:00Z"
updatedAt: "2025-07-27T12:00:00Z"
```

## Próximos Passos (Roadmap)

- [ ] Feat selection UI no builder (ASI levels)
- [ ] Skill proficiency dropdowns por classe
- [ ] Equipment step (starting gear por classe/background)
- [ ] TUI Player: character sheet rendering, combat tracker
- [ ] TUI Master: encounter builder, initiative tracker
- [ ] Campaign persistence (event store)
- [ ] Multiplayer sync (WebRTC/WebSocket)