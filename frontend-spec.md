# D&D 5.5e Character Builder — Frontend Spec (from-scratch)

## 0. Contexto e decisão de arquitetura

O backend já existe (Go + chi, gerado via oapi-codegen) e define o contrato de
dados. **O frontend modela-se a partir deste contrato — não o inverso.**
Isto elimina a maior fonte de retrabalho num character builder: um modelo de
estado no frontend que diverge do payload que o backend espera/devolve.

Stack assumida (confirmada pelo `config.yaml`, CORS já aberto para
`localhost:5173`):
- Vite + React + TypeScript
- Zustand para estado do personagem em edição
- React Router para `/`, `/characters`, `/builder/:id` (ou `/builder/new`)
- Tipos TypeScript gerados a partir do OpenAPI spec do backend
  (`openapi-typescript` ou `orval` — não escrever os tipos à mão em paralelo
  ao `internal/api/openapi.go`)

## 1. Contrato de API existente (fonte de verdade)

```
GET    /content                  → ContentResponse   (bulk: classes, species,
                                     backgrounds, feats, abilities, skills)
GET    /spells?class=&level=&lvl= → SpellsResponse    (cantrips + leveled[][])
POST   /build                     → BuildResponse     (calcula sheet a partir
                                     de um BuildRequest — usar durante o wizard
                                     para preview em tempo real)
GET    /characters                → CharacterSummary[]
POST   /characters                 → grava um SavedCharacter
GET    /characters/{name}          → SavedCharacter
PUT    /characters/{name}          → atualiza
DELETE /characters/{name}          → apaga
GET    /health
```

Ponto de arquitetura chave: **`/build` é stateless e devolve o sheet
calculado** (`CharacterSheet` com `ac`, `hp`, `savingThrows`, `skills`,
`spellSlots`, `attacks`...). Isto significa que o frontend **não precisa de
replicar o motor de regras** — envia o `BuildRequest` (classes, species,
background, ability scores, skills, feats, spells escolhidos) sempre que algo
muda no wizard, e usa a resposta para renderizar HP/AC/spell slots. Só
`POST /characters` grava de facto.

Consequência prática de UX: o wizard pode fazer *debounced calls* a `/build`
a cada alteração relevante (ex: mudar nível de uma classe, mudar ability
score) para manter o painel de "Character level / Max HP / Hit Dice" sempre
correto, sem lógica de cálculo duplicada no cliente.

## 2. Modelo de estado no frontend

Dois stores, ciclos de vida diferentes:

```ts
// stores/contentStore.ts — carregado uma vez no arranque, read-only
type ContentStore = {
  classes: ClassEntry[]
  species: SpeciesEntry[]
  backgrounds: BackgroundEntry[]
  feats: Record<string, FeatEntry>
  skills: SkillEntry[]
  abilities: AbilityEntry[]
  spellCasterClasses: string[]
  loaded: boolean
  load: () => Promise<void>   // GET /content, uma vez
}

// stores/builderStore.ts — estado do personagem em edição
type BuilderStore = {
  draft: BuildRequest              // o que se envia para /build e /characters
  preview: CharacterSheet | null   // última resposta de /build
  pendingChoices: ChoicePoint[]    // derivado localmente, ver secção 4
  setName: (name: string) => void
  addClass: (classId: string) => void
  setClassLevel: (classId: string, level: number) => void
  removeClass: (classId: string) => void
  setAbilityScore: (ability: keyof AbilityScores, value: number) => void
  toggleSkill: (skillId: string) => void
  addPreparedSpell: (spellId: string) => void
  removePreparedSpell: (spellId: string) => void
  requestPreview: () => Promise<void>  // POST /build, debounced
  save: () => Promise<void>            // POST ou PUT /characters
}

// stores/wizardUIStore.ts — efémero, não persiste
type WizardUIStore = {
  activeStep: 'class' | 'background' | 'species' | 'abilities' | 'equipment' | 'whatsnext'
  activeClassTab: 'features' | 'optional-features' | 'spells'
}
```

Regra: **`draft` (BuildRequest) é a única fonte de verdade que se envia à
API.** `preview` (CharacterSheet) é derivado, nunca editado diretamente —
qualquer mudança que o utilizador faça passa por uma ação no `BuilderStore`,
que atualiza `draft` e dispara `requestPreview()`.

## 3. Estrutura de pastas

