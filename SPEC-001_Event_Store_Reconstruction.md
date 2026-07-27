# SPEC-001: Reconstrução da Persistência — Event Store & Event Sourcing

**Projeto:** Arcanum D&D  
**Versão:** 1.0  
**Data:** 2026-07-27  
**Status:** Draft  
**Autor:** Kimi (arquiteto consultor)  

---

## 1. Visão Geral

### 1.1 Problema
O Arcanum declara arquitetura Event Sourced, mas:
- Não existe tabela de eventos no SQLite.
- O estado da campanha (`CampaignState`) vive apenas em memória; restart do servidor = perda total.
- Personagens são persistidos como YAML no filesystem (`data/characters/`), sem vínculo com eventos.
- O struct `Event` é um "god struct" com 25 ponteiros nil, sem versionamento de schema.
- O `runtime.Character` é uma projeção sem fonte de eventos reconstruível.

### 1.2 Objetivo
Implementar uma camada de persistência Event Sourced completa no SQLite, estabilizando o modelo de eventos como fonte da verdade primária e tornando o estado da campanha durável, auditável e replayável.

### 1.3 Princípios
1. **Events are the source of truth.** O banco de dados é um stream serializado.
2. **Immutability.** Eventos nunca são alterados ou deletados.
3. **Optimistic concurrency.** Cada aggregate tem versionamento sequencial.
4. **Projections are disposable.** O estado runtime é reconstruído a partir do event log.
5. **Schema evolution.** Eventos versionados permitem migração forward-only.

---

## 2. Terminologia

| Termo | Definição |
|-------|-----------|
| **Aggregate** | Raiz de consistência (ex: `Campaign`, `Character`). |
| **Event** | Fato imutável que representa uma mudança de estado. |
| **Event Store** | Tabela `events` no SQLite; append-only log. |
| **Snapshot** | Cópia serializada do estado de um aggregate em uma versão específica. |
| **Projection** | Modelo de leitura otimizado (ex: `character_sheets`), derivado do event log. |
| **Applier** | Função pura que recebe `State + Event → NewState`. |
| **Commit** | Transação atômica: validar, persistir eventos, aplicar ao estado. |

---

## 3. Fase 1: Estabilização do Event Model

### 3.1 Escopo
Refatorar `internal/schemas/events/` para suportar versionamento, serialização type-safe e envelope padronizado.

### 3.2 Novo Modelo de Evento

#### 3.2.1 EventEnvelope
```go
package events

import (
    "time"
    "github.com/hadnu/arcanum/internal/types"
)

// EventEnvelope é o envelope universal de todo evento no sistema.
type EventEnvelope struct {
    ID           types.EventID   `json:"id" validate:"required"`
    Type         EventType       `json:"type" validate:"required"`
    SchemaVersion int            `json:"schemaVersion" validate:"required"`
    AggregateID  string          `json:"aggregateId" validate:"required"`
    AggregateType AggregateType   `json:"aggregateType" validate:"required"`
    Version      int             `json:"version" validate:"required,min=1"`
    OccurredAt   time.Time       `json:"occurredAt" validate:"required"`

    // Causalidade
    SessionID        *types.EventID `json:"sessionId,omitempty"`
    CausedByEventID  *types.EventID `json:"causedByEventId,omitempty"`
    ActorID          *string        `json:"actorId,omitempty"`

    // Payload serializado
    Payload json.RawMessage `json:"payload" validate:"required"`
}

type AggregateType string

const (
    AggregateCampaign  AggregateType = "campaign"
    AggregateCharacter AggregateType = "character"
    AggregateEncounter AggregateType = "encounter"
)
```

