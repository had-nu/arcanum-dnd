# Graph Report - /Users/rafaellobo/Documents/repos/arcanum-dnd  (2026-07-26)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 923 nodes · 1887 edges · 53 communities (43 shown, 10 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `26ddaa27`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- AbilityScore
- ResolvedContent
- Client
- generated.ts
- Character
- Engine
- compilerOptions
- devDependencies
- CharacterID
- dependencies
- openapi.go
- api.ts
- .Apply
- ui/index.ts
- compilerOptions
- Request
- CampaignState
- id.go
- ClassStep.tsx
- BuilderPage.tsx
- icons/index.ts
- CharacterSheet
- config.go
- builderStore.ts
- VaultPage.tsx
- Toast.tsx
- ContentResponse
- contentStore.ts
- compilerOptions
- SaveCharacterRequest
- endpoints.ts
- SpellManager.tsx
- ItemInstanceID
- ChiServerOptions
- AbilitiesStep.tsx
- InvalidParamFormatError
- RequiredHeaderError
- UnmarshalingParamError
- ChoiceRequiredEvent
- theme.ts
- vite-env.d.ts
- getListCharactersUrl
- getUpdateCharacterUrl
- tailwind.config.js
- github.com/hadnu/arcanum

## God Nodes (most connected - your core abstractions)
1. `ResolvedContent` - 45 edges
2. `CharacterID` - 44 edges
3. `CampaignState` - 42 edges
4. `Event` - 41 edges
5. `Applier` - 28 edges
6. `Client` - 27 edges
7. `Character` - 27 edges
8. `AbilityScore` - 25 edges
9. `Class` - 24 edges
10. `useBuilderStore` - 19 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `LoadAllFromDataDir()`  [INFERRED]
  cmd/spells/main.go → internal/content/loader.go
- `main()` --calls--> `LoadAllFromDataDir()`  [INFERRED]
  cmd/test-warlock/main.go → internal/content/loader.go
- `main()` --calls--> `NewCreator()`  [INFERRED]
  cmd/tui-player/main.go → internal/character/creator.go
- `main()` --calls--> `LoadAllFromDataDir()`  [INFERRED]
  cmd/tui-player/main.go → internal/content/loader.go
- `main()` --calls--> `BuildCharacterSheet()`  [INFERRED]
  cmd/tui-player/main.go → internal/engine/derive/character.go

## Import Cycles
- None detected.

## Communities (53 total, 10 thin omitted)

### Community 0 - "AbilityScore"
Cohesion: 0.05
Nodes (54): CreationResult, Creator, SkillView, SpellBrowser, CharacterSheetView, main(), Background, Class (+46 more)

### Community 1 - "ResolvedContent"
Cohesion: 0.06
Nodes (63): main(), ArmorStats, CantripTier, Condition, ContentPack, Feat, ItemDef, LevelEntry (+55 more)

### Community 2 - "Client"
Cohesion: 0.08
Nodes (30): APIResponse, BackgroundData, BackgroundProperties, Challenge, ClassData, ClassProperties, Client, FeatBenefit (+22 more)

### Community 3 - "generated.ts"
Cohesion: 0.06
Nodes (40): Attack, buildCharacter(), BuildRequestAbilityMethod, CharacterCreatedEvent, CharacterCreatedEventSkills, CharacterSheetSavingThrows, CharacterSheetSkills, CharacterSheetSpellSlots (+32 more)

### Community 4 - "Character"
Cohesion: 0.12
Nodes (37): AttackView, CharacterSheet, ClassView, HPView, SkillView, SpellcastingStatsView, SpellSlotView, abilityModifier() (+29 more)

### Community 5 - "Engine"
Cohesion: 0.10
Nodes (28): Applier, main(), Campaign, Deriver, Engine, Planner, PlanResult, Applier (+20 more)

### Community 6 - "compilerOptions"
Cohesion: 0.05
Nodes (37): compilerOptions, allowImportingTsExtensions, baseUrl, ignoreDeprecations, isolatedModules, jsx, lib, module (+29 more)

