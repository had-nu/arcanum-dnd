# ARCANUM — D&D 5.5e Character & Campaign Manager

**v0.2.0 · 2026-07-24 · Go + TypeScript**

---

## Visão Geral

Arcanum é um gerenciador de campanhas D&D 5.5e (2024) com duas frentes:
- **Backend (Go)**: Engine de regras determinístico, event sourcing, persistence SQLite
- **Frontend (TypeScript + Vite + Preact)**: Character builder wizard, character vault, sheet viewer

**Princípios:**
- Regras como código (Go + YAML) — zero ambiguidade
- Event Sourcing — audit trail completo, replay, undo/redo
- Plan/Commit split — RNG só no Plan, Apply é puro
- Effect Primitives — vocabulário declarativo (SetBaseAC, AddDamage, Resistance...)
- Branded IDs — type-safe ULIDs para todas entidades
- Separação total front/back — API contract via OpenAPI 3.1

---

## Stack

| Camada | Tech |
|--------|------|
| Backend | Go 1.22+, stdlib `net/http`, SQLite (modernc.org/sqlite) |
| Frontend | TypeScript, Vite, Preact, Tailwind CSS |
| API Contract | OpenAPI 3.1 → codegen (oapi-codegen + orval) |
| IDs | ULID (oklog/ulid/v2) |
| Config | YAML + env vars |
| Dev | `air` (Go hot reload), `vite` (HMR) |
| Build | `go build` + `npm run build` |
| Test | `go test ./...`, `vitest` |

---

## Arquitetura

```
arcanum/
├── backend/                    # Go module
│   ├── cmd/server/main.go
│   ├── internal/
│   │   ├── api/               # Handlers, middleware, OpenAPI server stubs
│   │   ├── config/            # Config loading (YAML + env)
│   │   ├── content/           # YAML loaders → ResolvedContent
│   │   ├── engine/            # Plan, Apply, Derive, Effects
│   │   │   ├── plan/
│   │   │   ├── apply/
│   │   │   ├── derive/
│   │   │   └── effects/
│   │   ├── schemas/
│   │   │   ├── events/        # Event envelope + types
│   │   │   ├── content/       # Spell, Class, Species, Feat, Item...
│   │   │   ├── runtime/       # Character, Campaign, Encounter
│   │   │   ├── effects.go     # Effect primitives
│   │   │   ├── formula.go     # Formula DSL
│   │   │   └── predicate.go   # Predicate DSL
│   │   ├── store/             # SQLite persistence (event log + snapshots)
│   │   └── types/             # Branded IDs, primitives (Ability, Skill...)
│   ├── data/                  # Content packs (YAML, read-only)
│   │   ├── classes/, spells/, species/, backgrounds/, feats/, items/, conditions/
│   └── var/                   # Runtime writable (gitignored)
│       ├── characters/        # Saved character YAMLs
│       └── arcanum.db         # SQLite event log
│
├── frontend/                   # Node module
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── index.html
│   ├── public/                # Static assets (copied as-is)
│   │   ├── fonts/
│   │   └── img/
│   └── src/
│       ├── main.tsx
│       ├── app.tsx            # Router (wouter) + providers
│       ├── api/               # Generated client + typed modules
│       ├── components/
│       │   ├── ui/            # Button, Input, Select, Modal, Sheet, Card, Tabs, Tooltip
│       │   ├── character/     # AbilityScores, ClassPicker, SpellSelector, CharacterSheet
│       │   └── layout/        # Header, StepsNav, Footer
│       ├── pages/
│       │   ├── BuilderPage.tsx      # 5-step wizard
│       │   ├── CharactersPage.tsx   # List + CRUD
│       │   └── CharacterView.tsx    # Read-only sheet
│       ├── stores/            # Signals (preact/signals)
│       ├── hooks/             # TanStack Query hooks
│       └── styles/
│           └── global.css
│
├── shared/
│   └── openapi.yaml           # Single source of truth
│
├── SPEC.md
└── README.md
```

---

## API Contract (OpenAPI 3.1)