#### 3.2.2 Interface Event
```go
// Event é a interface que todo payload de evento deve implementar.
type Event interface {
    EventType() EventType
    SchemaVersion() int
    // Validate retorna erro se o payload é inválido para o domínio.
    Validate() error
}

// EventType é um tipo enumerado para discriminação.
type EventType string

const (
    EventCharacterCreated   EventType = "CharacterCreated"
    EventCharacterLeveledUp EventType = "CharacterLeveledUp"
    EventDamageApplied      EventType = "DamageApplied"
    EventHealed             EventType = "Healed"
    EventConditionApplied   EventType = "ConditionApplied"
    EventConditionRemoved   EventType = "ConditionRemoved"
    EventResourceSpent      EventType = "ResourceSpent"
    EventResourceRestored   EventType = "ResourceRestored"
    EventItemEquipped       EventType = "ItemEquipped"
    EventItemUnequipped     EventType = "ItemUnequipped"
    EventSpellCast          EventType = "SpellCast"
    EventSpellSlotUsed      EventType = "SpellSlotUsed"
    EventShortRest          EventType = "ShortRest"
    EventLongRest           EventType = "LongRest"
    EventFeatTaken          EventType = "FeatTaken"
    EventSubclassChosen     EventType = "SubclassChosen"
)
```

#### 3.2.3 Payloads Versionados
Cada evento de domínio é um struct independente, versionado:

```go
// CharacterCreated V1 (schemaVersion = 1)
type CharacterCreatedEvent struct {
    CharacterID    types.CharacterID   `json:"characterId"`
    Name           string                `json:"name"`
    SpeciesID      types.SpeciesID       `json:"speciesId"`
    SpeciesVariant string                `json:"speciesVariant,omitempty"`
    BackgroundID   types.BackgroundID    `json:"backgroundId"`
    Level          int                   `json:"level"`
    AbilityScores  types.AbilityScores   `json:"abilityScores"`
    AbilityMethod  string                `json:"abilityMethod,omitempty"`
    Classes        []ClassEntry          `json:"classes"`
    Skills         []SkillChoice         `json:"skills"`
    Spells         []types.SpellID       `json:"spells,omitempty"`
    Feats          []types.FeatID        `json:"feats,omitempty"`
    MaxHP          int                   `json:"maxHp"`
}

func (e CharacterCreatedEvent) EventType() EventType     { return EventCharacterCreated }
func (e CharacterCreatedEvent) SchemaVersion() int       { return 1 }
func (e CharacterCreatedEvent) Validate() error {
    if e.Name == "" { return errors.New("name is required") }
    if e.Level < 1 || e.Level > 20 { return errors.New("level must be 1-20") }
    if len(e.Classes) == 0 { return errors.New("at least one class required") }
    return nil
}

type ClassEntry struct {
    ClassID   types.ClassID  `json:"classId"`
    Level     int            `json:"level"`
    SubclassID *types.SubclassID `json:"subclassId,omitempty"`
}

type SkillChoice struct {
    Skill types.Skill             `json:"skill"`
    Source string                 `json:"source"` // "background", "class", "feat"
}
```

**Nota:** O `MaxHP` no `CharacterCreatedEvent` é o HP máximo calculado no momento da criação. HP atual é derivado posteriormente via `DamageApplied` / `Healed`.

#### 3.2.4 Event Registry & Serialization
```go
package events

// registry mapeia EventType + SchemaVersion → constructor
var registry = map[EventType]map[int]func() Event{
    EventCharacterCreated: {
        1: func() Event { return &CharacterCreatedEvent{} },
    },
    // ... outros eventos
}

// MarshalEvent serializa um Event para EventEnvelope.
func MarshalEvent(evt Event, envelope EventEnvelope) (EventEnvelope, error) {
    payload, err := json.Marshal(evt)
    if err != nil { return EventEnvelope{}, err }
    envelope.Type = evt.EventType()
    envelope.SchemaVersion = evt.SchemaVersion()
    envelope.Payload = payload
    return envelope, nil
}

// UnmarshalPayload desserializa Payload para o tipo correto.
func UnmarshalPayload(env EventEnvelope) (Event, error) {
    versions, ok := registry[env.Type]
    if !ok { return nil, fmt.Errorf("unknown event type: %s", env.Type) }
    constructor, ok := versions[env.SchemaVersion]
    if !ok { return nil, fmt.Errorf("unknown schema version %d for %s", env.SchemaVersion, env.Type) }
    evt := constructor()
    if err := json.Unmarshal(env.Payload, evt); err != nil {
        return nil, fmt.Errorf("unmarshal payload: %w", err)
    }
    return evt, nil
}
```

