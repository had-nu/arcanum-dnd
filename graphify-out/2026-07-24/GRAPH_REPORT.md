# Graph Report - .  (2026-07-24)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 559 nodes · 1473 edges · 19 communities (18 shown, 1 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 50 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b88989a2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Event
- ResolvedContent
- Client
- Class
- server/main.go
- Character
- app.js
- Engine
- id.go
- effects.go
- getMain
- ClassID
- esc
- getGrantedSpells
- renderAbilityEditor
- github.com/hadnu/arcanum

## God Nodes (most connected - your core abstractions)
1. `Event` - 49 edges
2. `ResolvedContent` - 48 edges
3. `CharacterID` - 45 edges
4. `CampaignState` - 42 edges
5. `Applier` - 28 edges
6. `Client` - 27 edges
7. `Character` - 27 edges
8. `Class` - 25 edges
9. `AbilityScore` - 25 edges
10. `esc()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `LoadAllFromDataDir()`  [INFERRED]
  cmd/server/main.go → internal/content/loader.go
- `main()` --calls--> `NewEngine()`  [INFERRED]
  cmd/server/main.go → internal/engine/engine.go
- `main()` --calls--> `NewSeededRNG()`  [INFERRED]
  cmd/server/main.go → internal/rng/rng.go
- `main()` --calls--> `LoadAllFromDataDir()`  [INFERRED]
  cmd/spells/main.go → internal/content/loader.go
- `main()` --calls--> `NewCreator()`  [INFERRED]
  cmd/tui-player/main.go → internal/character/creator.go

## Import Cycles
- None detected.

## Communities (19 total, 1 thin omitted)

### Community 0 - "Event"
Cohesion: 0.07
Nodes (54): AbilityCheckRolledEvent, AttackRolledEvent, ChoiceOption, ChoiceRequiredEvent, ChoiceResolvedEvent, ConcentrationBrokenEvent, ConcentrationStartedEvent, ConditionAppliedEvent (+46 more)

### Community 1 - "ResolvedContent"
Cohesion: 0.07
Nodes (61): featureName(), ArmorStats, CantripTier, Condition, ContentPack, Feat, ItemDef, LevelEntry (+53 more)

### Community 2 - "Client"
Cohesion: 0.08
Nodes (30): AbilityScores, APIResponse, BackgroundData, BackgroundProperties, Challenge, ClassData, ClassProperties, Client (+22 more)

### Community 3 - "Class"
Cohesion: 0.11
Nodes (36): CreationResult, Creator, SkillView, CharacterSheetView, Background, Class, SpellcastingProfile, SpellcastingType (+28 more)

### Community 4 - "server/main.go"
Cohesion: 0.10
Nodes (35): abilityMod(), atoi(), buildSpellcastingEntry(), charactersDir(), computeHP(), corsMiddleware(), AbilityScores, hitDieMax() (+27 more)

### Community 5 - "Character"
Cohesion: 0.12
Nodes (37): AttackView, CharacterSheet, ClassView, HPView, SkillView, SpellcastingStatsView, SpellSlotView, abilityModifier() (+29 more)

### Community 6 - "app.js"
Cohesion: 0.08
Nodes (29): canNavigateTo(), closeBgPopup(), confirmAbilities(), confirmBg(), confirmBgPopup(), confirmClass(), confirmEquipment(), confirmName() (+21 more)

### Community 7 - "Engine"
Cohesion: 0.11
Nodes (24): Applier, main(), Campaign, Deriver, Engine, Planner, PlanResult, Applier (+16 more)

### Community 8 - "id.go"
Cohesion: 0.09
Nodes (19): EventEnvelope, MustNewULID(), NewCampaignID(), NewCharacterID(), NewCreatureID(), NewEffectInstanceID(), NewEncounterID(), NewEventID() (+11 more)

### Community 9 - "effects.go"
Cohesion: 0.09
Nodes (15): EffectInstance, EffectKind, EffectStack, ModifierTarget, ModifierTargetAC, ModifierTargetAttack, ModifierTargetCheck, ModifierTargetDamage (+7 more)

### Community 10 - "getMain"
Cohesion: 0.15
Nodes (21): closeClassPopup(), closeSpeciesPopup(), confirmClassPopup(), confirmSpeciesPopup(), getMain(), removeClass(), removeHybrid(), removeSpecies() (+13 more)

### Community 11 - "ClassID"
Cohesion: 0.21
Nodes (7): SpellBrowser, main(), ClassEntry, Scanner, NewSpellBrowser(), CharacterSheetView, ClassID

### Community 12 - "esc"
Cohesion: 0.17
Nodes (19): abMod(), buildCharacter(), buildPopupFeaturesList(), calcHP(), esc(), getSubclassLevel(), isSpellRecommended(), openBgPopup() (+11 more)

### Community 13 - "getGrantedSpells"
Cohesion: 0.24
Nodes (17): aggregateClassSpells(), getCantripsKnown(), getCasterLevel(), getClassSpellList(), getClassSpellsForPicker(), getGrantedSpells(), getMaxSpellLevel(), getMaxSpellsKnownPerLevel() (+9 more)

### Community 14 - "renderAbilityEditor"
Cohesion: 0.23
Nodes (12): abName(), assignFromPool(), changePointBuy(), fmtMod(), renderAbilityEditor(), renderPointBuyEditor(), renderRollEditor(), renderStandardArrayEditor() (+4 more)

## Knowledge Gaps
- **14 isolated node(s):** `CharacterSummary`, `state`, `STD_ARRAY`, `STEPS`, `github.com/hadnu/arcanum` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ResolvedContent` connect `ResolvedContent` to `Class`, `server/main.go`, `Character`, `Engine`, `ClassID`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **Why does `Character` connect `Character` to `Event`, `ResolvedContent`, `Class`, `Engine`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Why does `CampaignState` connect `Event` to `id.go`, `Character`, `Engine`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **What connects `CharacterSummary`, `state`, `STD_ARRAY` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Event` be split into smaller, more focused modules?**
  _Cohesion score 0.06789628441593157 - nodes in this community are weakly interconnected._
- **Should `ResolvedContent` be split into smaller, more focused modules?**
  _Cohesion score 0.06651017214397496 - nodes in this community are weakly interconnected._
- **Should `Client` be split into smaller, more focused modules?**
  _Cohesion score 0.08156028368794327 - nodes in this community are weakly interconnected._