### Community 7 - "devDependencies"
Cohesion: 0.06
Nodes (35): autoprefixer, devDependencies, autoprefixer, orval, @orval/zod, postcss, tailwindcss, @tailwindcss/postcss (+27 more)

### Community 8 - "CharacterID"
Cohesion: 0.12
Nodes (27): AbilityCheckRolledEvent, AttackRolledEvent, CharacterCreatedEvent, ChoiceOption, ChoiceResolvedEvent, ClassEntry, ConcentrationBrokenEvent, ConcentrationStartedEvent (+19 more)

### Community 9 - "dependencies"
Cohesion: 0.06
Nodes (35): clsx, dependencies, clsx, @hookform/resolvers, lucide-react, @radix-ui/react-dialog, @radix-ui/react-select, @radix-ui/react-slot (+27 more)

### Community 10 - "openapi.go"
Cohesion: 0.07
Nodes (28): BuildRequestAbilityMethod, ClassEntryEvent, ClassReq, ClassSummary, ErrorResponse, FeatEntry, FeatureDef, FeatureView (+20 more)

### Community 11 - "api.ts"
Cohesion: 0.07
Nodes (29): AbilityEntry, AbilityScores, Attack, BackgroundEntry, BuildRequest, BuildResponse, CharacterCreatedEvent, CharacterSheet (+21 more)

### Community 12 - ".Apply"
Cohesion: 0.11
Nodes (13): ConditionAppliedEvent, HealedEvent, LevelUpResolvedEvent, LongRestEndedEvent, LongRestStartedEvent, NPCActionResolvedEvent, ShortRestEndedEvent, ShortRestStartedEvent (+5 more)

### Community 13 - "ui/index.ts"
Cohesion: 0.15
Nodes (17): Button, ButtonProps, Card, CardMeta(), CardProps, CardTags(), CardTitle(), Chevron() (+9 more)

### Community 14 - "compilerOptions"
Cohesion: 0.08
Nodes (24): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+16 more)

### Community 15 - "Request"
Cohesion: 0.24
Nodes (6): GetSpellsParams, ServerInterfaceWrapper, Unimplemented, Handler(), Request, ResponseWriter

### Community 16 - "CampaignState"
Cohesion: 0.14
Nodes (15): EncounterCreatedEvent, EncounterEndedEvent, EncounterStartedEvent, RoundEndedEvent, TurnEndedEvent, TurnStartedEvent, NewEncounterID(), CampaignSettings (+7 more)

### Community 17 - "id.go"
Cohesion: 0.13
Nodes (15): EventEnvelope, MustNewULID(), NewCharacterID(), NewCreatureID(), NewEffectInstanceID(), NewEventID(), NewPartyID(), NewULIDReader() (+7 more)

### Community 18 - "ClassStep.tsx"
Cohesion: 0.14
Nodes (16): ClassCard(), ClassStep(), Tab(), TabList(), TabListProps, TabPanel(), TabPanelProps, TabProps (+8 more)

### Community 19 - "BuilderPage.tsx"
Cohesion: 0.25
Nodes (13): BackgroundStep(), BuilderPage(), canProceed(), getStepIndex(), goToStep(), StepId, STEPS, EquipmentStep() (+5 more)

### Community 20 - "icons/index.ts"
Cohesion: 0.14
Nodes (11): CheckIcon(), IconProps, DnaIcon(), IconProps, IconProps, LockIcon(), IconProps, ScrollIcon() (+3 more)

### Community 21 - "CharacterSheet"
Cohesion: 0.13
Nodes (15): Attack, BuildRequest, BuildResponse, CharacterCreatedEvent, CharacterSheet, Event, AbilityScores, Event (+7 more)

### Community 22 - "config.go"
Cohesion: 0.27
Nodes (14): Config, CORSConfig, DataConfig, LogConfig, ServerConfig, Duration, getEnv(), Load() (+6 more)