### 3.3 Critérios de Aceitação
- [ ] `EventEnvelope` contém `AggregateID`, `AggregateType`, `Version`, `SchemaVersion`, `Payload`.
- [ ] Não há "god struct" com ponteiros nil. Cada evento é um struct independente.
- [ ] `registry` permite desserialização type-safe de qualquer evento persistido.
- [ ] `Validate()` é chamado antes de persistir.
- [ ] Testes unitários cobrem marshal/unmarshal de todos os event types.

### 3.4 Arquivos Alterados
- `internal/schemas/events/types.go` — refatorar completamente
- `internal/schemas/events/envelope.go` — expandir
- `internal/schemas/events/registry.go` — novo
- `internal/schemas/events/character.go` — extrair payloads de Character
- `internal/schemas/events/combat.go` — extrair payloads de Damage/Heal/Condition
- `internal/schemas/events/spell.go` — extrair payloads de SpellCast/SlotUsed
- `internal/schemas/events/rest.go` — extrair payloads de ShortRest/LongRest

---

## 4. Fase 2: Schema do Banco de Dados

### 4.1 Escopo
Criar tabelas `events`, `snapshots` e `projections` no SQLite. Remover tabelas de content redundantes (opcional, ver §6).

### 4.2 Schema

```sql
-- ============================================================
-- EVENT STORE (append-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
    id              TEXT PRIMARY KEY,           -- ULID
    aggregate_id    TEXT NOT NULL,
    aggregate_type  TEXT NOT NULL,
    type            TEXT NOT NULL,
    schema_version  INTEGER NOT NULL,
    payload         JSON NOT NULL,
    metadata        JSON DEFAULT '{}',
    occurred_at     TEXT NOT NULL,              -- RFC3339
    version         INTEGER NOT NULL,

    UNIQUE(aggregate_id, version)
);

CREATE INDEX idx_events_aggregate ON events(aggregate_id, version);
CREATE INDEX idx_events_type ON events(type, occurred_at);
CREATE INDEX idx_events_occurred ON events(occurred_at);

-- ============================================================
-- SNAPSHOTS (cache de estado para replay rápido)
-- ============================================================
CREATE TABLE IF NOT EXISTS snapshots (
    aggregate_id    TEXT PRIMARY KEY,
    aggregate_type  TEXT NOT NULL,
    version         INTEGER NOT NULL,
    state           JSON NOT NULL,
    created_at      TEXT NOT NULL
);

CREATE INDEX idx_snapshots_type ON snapshots(aggregate_type);

-- ============================================================
-- PROJECTIONS (read models otimizados)
-- ============================================================
CREATE TABLE IF NOT EXISTS character_sheets (
    character_id    TEXT PRIMARY KEY,
    campaign_id     TEXT,
    name            TEXT NOT NULL,
    level           INTEGER NOT NULL,
    classes_json    JSON NOT NULL,
    species_id      TEXT NOT NULL,
    background_id   TEXT NOT NULL,
    ability_scores  JSON NOT NULL,
    hp_current      INTEGER NOT NULL,
    hp_max          INTEGER NOT NULL,
    hp_temp         INTEGER DEFAULT 0,
    ac              INTEGER NOT NULL,
    speed           INTEGER NOT NULL,
    initiative      INTEGER NOT NULL,
    proficiency_bonus INTEGER NOT NULL,
    skills_json     JSON NOT NULL,
    saves_json      JSON NOT NULL,
    spells_json     JSON,
    conditions_json JSON DEFAULT '[]',
    resources_json  JSON DEFAULT '{}',
    equipment_json  JSON DEFAULT '[]',
    event_version   INTEGER NOT NULL,  -- até qual versão do aggregate foi projetado
    updated_at      TEXT NOT NULL
);

CREATE INDEX idx_sheets_campaign ON character_sheets(campaign_id);
CREATE INDEX idx_sheets_name ON character_sheets(name);

CREATE TABLE IF NOT EXISTS campaign_summaries (
    campaign_id     TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    character_count INTEGER DEFAULT 0,
    encounter_count INTEGER DEFAULT 0,
    last_event_at   TEXT,
    event_version   INTEGER NOT NULL,
    updated_at      TEXT NOT NULL
);

-- ============================================================
-- CONTENT PACKS (imutável, read-only)
-- ============================================================
-- NOTA: Avaliar se content permanece em SQLite ou migra para
-- YAML-only + memória. Se manter:
CREATE TABLE IF NOT EXISTS content_packs (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    version         TEXT NOT NULL,
    hash            TEXT NOT NULL,      -- SHA-256 do pack
    license         TEXT DEFAULT '',
    attribution     TEXT DEFAULT '',
    installed_at    TEXT NOT NULL,
    is_active       INTEGER DEFAULT 1   -- boolean
);
```

