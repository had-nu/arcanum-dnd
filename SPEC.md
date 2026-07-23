# ARCANUM — D&D 5.5 Edition Manager

**Project Specification · v0.2.0 · 2026-07-22**

Go · Bubbletea · Ollama · SQLite · chromem-go
TUI-first · RAG-grounded · Living World Engine

---

## 0. Changelog

| Version | Date | Changes |
|---------|------|---------|
| v0.1.0 | 2026-03-03 | Initial spec |
| v0.2.0 | 2026-07-22 | Ported patterns from greghcarr/dnd-srd-engine: Plan/Commit split, Effect Primitives, Branded IDs, Derive layer, Event Sourcing, Content Packs |

---

## 1. Visão Geral do Projeto

### 1.1 Propósito

Arcanum é um sistema de gestão de campanhas de D&D 5.5e focado em duas premissas fundamentais:
1. toda lógica mecânica é resolvida de forma determinística pelo código Go, sem delegação ao LLM
2. o mundo da campanha corre no próprio tempo, com NPCs perseguindo objetivos independentemente das ações dos jogadores

O LLM (Ollama) tem escopo estritamente narrativo — recebe resultados mecânicos já calculados e produz a descrição de como esses eventos acontecem.

### 1.2 Princípios de Design

- **Regras como código**: o YAML é a fonte de verdade mecânica. O LLM nunca decide quanto de dano um feitiço faz.
- **Event Sourcing**: toda mudança de estado é um evento imutável. Replay, undo, auditoria são gratuitos.
- **Plan/Commit split**: RNG é consumido apenas no Plan. Apply() é puro e replay nunca re-rola dados.
- **Effect Primitives**: vocabulário declarativo de efeitos (AddDamage, SetBaseAC, Resistance, etc.) em vez de if/else chains.
- **Branded IDs**: ULIDs type-safe para cada entidade (CharacterID, SpellID, EventID, etc.).
- **Mundo vivo**: o tempo corre independente dos jogadores. NPCs têm motivações, objetivos e deadlines.
- **RAG fechado**: o Ollama só sabe o que o pipeline de ingestão extraiu dos livros.
- **Duas instâncias TUI**: painel do jogador (ficha + rolagem) e Master Shield (visão total + narrador + mapa).
- **Portabilidade**: arquitetura em camadas permite migração TUI → Web sem rewrite do engine.

### 1.3 Stack Tecnológica

| Componente | Tecnologia |
|---|---|
| Linguagem | Go 1.22+ |
| TUI | Bubbletea + Lipgloss |
| Persistência | SQLite via modernc.org/sqlite |
| Vector store | chromem-go |
| LLM runtime | Ollama local (llama3.1:8b) |
| PDF parsing | pdfcpu |
| Schema validation | go-playground/validator |
| Scaffolding | lazy.go (had-nu/lazy.go) |
| Linting / SAST | golangci-lint + gosec |
| CI/CD | GitHub Actions |
| IDs | ULID (oklog/ulid/v2) |
| Content format | YAML (gopkg.in/yaml.v3) |

---

## 2. Arquitetura do Sistema

### 2.1 Separação de Responsabilidades

```
                    ┌──────────────┐
                    │   Ollama     │
                    │  (narrator)  │
                    └──────┬───────┘
                           │ resultado mecânico pronto
                           ▼
┌─────────┐     ┌──────────────────┐     ┌──────────┐
│ TUI     │◄───►│   Game Engine    │◄───►│ SQLite   │
│ Player  │     │  (Go puro)       │     │ (event   │
│ Master  │     │                  │     │  log)    │
└─────────┘     │ Plan → Events    │     └──────────┘
                │ Apply → State    │
                │ Derive → Sheet   │
                │ Content → YAML   │
                └──────────────────┘
```

### 2.2 Plan/Commit Split

Inspirado pelo dnd-srd-engine. O fluxo crítico:

```
engine.PlanAttack(state, intent)       → []Event  // RNG consumido AQUI
engine.Apply(state, event)             → State    // função pura
engine.Commit(campaign, []Event)       → Campaign // append ao event log
engine.Replay([]Event)                 → State    // byte-idêntico ao original
```

