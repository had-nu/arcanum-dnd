# ARCANUM — Blueprint do Estado Atual (v0.2.0)

**Data:** 2026-07-27
**Commit:** e4c5e36 + alterações locais (metamagic/feats endpoints, license, readme)

---

## 1. Visão Geral da Arquitetura

### Backend (Go)
- **Framework:** Chi router, stdlib HTTP
- **Database:** SQLite (modernc.org/sqlite) com WAL + FKs
- **Engine:** Event-sourced (Plan/Commit/Apply/Replay + Derive)
- **Content:** YAML packs em `data/` → `ResolvedContent` (tipado)
- **Import:** 5etools-src (opcional) para feature descriptions, metamagic, spells

### Frontend (React + TypeScript + Vite)
- **State:** Zustand (contentStore, builderStore, wizardUIStore)
- **API:** Tipos gerados via openapi-typescript/orval (não editados à mão)
- **Routing:** React Router (`/`, `/characters`, `/builder/:id`)
- **Theme:** Wine/Gold/Parchment tokens, Tiamat font para D&D feel

### TUI (Bubble Tea)
- `cmd/tui-player/` — Character sheet, combat tracker (WIP)
- `cmd/tui-master/` — DM tools (WIP)

---

## 2. Database Schema (SQLite)

### Tabelas Core (Migração + Seed YAML)
| Tabela | Descrição |
|--------|-----------|
| `content_packs` | Metadata de packs instalados |
| `classes` | Classes base (hit_die, spellcaster, subclass_level, skill_choices) |
| `class_primary_abilities` | Abilidades primárias por classe |
| `class_saving_throws` | Saving throws por classe |
| `class_skill_pool` | Pool de skills disponíveis + choose_count |
| `class_levels` | Níveis por classe (prof_bonus, feat ref) |
| `class_features` | Features de classe (entries_json do 5etools) |
| `subclasses` | Subclasses por classe |
| `subclass_features` | Features de subclass (entries_json + spell_list_json) |
| `feats` | Feats (entries_json, prerequisites_json) |

### Tabelas Novas (Metamagic + ASI/Feat + Skill Proficiencies)
| Tabela | Descrição |
|--------|-----------|
| `metamagic_options` | Opções de metamagia (id, name, source, description, level) — importadas de `optionalfeatures.json` (featureType: "MM") |
| `class_asi_feats` | Escolhas ASI/Feat por classe/level (choice_type: 'asi'|'feat', ability_scores JSON, feat_id) |
| `class_skill_proficiencies` | Skills disponíveis por classe + choose_count (para dropdowns no builder) |

### Índices
- `idx_class_features_class` (class_id, level)
- `idx_class_levels_class` (class_id, level)
- `idx_subclasses_class` (class_id)
- `idx_subclass_features_subclass` (subclass_id, level)

---

## 3. API Endpoints Implementados

| Método | Path | Handler | Status |
|--------|------|---------|--------|
| GET | `/health` | `handleHealth` | ✅ |
| GET | `/api/content` | `handleContent` | ✅ |
| GET | `/api/spells` | `handleSpells` | ✅ |
| GET | `/api/features/{classId}` | `handleFeatures` | ✅ |
| GET | `/api/metamagic-options` | `handleMetamagicOptions` | ✅ **NOVO** |
| GET | `/api/feats` | `handleFeats` | ✅ **NOVO** |
| POST | `/api/build` | `handleBuild` | ✅ |
| GET | `/api/characters` | `handleListCharacters` | ✅ |
| POST | `/api/characters` | `handleSaveCharacter` | ✅ |
| GET | `/api/characters/{name}` | `handleGetCharacter` | ✅ |
| PUT | `/api/characters/{name}` | `handleSaveCharacter` | ✅ |
| DELETE | `/api/characters/{name}` | `handleDeleteCharacter` | ✅ |

### Response Shapes

**GET /api/metamagic-options**
```json
{
  "metamagicOptions": [
    { "id": "metamagic.careful-spell", "name": "Careful Spell", "source": "XPHB", "description": "[...]", "level": 2 }
  ]
}
```

**GET /api/feats**
```json
{
  "feats": [
    { "id": "alert", "name": "Alert", "description": "...", "prerequisites": "[]" }
  ]
}
```

---

## 4. Frontend State (Zustand Stores)

### `contentStore` (read-only, loaded once)
- `classes: ClassEntry[]`
- `species: SpeciesEntry[]`
- `backgrounds: BackgroundEntry[]`
- `feats: Record<string, FeatEntry>`
- `skills: SkillEntry[]`
- `abilities: AbilityEntry[]`
- `spellCasterClasses: string[]`
- `load(): Promise<void>` — GET `/api/content`