```yaml
# shared/openapi.yaml - resumo
paths:
  /api/content:
    get: { operationId: getContent, responses: { '200': { $ref: '#/components/schemas/ContentResponse' } } }
  /api/spells:
    get: { operationId: getSpells, parameters: [{name: class, in: query}, {name: level, in: query}], responses: { '200': { $ref: '#/components/schemas/SpellsResponse' } } }
  /api/build:
    post: { operationId: buildCharacter, requestBody: { $ref: '#/components/requestBodies/BuildRequest' }, responses: { '200': { $ref: '#/components/schemas/BuildResponse' } } }
  /api/characters:
    get: { operationId: listCharacters, responses: { '200': { type: array, items: { $ref: '#/components/schemas/CharacterSummary' } } } }
    post: { operationId: saveCharacter, requestBody: { $ref: '#/components/requestBodies/SaveCharacter' }, responses: { '201': { $ref: '#/components/schemas/SavedCharacter' } } }
  /api/characters/{name}:
    get: { operationId: getCharacter, responses: { '200': { $ref: '#/components/schemas/SavedCharacter' } } }
    put: { operationId: updateCharacter, ... }
    delete: { operationId: deleteCharacter, responses: { '204': { description: Deleted } } }
  /health:
    get: { operationId: health, responses: { '200': { $ref: '#/components/schemas/Health' } } }
```

---

## Configuração (backend/config.yaml)

```yaml
server:
  addr: ":8080"
  read_timeout: 10s
  write_timeout: 30s
  shutdown_grace: 15s

cors:
  allowed_origins: ["http://localhost:5173"]
  allowed_methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  allowed_headers: ["Content-Type", "Authorization"]

data:
  content_dir: "./data"
  characters_dir: "./var/characters"
  sqlite_path: "./var/arcanum.db"

log:
  level: "info"
  format: "text"
```

---

## Effect Primitives (vocabulário declarativo)

```go
const (
    EffectSetBaseAC         EffectKind = "SetBaseAC"
    EffectAddAC             EffectKind = "AddAC"
    EffectAddAttack         EffectKind = "AddAttack"
    EffectAddDamage         EffectKind = "AddDamage"
    EffectAddSpellAttack    EffectKind = "AddSpellAttack"
    EffectAddSpellSaveDC    EffectKind = "AddSpellSaveDC"
    EffectResistance        EffectKind = "Resistance"
    EffectImmunity          EffectKind = "Immunity"
    EffectVulnerability     EffectKind = "Vulnerability"
    EffectConditionImmunity EffectKind = "ConditionImmunity"
    EffectRollAdvantage     EffectKind = "RollAdvantage"
    EffectRollDisadvantage  EffectKind = "RollDisadvantage"
    EffectAddDamageDice     EffectKind = "AddDamageDice"
    EffectCustom            EffectKind = "Custom"
)
```

Targets: `AC`, `Attack`, `Damage`, `Save{STR|DEX|...}`, `Check{...}`, `Skill{...}`, `Initiative`

---

## Event Sourcing

```go
type EventEnvelope struct {
    ID              EventID     `json:"id"`
    At              time.Time   `json:"at"`
    SessionID       *EventID    `json:"sessionId,omitempty"`
    CausedByEventID *EventID    `json:"causedByEventId,omitempty"`
    Payload         Event       `json:"payload"`
}

type Campaign struct {
    ID      CampaignID
    Name    string
    State   CampaignState
    Events  []EventEnvelope
    Cursor  int
}
```

Core events: `CharacterCreated`, `DamageApplied`, `Healed`, `ConditionApplied/Removed`, `AttackRolled`, `DamageRolled`, `SaveRolled`, `ShortRestStarted/Ended`, `LongRestStarted/Ended`, `LevelUpResolved`, `ItemAcquired/Equipped/Unequipped`, `ResourceSpent/Restored`, `EncounterCreated/Started/Ended`, `InitiativeRolled`, `TurnStarted/Ended`, `WorldClockAdvanced`, `NPCActionResolved`, `ChoiceRequired/Resolved`.

---

## Derive Layer (pure functions)

```go
func BuildCharacterSheet(char Character, content ResolvedContent) CharacterSheet
// Returns: AC, Saves, Skills, Attacks, SpellSlots, Features, Resources...
```

---

## Roadmap

| Fase | Entregável |
|------|------------|
| 0 | ✅ Estrutura, IDs, Eventos, Effects, Engine skeleton, Content loader |
| 1 | Character Builder API (`/api/build`, `/api/content`, `/api/spells`) |
| 2 | Character Vault (`/api/characters` CRUD, SQLite persistence) |
| 3 | Frontend: Builder Wizard (5 steps), Characters List, Sheet View |
| 4 | Master Shield: Party overview, Initiative tracker, Encounter builder |
| 5 | World Clock + NPC Intent Graph (Go puro) |
| 6 | Map generation (graph-based, lore-driven) |

---

## Qualidade

- **Cobertura**: engine ≥80%, schemas 100% load, API handlers smoke tests
- **Perf**: Roll <1ms, Attack <10ms, World Clock 100 eventos <50ms
- **Segurança**: gosec no CI, paths sanitizados, SQLite WAL, inputs validados
- **Regra de Ouro**: Engine **nunca** delega decisão mecânica a código externo