- `Plan*()`: consome RNG, produz eventos com valores já rolados
- `Apply()`: função pura, sem efeitos colaterais, sem RNG
- `Commit()`: aplica eventos e append ao log
- `Replay()`: reconstroi estado a partir do log — determinístico

### 2.3 Engine Structure (portada do dnd-srd-engine)

```
Engine {
    content: ResolvedContent  // packs carregados
    rng:     RNG              // seeded or default
    Plan:    *Planner         // engine.Plan.*
    Derive:  *Deriver         // engine.Derive.*
    Apply:   *Applier         // engine.Apply.*
}
```

### 2.4 Estrutura de Diretórios (v0.2.0)

```
arcanum/
├── cmd/
│   ├── tui-player/main.go
│   ├── tui-master/main.go
│   └── server/main.go
├── internal/
│   ├── engine/
│   │   ├── engine.go          # Engine struct + NewEngine + Commit + Replay
│   │   ├── apply.go           # Reducers: apply[EventType](state, event) state
│   │   ├── plan/              # Planners: PlanAttack, PlanSave, PlanRest...
│   │   │   └── combat.go
│   │   ├── reducers/          # Pure reducers por domínio
│   │   ├── derive/            # Pure computed views: BuildCharacterSheet, computeAC...
│   │   │   └── character.go
│   │   └── effects/           # Effect evaluator, formula engine, predicate engine
│   ├── schemas/
│   │   ├── events/            # Event types + envelope
│   │   │   ├── envelope.go
│   │   │   └── types.go
│   │   ├── runtime/           # Runtime state: Character, Campaign, Encounter
│   │   ├── content/           # Content pack schemas: Spell, Class, Item...
│   │   ├── effects.go         # Effect primitives vocabulary
│   │   ├── formula.go         # Formula DSL (for dynamic values)
│   │   └── predicate.go       # Predicate DSL (for conditional effects)
│   ├── types/
│   │   ├── id.go              # Branded ULID IDs
│   │   └── primitives.go      # Enums: Ability, Skill, DamageType, Size...
│   ├── content/
│   │   └── loader.go          # YAML → ResolvedContent
│   ├── rng/
│   │   └── rng.go             # RNG interface + Default + Seeded
│   ├── query/                 # Affordance queries (legal actions, targets...)
│   ├── handlers/              # CustomEffect code handler registry
│   ├── ai/                    # Tactical AI for NPCs
│   ├── migrations/            # Event log migration
│   └── ingestion/             # PDF → structured data pipeline
├── data/                      # Content packs (YAML)
│   ├── spells/, classes/, species/, conditions/, items/, backgrounds/, feats/
├── docs/
│   ├── adr/, wiki/
├── SPEC.md
├── Makefile, Dockerfile
└── .github/workflows/
```

### 2.5 Camadas

| Camada | Responsável | Restrição |
|---|---|---|
| Regras mecânicas | Go + YAML | Nunca chama Ollama |
| Estado do jogo | Go + SQLite | Nunca chama Ollama |
| Rolagem de dados | Go (rng) | Zero aleatoriedade externa |
| Simulação temporal | Go (worldclock) | Determinístico, auditável |
| Intenções de NPC | Go (intent graph) | Grafo puro, sem LLM |
| Consequências | Go resolve + Ollama narra | Go decide O QUÊ, Ollama descreve O COMO |
| Narrativa | Ollama via RAG | Recebe resultado pronto, nunca decide mecânica |
| Apresentação | Bubbletea TUI | Só renderiza, nunca calcula |

---

## 3. Effect Primitives (vocabulário declarativo)

Portado do dnd-srd-engine. Em vez de if/else chains, usamos um vocabulário fixo de efeitos.

### 3.1 Core Effect Kinds (v0.2.0 — ~25 primitives)