### 4.3 Decisão: Content em SQLite vs Memória

**Recomendação:** Remover tabelas de content do SQLite (`classes`, `class_features`, `subclasses`, etc.) e usar apenas:
1. `ResolvedContent` carregado em memória no startup.
2. `content_packs` no SQLite apenas para metadados (id, version, hash, is_active).

**Justificativa:**
- O server já carrega tudo em memória via YAML.
- Queries de content são O(1) em mapa, O(log n) em SQLite.
- Elimina duplicação de fonte de verdade (YAML vs SQLite).
- Simplifica schema e migrations.

**Se manter content no SQLite:** adicionar `content_pack_id` como FK em todas as tabelas de content e garantir que não há UPDATE/DELETE (apenas INSERT com `is_active` toggle).

### 4.4 Critérios de Aceitação
- [ ] Tabela `events` aceita append-only; `UNIQUE(aggregate_id, version)` impede duplicatas.
- [ ] Tabela `snapshots` permite recuperação rápida de estado.
- [ ] Tabela `character_sheets` é populada assincronamente (eventual consistency).
- [ ] `PRAGMA foreign_keys = ON` e `PRAGMA journal_mode = WAL` permanecem ativos.

### 4.5 Arquivos Alterados
- `internal/database/db.go` — adicionar novas tabelas ao `Migrate()`
- `internal/database/migrations/` — novo diretório com migrations versionadas (ex: `001_event_store.sql`, `002_projections.sql`)

---

## 5. Fase 3: Engine de Commit Transacional

### 5.1 Escopo
Reimplementar `engine.Commit` para persistir eventos no SQLite antes de aplicar ao estado em memória.

### 5.2 Contrato do Event Store

```go
package database

import (
    "context"
    "database/sql"
    "github.com/hadnu/arcanum/internal/schemas/events"
)

// EventStore é a interface primária de persistência.
type EventStore interface {
    // Append persiste eventos em transação atômica.
    // expectedVersion é a versão atual do aggregate; retorna OptimisticConcurrencyError se divergir.
    Append(ctx context.Context, aggregateID string, expectedVersion int, evts []events.EventEnvelope) error

    // GetEvents retorna eventos de um aggregate a partir de uma versão.
    GetEvents(ctx context.Context, aggregateID string, fromVersion int) ([]events.EventEnvelope, error)

    // GetAllEvents retorna eventos globais (para replay completo ou audit).
    GetAllEvents(ctx context.Context, from time.Time) ([]events.EventEnvelope, error)
}

type OptimisticConcurrencyError struct {
    AggregateID     string
    ExpectedVersion int
    ActualVersion   int
}

func (e *OptimisticConcurrencyError) Error() string {
    return fmt.Sprintf("concurrency conflict on %s: expected v%d, got v%d", 
        e.AggregateID, e.ExpectedVersion, e.ActualVersion)
}
```

### 5.3 Implementação SQLite

```go
package database

func (s *sqliteEventStore) Append(ctx context.Context, aggregateID string, expectedVersion int, evts []events.EventEnvelope) error {
    tx, err := s.db.BeginTx(ctx, nil)
    if err != nil { return err }
    defer tx.Rollback()

    // Verificar versão atual
    var currentVersion int
    err = tx.QueryRowContext(ctx, 
        "SELECT COALESCE(MAX(version), 0) FROM events WHERE aggregate_id = ?", 
        aggregateID).Scan(&currentVersion)
    if err != nil { return err }

    if currentVersion != expectedVersion {
        return &OptimisticConcurrencyError{
            AggregateID: aggregateID, ExpectedVersion: expectedVersion, ActualVersion: currentVersion,
        }
    }

    // Inserir eventos
    stmt, err := tx.PrepareContext(ctx, `
        INSERT INTO events (id, aggregate_id, aggregate_type, type, schema_version, payload, metadata, occurred_at, version)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    if err != nil { return err }
    defer stmt.Close()

    for i, env := range evts {
        _, err := stmt.ExecContext(ctx,
            env.ID, env.AggregateID, env.AggregateType, env.Type,
            env.SchemaVersion, env.Payload, env.Metadata, env.OccurredAt.Format(time.RFC3339),
            expectedVersion+i+1,
        )
        if err != nil { return fmt.Errorf("insert event %s: %w", env.ID, err) }
    }

    return tx.Commit()
}
```

### 5.4 Novo Engine.Commit

```go
package engine