### `builderStore` (draft + preview + choices)
```typescript
interface BuilderStore {
  // Core
  draft: DraftWithSubclass;           // BuildRequest com classes + subclassId
  preview: CharacterSheet | null;     // Última resposta de /build
  pendingChoices: ChoicePoint[];      // Derivado localmente

  // Choice state (NOVO)
  skillProficiencies: Record<string, string[]>;     // classId -> skillIds[]
  metamagicSelections: Record<string, string[]>;    // classId -> metamagicOptionIds[]
  subclassSelections: Record<string, string>;       // classId -> subclassId
  asiChoices: Record<string, AsiChoice>;            // `${classId}_${level}` -> AsiChoice
  featSelections: Record<string, string[]>;         // classId -> featIds[]

  // Actions
  setSkillProficiency: (classId: string, index: number, skillId: string) => void;
  setMetamagicSelection: (classId: string, metamagicIds: string[]) => void;
  setSubclassSelection: (classId: string, subclassId: string) => void;
  setAsiChoice: (classId: string, level: number, choice: AsiChoice) => void;
  setFeatSelection: (classId: string, featIds: string[]) => void;
  // ... + setName, addClass, setClassLevel, removeClass, setAbilityScore, toggleSkill, addPreparedSpell, removePreparedSpell, addFeat, removeFeat, requestPreview, save
}
```

### `wizardUIStore` (ephemeral)
- `activeStep: 'class' | 'background' | 'species' | 'abilities' | 'equipment' | 'whatsnext'`
- `activeClassTab: 'features' | 'optional-features' | 'spells'`

---

## 5. Feature Modules (Frontend)

### `features/builder/class-step/`
- `ClassStep.tsx` — Orchestration: ClassCard list, SpellManager, subclass dropdown
- `ClassCard.tsx` — Class glyph, level select, subclass dropdown (highlight level 3), remove button
- `SpellManager.tsx` — Prepared spells + Add spells modal (fetches `/api/spells?class=&level=`)
- `useClassStep.ts` — Hook logic

### `features/vault/`
- `VaultPage.tsx` — Lista characters (GET `/api/characters`)
- `CharacterCard.tsx` — View/Edit/Delete
- `useCharacterList.ts` — Hook

### `shared/ui/`
- `FeatureRenderer.tsx` — **NOVO** Renderiza features com Tiamat font, strip5eMarkup, expandable cards
- `strip5eMarkup.ts` — **NOVO** Remove markup 5etools (`{@i}`, `{@bold}`, `{@spell}`, etc.)

---

## 6. Data Flow — Character Builder

```
User Action (ClassStep, etc.)
       │
       ▼
builderStore action → updates draft (BuildRequest)
       │
       ▼
debounced requestPreview() → POST /api/build
       │
       ▼
Backend: engine.Commit(CharacterCreatedEvent) → derive.BuildCharacterSheet()
       │
       ▼
Response: CharacterSheet (hp, ac, saves, skills, spellSlots, attacks, features[])
       │
       ▼
builderStore.preview = sheet → UI re-renders (HP/AC/Spell Slots live)
       │
       ▼
User continues → Save → POST/PUT /api/characters → YAML em data/characters/
```

---

## 7. Import Pipeline (5etools)

### Arquivos Fonte (`../5etools-src/data/`)
| Arquivo | Importado Para | Handler |
|---------|----------------|---------|
| `classfeatures.json` | `class_features` | `Import5eFeatures` |
| `subclassfeatures.json` | `subclass_features` | `Import5eFeatures` |
| `optionalfeatures.json` | `metamagic_options` | `importMetamagicOptions` **NOVO** |
| `spells.json` | (via YAML seed) | — |
| `feats.json` | (via YAML seed) | — |

### `importMetamagicOptions()` Logic
1. Lê `optionalfeatures.json`
2. Filtra `optionalfeature[]` onde `featureType` inclui `"MM"`
3. Gera ID: `metamagic.{kebab-case(name)}`
4. Upsert em `metamagic_options` (id, name, source, entries_json→description, level=2)

---

## 8. Tipos TypeScript (Frontend) — `frontend/src/types/api.ts`

```typescript
// NOVOS
export interface MetamagicOption {
  id: string;
  name: string;
  source: string;
  description: unknown[];
  level: number;
}

export interface FeatEntry {
  id: string;
  name: string;
  prerequisites?: unknown;
  description: unknown[];
  entries: unknown[];
}

export interface MetamagicOptionsResponse {
  metamagicOptions: MetamagicOption[];
}

export interface FeatsResponse {
  feats: FeatEntry[];
}

// Existentes: FeaturesResponse, BuildRequest, CharacterSheet, etc.
```

---

## 9. Pendentes / Próximos Passos Imediatos