```go
const (
    EffectSetBaseAC         EffectKind = "SetBaseAC"       // Define AC base (ex: Unarmored Defense)
    EffectAddAC             EffectKind = "AddAC"            // Bônus de AC (ex: Shield of Faith)
    EffectAddAttack         EffectKind = "AddAttack"        // Bônus em jogadas de ataque
    EffectAddDamage         EffectKind = "AddDamage"        // Bônus em dano
    EffectAddSpellAttack    EffectKind = "AddSpellAttack"   // Bônus em ataque mágico
    EffectAddSpellSaveDC    EffectKind = "AddSpellSaveDC"   // Bônus em CD de magia
    EffectResistance        EffectKind = "Resistance"       // Resistência a dano
    EffectImmunity          EffectKind = "Immunity"         // Imunidade a dano
    EffectVulnerability     EffectKind = "Vulnerability"    // Vulnerabilidade a dano
    EffectConditionImmunity EffectKind = "ConditionImmunity" // Imunidade a condição
    EffectRollAdvantage     EffectKind = "RollAdvantage"    // Vantagem em rolagem
    EffectRollDisadvantage  EffectKind = "RollDisadvantage" // Desvantagem em rolagem
    EffectAddDamageDice     EffectKind = "AddDamageDice"    // Dados extras de dano (ex: Sneak Attack)
    EffectCustom            EffectKind = "Custom"           // Escape hatch para código handler
)
```

### 3.2 ModifierTarget / RollTarget

Efeitos são direcionados por `ModifierTarget`:
- `AC`, `Attack`, `Damage`
- `Save{Ability?}` — wildcard: `Save{STR}` ou `Save{}` (qualquer)
- `Check{Ability?}` — wildcard análogo
- `Skill{Skill}` — específico por perícia

### 3.3 Exemplo: YAML de um Feat

```yaml
id: "alert"
name: "Alert"
effects:
  - kind: "RollAdvantage"
    targetInitiative: true
  - kind: "AddAC"
    value: 5
    duration: "1 round"
    trigger: "surprised"
```

---

## 4. Event Sourcing

### 4.1 Event Envelope

```go
type EventEnvelope struct {
    ID      EventID   `json:"id"`
    At      string    `json:"at"`       // ISO 8601
    SessionID *EventID `json:"sessionId,omitempty"`
    CausedByEventID *EventID `json:"causedByEventId,omitempty"`
}
```

### 4.2 Core Event Types

| Event | Purpose |
|---|---|
| CharacterCreated | Criação de personagem |
| DamageApplied | Dano aplicado (pós-mitigação) |
| Healed | Cura recebida |
| TempHPGranted | PV temporários |
| ConditionApplied / Removed | Condições |
| AttackRolled | Rolagem de ataque (com resultado baked-in) |
| DamageRolled | Rolagem de dano |
| SaveRolled | Rolagem de salvaguarda |
| ShortRestStarted / Ended | Descanso curto |
| LongRestStarted / Ended | Descanso longo |
| LevelUpResolved | Evolução |
| ItemAcquired / Equipped / Unequipped | Inventário |
| ResourceSpent / Restored | Recursos (rage, spell slots, etc.) |
| EncounterCreated / Started / Ended | Encontros |
| InitiativeRolled | Iniciativa |
| TurnStarted / Ended | Turnos |
| WorldClockAdvanced | Avanço do tempo do mundo |
| NPCActionResolved | Ação de NPC resolvida |
| ChoiceRequired / Resolved | Escolhas pendentes (ASI, Fighting Style...) |

### 4.3 Campaign (state + events)

```go
type Campaign struct {
    ID      CampaignID
    Name    string
    State   CampaignState
    Events  []Event       // event log imutável
    Cursor  int           // suporta undo/redo
}
```

---

## 5. Branded IDs (type-safe ULIDs)

```go
type CharacterID struct{ ulid.ULID }
type CreatureID struct{ ulid.ULID }
type EventID struct{ ulid.ULID }
type CampaignID struct{ ulid.ULID }
type EncounterID struct{ ulid.ULID }
type ItemInstanceID struct{ ulid.ULID }
type SpellID string          // IDs de conteúdo são strings (ex: "fireball")
type ClassID string
type SpeciesID string
```

Cada ID type-safe previne passar CharacterID onde se espera SpellID.

---

## 6. Derive Layer (pure computed views)

```go
func BuildCharacterSheet(char Character) CharacterSheet
// Retorna: AC, Saving Throws, Skills, Attacks, Spell Slots, etc.
```

A derive layer são funções **puras** que transformam estado runtime em views computadas. Usado pela TUI para renderizar a ficha.

---

## 7. Content Packs (schema-only engine)

O engine não shipa conteúdo — você carrega seus próprios packs YAML:

```go
type ContentPack struct {
    ID      ContentPackID
    Name    string
    Version string
    Species    []Species
    Backgrounds []Background
    Classes    []Class
    Feats      []Feat
    Spells     []Spell
    Items      []ItemDef
    Monsters   []Monster
    Conditions []Condition
}
```

`ResolveContent(packs)` faz merge e validação de cross-reference.

---

## 8. World Simulation Engine

### 8.1 Conceito: Tempo Paralelo

O mundo corre em dois fluxos de tempo paralelos que se intersectam pelas ações dos jogadores.

### 8.2 As Três Engines de Simulação

- **Engine 1 — World Clock (Go puro)**: Avança o tempo in-game de forma determinística. Dispara eventos agendados.
- **Engine 2 — NPC Intent Graph (Go puro)**: Cada NPC tem um grafo de objetivos com prioridade, pré-requisitos e condições.
- **Engine 3 — Consequence Resolver (Go + Ollama)**: Go calcula O QUÊ mudou. Ollama recebe o diff e narra O COMO.

---

## 9. Fases do Projeto

### Fase 0 — Esqueleto & Infraestrutura (COMPLETO)

- [x] Scaffold via lazy.go / manual
- [x] `go.mod` com dependências
- [x] Estrutura de diretórios completa
- [x] `internal/types/` — branded IDs, primitives
- [x] `internal/schemas/events/` — event types + envelope
- [x] `internal/schemas/effects.go` — effect primitives
- [x] `internal/engine/` — Plan/Commit/Apply/Replay
- [x] `internal/engine/derive/` — character sheet derivation
- [x] `internal/content/` — content pack loader
- [x] `Makefile` com targets: build, test, lint
- [ ] ADR-001 documentado
- [ ] CI/CD (GitHub Actions)

### Fase 1 — Ingestion Pipeline

- Extração de Texto (pdfcpu) → Classificação (Ollama) → Extração Estruturada + Embedding (chromem-go)

### Fase 2 — Criação de Personagem & Ficha

- Wizard de 5 passos no TUI
- Geração automática de valores derivados (CA, CD, bônus de ataque, PV)
- Classes MVP: Mago, Guerreiro, Ladino, Clérigo

### Fase 3 — Master Shield

- Painel separado do jogador (dois processos, mesma campanha via SQLite WAL)
- Overview do grupo, tracker de iniciativa, World Clock, Intent Graph

### Fase 4 — Map Generation

- Gerador de mapa por grafo usando lore extraído

### Fase 5 — Ollama RAG — Narrador Completo

- RAG completo com contexto do lore store + histórico de campanha

---

## 10. Schemas de Dados

### Character (runtime)

```yaml
id: <CharacterID>
name: "Alyx"
species: "human"
background: "soldier"
classes:
  - classId: "fighter"
    level: 3
abilityScores: { STR: 16, DEX: 14, CON: 14, INT: 10, WIS: 12, CHA: 8 }
hp: { current: 28, max: 28 }
tempHP: 0
conditions: []
resources: []  # rage uses, spell slots, etc.
items: []
feats: []
```

### Spell (content pack)

```yaml
id: "fireball"
name: "Fireball"
level: 3
school: "Evocation"
damage:
  type: "fire"
  dice: "8d6"
  perSlot: "1d6"
save: "DEX"
```

---

## 11. Caminho para Web (Pós-MVP)

- O que não muda: todo `internal/`, schemas, SQLite, pipeline de ingestão
- O que é adicionado: `cmd/server/main.go` (Gin/Echo), WebSocket, frontend estático

---

## 12. Critérios Gerais de Qualidade

- **Cobertura**: engine ≥80%, schemas 100% loaders, TUI smoke tests
- **Performance**: Rolagem < 1ms, ataque < 10ms, World Clock 100 eventos < 50ms, narrativa < 8s
- **Segurança**: gosec no CI, paths sanitizados, inputs validados, SQLite WAL mode
- **Regra de Ouro**: O engine nunca consulta o LLM para decisões mecânicas

---

## 13. Licença e Atribuição

- Engine code: MIT
- Starter content packs: CC BY 4.0 (derivado do SRD 5.2)
- "Dungeons & Dragons" é marca registrada da Wizards of the Coast

---

*"The structure is the message." — lazy.go / dnd-srd-engine*