type Engine struct {
    content      scontent.ResolvedContent
    rng          rng.Source
    eventStore   database.EventStore    // NOVO
    snapshotStore database.SnapshotStore // NOVO
}

func (e *Engine) Commit(ctx context.Context, state CampaignState, evts []events.Event) (CampaignState, error) {
    if len(evts) == 0 { return state, nil }

    // 1. Validar eventos
    for _, evt := range evts {
        if err := evt.Validate(); err != nil {
            return CampaignState{}, fmt.Errorf("validation failed for %s: %w", evt.EventType(), err)
        }
    }

    // 2. Determinar aggregate e versão
    aggregateID := state.ID  // Campaign ID
    expectedVersion := state.Version

    // 3. Construir envelopes
    envelopes := make([]events.EventEnvelope, len(evts))
    now := time.Now()
    for i, evt := range evts {
        env := events.EventEnvelope{
            ID:          types.NewEventID(),
            AggregateID: aggregateID,
            AggregateType: events.AggregateCampaign,
            Version:     expectedVersion + i + 1,
            OccurredAt:  now,
        }
        env, err := events.MarshalEvent(evt, env)
        if err != nil { return CampaignState{}, err }
        envelopes[i] = env
    }

    // 4. Persistir no Event Store (transação atômica)
    if err := e.eventStore.Append(ctx, aggregateID, expectedVersion, envelopes); err != nil {
        return CampaignState{}, fmt.Errorf("event store append: %w", err)
    }

    // 5. Aplicar ao estado em memória (após persistência confirmada)
    newState := state.Clone()  // deep copy
    for _, evt := range evts {
        newState = e.apply(newState, evt)
        newState.Version++
    }

    // 6. Snapshot a cada N eventos (ex: 50)
    if newState.Version%50 == 0 {
        _ = e.snapshotStore.Save(ctx, aggregateID, newState.Version, newState)
    }

    return newState, nil
}
```

### 5.5 Recuperação de Estado (Startup)

```go
func (e *Engine) LoadCampaign(ctx context.Context, campaignID string) (CampaignState, error) {
    // 1. Tentar snapshot mais recente
    snap, version, err := e.snapshotStore.Load(ctx, campaignID)
    if err == nil {
        state := snap.(CampaignState)
        state.Version = version

        // 2. Replay eventos posteriores ao snapshot
        evts, err := e.eventStore.GetEvents(ctx, campaignID, version+1)
        if err != nil { return CampaignState{}, err }

        for _, env := range evts {
            evt, err := events.UnmarshalPayload(env)
            if err != nil { return CampaignState{}, err }
            state = e.apply(state, evt)
            state.Version = env.Version
        }
        return state, nil
    }

    // 3. Sem snapshot: replay completo
    evts, err := e.eventStore.GetEvents(ctx, campaignID, 1)
    if err != nil { return CampaignState{}, err }

    state := CampaignState{ID: campaignID, Version: 0}
    for _, env := range evts {
        evt, err := events.UnmarshalPayload(env)
        if err != nil { return CampaignState{}, err }
        state = e.apply(state, evt)
        state.Version = env.Version
    }
    return state, nil
}
```

### 5.6 Critérios de Aceitação
- [ ] `Commit` persiste eventos antes de retornar HTTP 200.
- [ ] Falha na persistência do banco retorna erro sem aplicar ao estado.
- [ ] `OptimisticConcurrencyError` é retornado em conflitos de versão.
- [ ] Restart do servidor recupera estado via snapshot + replay.
- [ ] Snapshot é gerado automaticamente a cada N eventos.

### 5.7 Arquivos Alterados
- `internal/engine/engine.go` — adicionar `EventStore`, `SnapshotStore`
- `internal/engine/commit.go` — novo (lógica de commit transacional)
- `internal/engine/restore.go` — novo (load + replay)
- `internal/database/event_store.go` — novo
- `internal/database/snapshot_store.go` — novo

---

## 6. Fase 4: Projections (Read Models)

### 6.1 Escopo
Criar projeções atualizadas via event handlers. Substituir `SavedCharacter` YAML.

### 6.2 Projection Handler

```go
package projections