```
src/
├── api/
│   ├── client.ts            # fetch wrapper, base URL, error handling
│   ├── generated/            # tipos TS gerados do OpenAPI — não editar
│   └── endpoints.ts           # getContent(), buildCharacter(), listCharacters()...
│
├── stores/
│   ├── contentStore.ts
│   ├── builderStore.ts
│   └── wizardUIStore.ts
│
├── features/
│   ├── vault/
│   │   ├── VaultPage.tsx
│   │   ├── CharacterCard.tsx
│   │   └── useCharacterList.ts    # wraps GET /characters
│   │
│   └── builder/
│       ├── BuilderPage.tsx        # orquestra steps + TopChrome + prev/next
│       ├── TopChrome.tsx
│       ├── class-step/
│       │   ├── ClassStep.tsx
│       │   ├── ClassCard.tsx
│       │   ├── SpellManager.tsx    # Prepared Spells / Add Spells
│       │   └── useClassStep.ts     # lê contentStore.classes + builderStore
│       ├── background-step/
│       ├── species-step/
│       ├── abilities-step/
│       ├── equipment-step/
│       └── whats-next-step/
│
├── shared/
│   ├── ui/                   # Button, LevelSelect, Chevron, ClassGlyph...
│   └── theme.ts               # tokens já definidos (wine/gold/parchment)
│
├── pages/LandingPage.tsx
└── routes.tsx
```

## 4. Choice points (decisões pendentes)

O motor de regras já existe no backend, mas a UI precisa de saber **que
decisões faltam** ao utilizador para desbloquear o botão "What's next" e
mostrar badges nos steps. Como o backend não expõe isto diretamente na
`BuildResponse` (confirmar — pode já vir em `features`), o frontend deriva
localmente a partir de `preview.features` + `ContentEntry` correspondente:

```ts
function resolvePendingChoices(preview: CharacterSheet, content: ContentStore): ChoicePoint[]
```

Se o backend vier a expor isto nativamente (ex: um campo `pendingChoices` em
`BuildResponse`), a função acima passa a ser um passthrough — não é
trabalho perdido, é a camada de adaptação certa.

## 5. UX esperado — comportamento por step

**Class step** (já com screenshot de referência):
- Adicionar classe → `POST /build` re-executa, `Max HP`/`Hit Dice` atualizam
- Dropdown de nível por classe → mesmo fluxo
- Tab "Spells" → `SpellManager`: `Prepared Spells (N)` mostra contagem vs.
  `preview.spellSlots`/`spellcasting.preparedSpells` da classe; `Add Spells`
  abre lista vinda de `GET /spells?class=X&lvl=Y`, filtrada e paginada por
  nível de spell
- Remover classe (X vermelho) → confirmação inline se a classe tem
  spells/features já escolhidos que seriam perdidos

**Vault (`/characters`)**:
- `GET /characters` no mount, lista `CharacterSummary[]`
- View/Edit → navega para `/builder/:name` que faz `GET /characters/{name}`
  e popula `builderStore.draft`
- Copy/Delete: podem ficar como stub inicialmente (spec já assumia isto)

## 6. Como pedir isto a uma LLM — um módulo de cada vez

Nunca pedir "constrói o frontend inteiro". Ordem sugerida de entregas,
cada uma com o seu próprio prompt/PR:

1. `api/generated` + `api/client.ts` + `stores/contentStore.ts` — puxar
   `/content` e `/spells`, sem UI nenhuma, só validar que os tipos batem
2. `shared/theme.ts` + `shared/ui/*` — os átomos visuais (já existem como
   protótipo no `CharacterWizard.jsx` anterior, portar para TS + tokens)
3. `features/builder/class-step/*` ligado a `builderStore` real, com
   `POST /build` funcional — este é o módulo crítico, valida o fluxo
   draft → preview → render
4. `features/vault/*` — lista + navegação para o builder
5. Restantes steps do wizard, um de cada vez

Cada prompt para a LLM deve anexar: este documento, o `openapi.go` (ou o
spec OpenAPI original se existir em YAML/JSON separado), e o ficheiro do
step anterior já aceite — para a LLM nunca inventar um shape de dados
alternativo ao contrato real.

## 7. Perguntas em aberto antes de começar

- O ficheiro OpenAPI fonte (`.yaml`/`.json` de onde `openapi.go` foi gerado)
  existe separado? Se sim, gerar os tipos TS a partir dele diretamente é
  mais fiável que reescrever à mão.
- `BuildResponse.yaml` (campo `Yaml *string`) — para que serve no frontend?
  Parece ser export/debug; provavelmente não entra na UI do wizard.
- Persistência: `var/characters/*` são ficheiros — confirmar se o `name` é
  o identificador único (a rota usa `{name}`, não `{id}`) antes de desenhar
  o vault em torno disso.