### Community 23 - "builderStore.ts"
Cohesion: 0.21
Nodes (12): AbilityScores, BuildRequest, BuildResponse, CharacterSheet, ClassReq, SubClassEntry, BuilderStore, ChoicePoint (+4 more)

### Community 24 - "VaultPage.tsx"
Cohesion: 0.21
Nodes (6): App(), queryClient, VaultPage(), LandingPage(), AppRoutes(), ToastProvider()

### Community 25 - "Toast.tsx"
Cohesion: 0.20
Nodes (5): Toast, ToastContainer(), ToastContext, ToastContextValue, useToast()

### Community 26 - "ContentResponse"
Cohesion: 0.20
Nodes (10): AbilityEntry, BackgroundEntry, ClassEntry, ContentResponse, FeatEntry, FeatureDef, SkillEntry, SpeciesEntry (+2 more)

### Community 27 - "contentStore.ts"
Cohesion: 0.33
Nodes (9): AbilityEntry, BackgroundEntry, ClassEntry, FeatEntry, SkillEntry, SpeciesEntry, ClassCardProps, SpellManagerProps (+1 more)

### Community 28 - "compilerOptions"
Cohesion: 0.20
Nodes (9): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, strict, include (+1 more)

### Community 29 - "SaveCharacterRequest"
Cohesion: 0.25
Nodes (9): CharacterSummary, Health, SaveCharacterRequest, SaveCharacterRequestProgressionType, SavedCharacter, HealthStatus, SavedCharacterProgressionType, SavedClass (+1 more)

### Community 30 - "endpoints.ts"
Cohesion: 0.22
Nodes (7): api, CharacterSummary, ContentResponse, GetSpellsParams, SaveCharacterRequest, SavedCharacter, SpellsResponse

### Community 31 - "SpellManager.tsx"
Cohesion: 0.31
Nodes (7): getCantripsKnown(), getMaxPreparedSpells(), getSpellSlotsSummary(), SpellManager(), SpellWithLevel, Input, InputProps

### Community 32 - "ItemInstanceID"
Cohesion: 0.25
Nodes (5): ItemAcquiredEvent, ItemEquippedEvent, ItemUnequippedEvent, NewItemInstanceID(), ItemInstanceID

### Community 33 - "ChiServerOptions"
Cohesion: 0.48
Nodes (7): ChiServerOptions, MiddlewareFunc, ServerInterface, HandlerFromMux(), HandlerFromMuxWithBaseURL(), HandlerWithOptions(), Router

### Community 34 - "AbilitiesStep.tsx"
Cohesion: 0.38
Nodes (6): abilities, AbilitiesStep(), abilityNames, getMod(), pointBuyCost(), PoolChip

## Knowledge Gaps
- **213 isolated node(s):** `BuildRequestAbilityMethod`, `ClassEntryEvent`, `ClassReq`, `ClassSummary`, `ErrorResponse` (+208 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ResolvedContent` connect `ResolvedContent` to `AbilityScore`, `CharacterID`, `Character`, `Engine`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `Character` connect `Character` to `AbilityScore`, `ResolvedContent`, `Engine`, `CharacterID`, `CampaignState`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `CampaignState` connect `CampaignState` to `ItemInstanceID`, `Character`, `Engine`, `ChoiceRequiredEvent`, `CharacterID`, `.Apply`, `id.go`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `BuildRequestAbilityMethod`, `ClassEntryEvent`, `ClassReq` to the rest of the system?**
  _213 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AbilityScore` be split into smaller, more focused modules?**
  _Cohesion score 0.05362614913176711 - nodes in this community are weakly interconnected._
- **Should `ResolvedContent` be split into smaller, more focused modules?**
  _Cohesion score 0.05578947368421053 - nodes in this community are weakly interconnected._
- **Should `Client` be split into smaller, more focused modules?**
  _Cohesion score 0.08156028368794327 - nodes in this community are weakly interconnected._