import (
    "context"
    "github.com/hadnu/arcanum/internal/database"
    "github.com/hadnu/arcanum/internal/engine/derive"
    "github.com/hadnu/arcanum/internal/schemas/events"
    "github.com/hadnu/arcanum/internal/schemas/runtime"
    scontent "github.com/hadnu/arcanum/internal/schemas/content"
)

type CharacterProjection struct {
    db      *sql.DB
    content scontent.ResolvedContent
}

func (p *CharacterProjection) OnCharacterCreated(ctx context.Context, env events.EventEnvelope, evt events.CharacterCreatedEvent) error {
    // Derive initial sheet
    char := runtime.Character{ /* construir do evento */ }
    sheet := derive.BuildCharacterSheet(char, p.content)

    _, err := p.db.ExecContext(ctx, `
        INSERT INTO character_sheets (character_id, name, level, ...)
        VALUES (?, ?, ?, ...)
        ON CONFLICT(character_id) DO UPDATE SET ...
    `, evt.CharacterID, evt.Name, evt.Level, ...)
    return err
}

func (p *CharacterProjection) OnDamageApplied(ctx context.Context, env events.EventEnvelope, evt events.DamageAppliedEvent) error {
    _, err := p.db.ExecContext(ctx, `
        UPDATE character_sheets 
        SET hp_current = MAX(0, hp_current - ?),
            event_version = ?,
            updated_at = ?
        WHERE character_id = ?
    `, evt.Amount, env.Version, time.Now().Format(time.RFC3339), evt.TargetID)
    return err
}
```

### 6.3 Atualização das APIs

```go
// GET /api/characters/{id} → lê da projection
func (s *Server) handleGetCharacter(w http.ResponseWriter, r *http.Request) {
    id := r.PathValue("id")  // Mudar de "name" para "id"

    var sheet CharacterSheetProjection
    err := s.db.QueryRowContext(r.Context(), `
        SELECT character_id, name, level, classes_json, hp_current, hp_max, ac, ...
        FROM character_sheets WHERE character_id = ?
    `, id).Scan(&sheet.ID, &sheet.Name, ...)

    if err == sql.ErrNoRows {
        http.Error(w, "Character not found", http.StatusNotFound)
        return
    }
    writeJSON(w, sheet)
}