### Backend
- [ ] Popular `class_asi_feats` (ASI levels por classe: 4, 8, 12, 16, 19 + Fighter/Rogue extras)
- [ ] Popular `class_skill_proficiencies` (skill pool + choose_count por classe)
- [ ] Endpoint `/api/class-asi-feats/{classId}` ou incluir em `/api/features`
- [ ] Endpoint `/api/class-skills/{classId}` ou incluir em `/api/content`

### Frontend
- [ ] **ASI/Feat Step** no wizard (level 4, 8, 12, 16, 19) — dropdown ASI (+2/+1+1) ou Feat selection
- [ ] **Skill Proficiency Dropdowns** no ClassStep — usa `class_skill_proficiencies` + `skillChoices`
- [ ] **Metamagic UI** — Sorcerer level 2+ mostra metamagic options (fetch `/api/metamagic-options`)
- [ ] **Feat Selection UI** — no ASI step ou feats gerais
- [ ] **Equipment Step** — starting equipment por classe/background
- [ ] **What's Next Step** — pending choices badges (subclass @3, ASI @4, metamagic @2, skills @1)

### Database
- [ ] Seed `class_asi_feats` via YAML ou migration
- [ ] Seed `class_skill_proficiencies` via YAML ou migration

---

## 10. Arquivos Modificados Recentemente (Unstaged)

| Arquivo | Mudança |
|---------|---------|
| `cmd/server/main.go` | + `handleMetamagicOptions`, `handleFeats`, routes |
| `internal/database/db.go` | + tabelas `metamagic_options`, `class_asi_feats`, `class_skill_proficiencies` |
| `internal/database/import5e.go` | + `importMetamagicOptions()` |
| `frontend/src/api/endpoints.ts` | + `getMetamagicOptions()`, `getFeats()` |
| `frontend/src/stores/builderStore.ts` | + choice state (skills, metamagic, asi, feats) + actions |
| `frontend/src/types/api.ts` | + `MetamagicOption`, `FeatEntry`, responses |
| `LICENSE` | **NOVO** AGPL-3.0 + 5e-tools attribution |
| `README.md` | **ATUALIZADO** com specs, endpoints, license, roadmap |

---

## 11. Como Testar Localmente

```sh
# Terminal 1: Backend
cd /home/hadnu/workspace/homelab/dnd-project/arcanum
go run ./cmd/server/
# → http://localhost:8080

# Terminal 2: Frontend Dev (com proxy Vite para :8080)
cd frontend && npm run dev
# → http://localhost:5173

# Testar endpoints:
curl http://localhost:8080/api/metamagic-options
curl http://localhost:8080/api/feats
curl http://localhost:8080/api/features/sorcerer?subclassId=draconic-bloodline
```

---

## 12. Decisões de Design Relevantes

1. **Backend-driven rules** — `/build` é stateless, calcula tudo (HP, AC, spell slots). Frontend só envia draft e renderiza preview.

2. **Choice state separado do draft** — `skillProficiencies`, `metamagicSelections`, `asiChoices`, `featSelections` ficam no store mas **não** vão no `BuildRequest` até o Save final. Permite UI interativa sem commits parciais.

3. **5etools import opcional** — Server inicia sem 5etools-src (warning apenas). Feature descriptions vêm do JSON importado, não do YAML.

4. **Tiamat font** — Usada no `FeatureRenderer` para ícones D&D (spell schools, etc.) via ligaduras.

5. **YAML characters** — Armazenamento simples, legível, versionável. `name` é PK (sanitizado para filename).

---

## 13. Riscos / Dívidas Técnicas

| Item | Risco | Mitigação |
|------|-------|-----------|
| `class_asi_feats` vazio | ASI/Feat step não funciona | Popular via seed YAML ou migration |
| `class_skill_proficiencies` vazio | Skill dropdowns vazios | Popular via seed YAML |
| Feat descriptions vazias | UI mostra descrição vazia | Importar `feats.json` do 5etools (entries) |
| `/api/content` não inclui skill pool por classe | Frontend precisa inferir | Adicionar `class_skill_proficiencies` no content response |
| Debounce `/build` pode spam | Load no backend | 300ms debounce já implementado; considerar throttle |

---

## 14. Próximo Commit Sugerido

```sh
git add -A
git commit -m "feat: Metamagic/Feats API + AGPL-3.0 license + updated README

- Backend: GET /api/metamagic-options, GET /api/feats handlers
- DB: metamagic_options, class_asi_feats, class_skill_proficiencies tables
- Import: importMetamagicOptions() from 5etools optionalfeatures.json (MM type)
- Frontend: API endpoints, builderStore choice state (skills, metamagic, asi, feats)
- Types: MetamagicOption, FeatEntry, response types
- License: AGPL-3.0 with 5e-tools attribution
- README: Updated with endpoints, architecture, license, roadmap"
```

---

**Fim do Blueprint** — Estado capturado em 2026-07-27.