// POST /api/characters → cria via eventos
func (s *Server) handleCreateCharacter(w http.ResponseWriter, r *http.Request) {
    var req BuildRequest
    // ... decode e validação

    evt := events.CharacterCreatedEvent{ /* ... */ }
    newState, err := s.engine.Commit(r.Context(), s.campaign, []events.Event{evt})
    if err != nil {
        http.Error(w, err.Error(), http.StatusConflict)  // 409 em concurrency
        return
    }
    s.campaign = newState

    // A projection será atualizada automaticamente pelo handler
    writeJSON(w, BuildResponse{ID: evt.CharacterID, ...})
}
```

### 6.4 Critérios de Aceitação
- [ ] `GET /api/characters/{id}` lê da projection, não do filesystem.
- [ ] `POST /api/characters` persiste eventos e retorna 201.
- [ ] Projection é atualizada dentro da mesma transação do event store (ou eventual consistency com retry).
- [ ] `data/characters/*.yaml` é removido; migração de dados existentes é executada uma vez.

---

## 7. Migração de Dados Existentes

### 7.1 YAML → Event Store
Criar script de migração one-shot:

```go
package main

// cmd/migrate-yaml-to-events/main.go
func main() {
    db := database.Open(cfg.Data.SQLitePath)
    defer db.Close()

    entries, _ := os.ReadDir("data/characters")
    for _, e := range entries {
        var sc SavedCharacter
        yaml.Unmarshal(data, &sc)

        // Gerar CharacterCreatedEvent a partir do YAML
        evt := events.CharacterCreatedEvent{
            CharacterID: types.NewCharacterID(),  // ou derivar do nome
            Name: sc.Name,
            // ... mapear campos
        }

        // Persistir como evento v1
        envelope := events.EventEnvelope{
            ID: types.NewEventID(),
            AggregateID: "campaign-migrated",
            Version: i+1,
            OccurredAt: parseTime(sc.CreatedAt),
        }
        env, _ := events.MarshalEvent(evt, envelope)
        store.Append(context.Background(), "campaign-migrated", i, []events.EventEnvelope{env})
    }
}
```

### 7.2 Decisão: Manter ou Remover Content do SQLite
- **Se remover:** Dropar tabelas `classes`, `class_features`, etc. O `Migrate()` passa a criar apenas event store + projections.
- **Se manter:** Adicionar `hash` à `content_packs` e garantir que `seed.go` não faz UPDATE (apenas INSERT OR IGNORE).

---

## 8. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Performance do replay | Alto | Snapshots a cada 50 eventos; projeções para queries |
| Schema migration de eventos | Médio | `SchemaVersion` no envelope; `EventUpgrader` para forward migration |
| Tamanho do SQLite | Médio | WAL mode; vacuum periódico; archive de eventos antigos em cold storage |
| Concorrência em multiplayer | Alto | Optimistic locking por aggregate; retry com backoff em 409 |
| Complexidade de projections | Médio | Projections são opcionais no início; pode-se usar derive em runtime para MVP |

---

## 9. Definição de Pronto (Definition of Done)

- [ ] Todos os eventos são persistidos na tabela `events` antes de retornar HTTP 200.
- [ ] O servidor recupera o estado da campanha automaticamente após restart.
- [ ] Não há mais escrita de `SavedCharacter` em YAML no filesystem.
- [ ] `GET /api/characters/{id}` lê do SQLite (projection ou derive).
- [ ] Testes de integração cobrem: criação de personagem, restart, replay, snapshot.
- [ ] Documentação atualizada (BLUEPRINT.md menciona Event Store).

---

## 10. Estimativa

| Fase | Duração |
|------|---------|
| 1. Event Model | 3-5 dias |
| 2. Schema do Banco | 1-2 dias |
| 3. Engine de Commit | 3-5 dias |
| 4. Projections + API | 3-5 dias |
| 5. Migração de dados + Testes | 2-3 dias |
| **Total** | **12-20 dias** |

---

## 11. Apêndice: Estrutura de Diretórios Final

```
internal/
├── schemas/
│   ├── events/
│   │   ├── envelope.go       # EventEnvelope
│   │   ├── types.go          # Event interface, EventType
│   │   ├── registry.go       # Marshal/Unmarshal/Registry
│   │   ├── character.go      # CharacterCreated, CharacterLeveledUp, FeatTaken, SubclassChosen
│   │   ├── combat.go         # DamageApplied, Healed, ConditionApplied, ConditionRemoved
│   │   ├── spell.go          # SpellCast, SpellSlotUsed
│   │   └── rest.go           # ShortRest, LongRest
│   ├── runtime/              # State mutável (projeção em memória)
│   ├── content/              # YAML content packs
│   └── content_packs/        # ResolvedContent loader
├── engine/
│   ├── engine.go             # Orchestration
│   ├── commit.go             # Commit transacional
│   ├── restore.go            # Load + replay
│   ├── apply.go              # Appliers puros
│   └── derive/               # Derive layer
├── database/
│   ├── db.go                 # Open, Migrate, WAL
│   ├── migrations/           # 001_event_store.sql, 002_projections.sql
│   ├── event_store.go        # SQLiteEventStore
│   ├── snapshot_store.go     # SQLiteSnapshotStore
│   ├── projections/
│   │   ├── character.go      # CharacterProjection
│   │   └── campaign.go       # CampaignProjection
│   └── inbox.go              # ProcessInbox (content packs)
└── api/
    └── server.go             # Handlers usando projections
```
