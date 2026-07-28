# SPEC-002: Character Builder v2 — Prompt-Aware, Step-by-Step & Content Expansion

**Projeto:** Arcanum D&D  
**Versão:** 1.0  
**Data:** 2026-07-27  
**Status:** Draft  
**Depende de:** SPEC-001 (Event Store Reconstruction) — implementado  

---

## 1. Visão Geral

### 1.1 Problema
O character builder atual tem três falhas críticas:
1. **Não entende prompts em linguagem natural.** Recebe apenas JSON estruturado.
2. **Não valida regras de D&D.** Aceita spells fora da spell list, skills fora do pool, subclasses inexistentes.
3. **Não suporta content além do SRD 5.2.** Kalashtar, Aberrant Heir, e outras fontes (Eberron, Tasha's) não existem.
4. **Wizard step-by-step não tem preview parcial.** Cada step falha se o request está incompleto.

### 1.2 Objetivo
Transformar o character builder em um sistema que:
- Recebe **prompt em linguagem natural** e gera personagem completo
- Suporta **wizard step-by-step** com preview parcial e validação por step
- Valida **todas as regras de D&D 5.5e** (skill pool, spell list, prereqs, multiclass)
- Aceita **content packs customizados** (Eberron, homebrew) via inbox

### 1.3 Escopo
Esta spec cobre:
- Fase A: Content Expansion (content packs customizados)
- Fase B: BuildRequest v2 + validação de regras
- Fase C: Wizard Step-by-Step API
- Fase D: Prompt Parser (LLM integration)
- Fase E: Auto-Selection Engine (spells/skills/equipment coerentes)
- Fase F: Correções críticas do estado atual

---

## 2. Fase A: Content Expansion

### 2.1 Estrutura de Content Packs

Cada content pack é um YAML independente, versionado, com hash SHA-256.

```yaml
# data/content-packs/eberron-species.yaml
id: eberron-species
name: "Eberron: Rising from the Last War — Species"
version: "1.0.0"
license: "Wizards of the Coast"
attribution: "Wizards of the Coast"
dependencies: [srd5.2-core]  # requer SRD como base

species:
  - id: kalashtar
    name: Kalashtar
    size: Medium
    speed:
      walk: 30
    creatureType: humanoid
    traits:
      - kind: GrantSense
        language: Darkvision 60ft
      - kind: Custom
        handlerId: species.kalashtar.dual-mind
      - kind: Custom
        handlerId: species.kalashtar.mental-discipline
      - kind: Custom
        handlerId: species.kalashtar.mind-link
      - kind: Custom
        handlerId: species.kalashtar.severed-from-dreams
    languages: [Common, Quori, Any]
    abilityScoreOptions: [WIS, CHA, Any]  # +2 WIS, +1 CHA (ou any)
```

```yaml
# data/content-packs/eberron-backgrounds.yaml
id: eberron-backgrounds
name: "Eberron Backgrounds"
version: "1.0.0"
dependencies: [srd5.2-core]

backgrounds:
  - id: aberrant-heir
    name: Aberrant Heir
    abilityScoreOptions: [CON, INT, WIS]
    skills: [arcana, insight]
    tools: [calligraphers-supplies]
    feat: magic-initiate-aberrant  # ou um feat custom
    description: |
      You are the heir to a dragonmarked house that has been touched by aberrant dragonmarks...
```

### 2.2 Subclass Data Model

O `classes.yaml` atual não tem subclasses separadas. Adicionar:

```yaml
# data/content-packs/tashas-subclasses.yaml
id: tashas-subclasses
name: "Tasha's Cauldron of Everything — Subclasses"
version: "1.0.0"
dependencies: [srd5.2-core]

subclasses:
  - id: sorcerer-aberrant-mind
    name: Aberrant Mind
    classId: sorcerer
    description: |
      An alien influence has wrapped its tendrils around your mind...
    features:
      - id: subclass.sorcerer.aberrant-mind.psionic-spells
        name: Psionic Spells
        level: 1
        effects:
          - kind: GrantSpells
            spells: [arms-of-hadar, detect-thoughts, calms-emotions, hunger-of-hadar]
            source: psionic
      - id: subclass.sorcerer.aberrant-mind.telepathic-speech
        name: Telepathic Speech
        level: 1
        effects:
          - kind: Custom
            handlerId: subclass.sorcerer.aberrant-mind.telepathic-speech
      - id: subclass.sorcerer.aberrant-mind.psionic-sorcery
        name: Psionic Sorcery
        level: 6
        effects:
          - kind: Custom
            handlerId: subclass.sorcerer.aberrant-mind.psionic-sorcery
      - id: subclass.sorcerer.aberrant-mind.revelation-in-flesh
        name: Revelation in Flesh
        level: 14
      - id: subclass.sorcerer.aberrant-mind.warping-implosion
        name: Warping Implosion
        level: 18
```

### 2.3 Content Pack Loader

```go
package content

type ContentPack struct {
    ID            string
    Name          string
    Version       string
    License       string
    Attribution   string
    Dependencies  []string
    Species       []scontent.Species
    Backgrounds   []scontent.Background
    Subclasses    []scontent.SubClass
    Feats         []scontent.Feat
    Spells        []scontent.Spell
    Items         []scontent.ItemDef
}

// LoadAllFromDataDir agora carrega packs em ordem de dependência
func LoadAllFromDataDir(dir string) (scontent.ResolvedContent, error) {
    // 1. Descobrir todos os packs
    // 2. Ordenar topologicamente por dependencies
    // 3. Merge em ResolvedContent (último pack vence em conflito)
    // 4. Validar: toda referência (classId, spellId) deve existir
}
```

### 2.4 Critérios de Aceitação
- [ ] `data/content-packs/` aceita YAMLs com `dependencies`
- [ ] Loader resolve dependências em ordem topológica
- [ ] Conflitos de ID são resolvidos por "último carregado vence" (override intencional)
- [ ] `ProcessInbox` aceita content packs e move para `data/content-packs/`
- [ ] Kalashtar e Aberrant Heir existem e são carregáveis

---

## 3. Fase B: BuildRequest v2 + Validação de Regras

### 3.1 Novo BuildRequest

```go
type BuildRequest struct {
    Name           string                `json:"name"`
    SpeciesID      types.SpeciesID       `json:"speciesId"`
    SpeciesVariant *string               `json:"speciesVariant,omitempty"`
    BackgroundID   types.BackgroundID    `json:"backgroundId"`
    Classes        []ClassBuildEntry     `json:"classes"`
    Level          int                   `json:"level"`  // total level (sum of classes)
    AbilityScores  types.AbilityScores   `json:"abilityScores"`
    AbilityMethod  string                `json:"abilityMethod"` // "standard-array", "point-buy", "rolled"
    Skills         []SkillChoice         `json:"skills"`  // com source tracking
    Spells         []SpellChoice         `json:"spells"`  // com source tracking
    Feats          []FeatChoice          `json:"feats"`   // com level tracking
    Equipment      []EquipmentChoice     `json:"equipment,omitempty"`
    SubclassChoices []SubclassChoice     `json:"subclassChoices,omitempty"`
}

type ClassBuildEntry struct {
    ID         types.ClassID     `json:"id"`
    Level      int               `json:"level"`
    SubclassID *types.SubClassID `json:"subclassId,omitempty"`
}

type SkillChoice struct {
    Skill  types.Skill `json:"skill"`
    Source string      `json:"source"` // "background", "class", "feat", "species"
}

type SpellChoice struct {
    SpellID types.SpellID `json:"spellId"`
    Source  string        `json:"source"` // "class", "subclass", "feat", "species"
    Level   int           `json:"level,omitempty"` // para prepared vs known
}

type FeatChoice struct {
    FeatID types.FeatID `json:"featId"`
    Level  int          `json:"level"` // em qual nível foi tomado
    ASI    *ASIChoice   `json:"asi,omitempty"` // se for Ability Score Improvement
}

type ASIChoice struct {
    Ability types.AbilityScore `json:"ability"`
    Amount  int                `json:"amount"` // +1 ou +2
}

type EquipmentChoice struct {
    ItemID   types.ItemDefinitionID `json:"itemId"`
    Quantity int                    `json:"quantity"`
    Equipped bool                   `json:"equipped"`
}

type SubclassChoice struct {
    ClassID    types.ClassID    `json:"classId"`
    SubclassID types.SubClassID `json:"subclassId"`
    Level      int              `json:"level"` // nível em que foi escolhida
}
```

### 3.2 Rule Validator

```go
package engine

type BuildValidator struct {
    content scontent.ResolvedContent
}

func (v *BuildValidator) Validate(req BuildRequest) error {
    // 1. Species existe
    if _, ok := v.content.Species[req.SpeciesID]; !ok {
        return fmt.Errorf("invalid species: %s", req.SpeciesID)
    }

    // 2. Background existe
    if _, ok := v.content.Backgrounds[req.BackgroundID]; !ok {
        return fmt.Errorf("invalid background: %s", req.BackgroundID)
    }

    // 3. Classes existem e levels somam corretamente
    totalLevel := 0
    for _, c := range req.Classes {
        cls, ok := v.content.Classes[c.ID]
        if !ok { return fmt.Errorf("invalid class: %s", c.ID) }
        if c.Level < 1 || c.Level > 20 { return fmt.Errorf("class level must be 1-20") }
        if c.SubclassID != nil {
            // Verificar se subclass pertence à classe
            found := false
            for _, sc := range cls.SubClasses {
                if sc.ID == *c.SubclassID { found = true; break }
            }
            if !found { return fmt.Errorf("subclass %s not available for %s", *c.SubclassID, c.ID) }
            // Verificar subclass level
            if c.Level < cls.SubclassLevel {
                return fmt.Errorf("subclass %s requires level %d", *c.SubclassID, cls.SubclassLevel)
            }
        }
        totalLevel += c.Level
    }
    if totalLevel != req.Level {
        return fmt.Errorf("sum of class levels (%d) != total level (%d)", totalLevel, req.Level)
    }
    if req.Level < 1 || req.Level > 20 {
        return fmt.Errorf("level must be 1-20")
    }

    // 4. Multiclass prerequisites
    if len(req.Classes) > 1 {
        for i, c := range req.Classes {
            if i == 0 { continue } // primeira classe não precisa prereq
            cls := v.content.Classes[c.ID]
            for _, ab := range cls.PrimaryAbility {
                if scoreOf(req.AbilityScores, ab) < 13 {
                    return fmt.Errorf("multiclass into %s requires %s >= 13", c.ID, ab)
                }
            }
        }
    }

    // 5. Skill validation
    bg := v.content.Backgrounds[req.BackgroundID]
    bgSkills := make(map[types.Skill]bool)
    for _, s := range bg.Skills { bgSkills[s] = true }

    classSkillPool := make(map[types.Skill]bool)
    for _, c := range req.Classes {
        cls := v.content.Classes[c.ID]
        for _, si := range cls.Proficiencies.Skills {
            for _, sk := range si.From { classSkillPool[sk] = true }
        }
    }

    for _, sk := range req.Skills {
        switch sk.Source {
        case "background":
            if !bgSkills[sk.Skill] {
                return fmt.Errorf("skill %s not in background %s", sk.Skill, req.BackgroundID)
            }
        case "class":
            if !classSkillPool[sk.Skill] {
                return fmt.Errorf("skill %s not in class skill pool", sk.Skill)
            }
        }
    }

    // 6. Spell validation
    for _, sp := range req.Spells {
        spell, ok := v.content.Spells[sp.SpellID]
        if !ok { return fmt.Errorf("invalid spell: %s", sp.SpellID) }

        // Verificar se a classe pode aprender esse spell
        canLearn := false
        for _, c := range req.Classes {
            cls := v.content.Classes[c.ID]
            if cls.Spellcasting == nil { continue }
            // Verificar spell list da classe
            for _, lvl := range cls.Levels {
                if lvl.Level == c.Level {
                    for _, sid := range lvl.Spells {
                        if sid == sp.SpellID { canLearn = true; break }
                    }
                }
            }
            // Verificar subclass spell list
            if c.SubclassID != nil {
                for _, sc := range cls.SubClasses {
                    if sc.ID == *c.SubclassID {
                        for _, f := range sc.Features {
                            // Verificar se feature granta spell
                            for _, eff := range f.Effects {
                                if eff.Kind == "GrantSpells" {
                                    for _, granted := range eff.Spells {
                                        if granted == sp.SpellID { canLearn = true }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        if !canLearn && sp.Source != "feat" && sp.Source != "species" {
            return fmt.Errorf("spell %s not available to any class", sp.SpellID)
        }

        // Verificar spell level vs character level
        if spell.Level > 0 {
            maxSpellLevel := (req.Level + 1) / 2
            if req.Level >= 17 { maxSpellLevel = 9 }
            if int(spell.Level) > maxSpellLevel {
                return fmt.Errorf("spell %s is level %d, max for level %d is %d", 
                    sp.SpellID, spell.Level, req.Level, maxSpellLevel)
            }
        }
    }

    // 7. Ability scores validation
    switch req.AbilityMethod {
    case "standard-array":
        scores := []int{req.AbilityScores.STR, req.AbilityScores.DEX, req.AbilityScores.CON,
            req.AbilityScores.INT, req.AbilityScores.WIS, req.AbilityScores.CHA}
        if !isPermutation(scores, []int{15, 14, 13, 12, 10, 8}) {
            return fmt.Errorf("standard array must be permutation of 15,14,13,12,10,8")
        }
    case "point-buy":
        cost := pointBuyCost(req.AbilityScores)
        if cost != 27 {
            return fmt.Errorf("point buy must equal 27 points, got %d", cost)
        }
    }

    return nil
}
```

### 3.3 Event Generation Correto para Level > 1

```go
func (e *Engine) BuildCharacterEvents(req BuildRequest) ([]events.Event, error) {
    var evts []events.Event

    // 1. CharacterCreatedEvent (nível 1 da primeira classe)
    primaryClass := req.Classes[0]
    hp := computeHP(primaryClass.ID, req.AbilityScores.CON, 1, e.content)

    created := events.CharacterCreatedEvent{
        CharacterID:   types.NewCharacterID(),
        Name:          req.Name,
        SpeciesID:     req.SpeciesID,
        SpeciesVariant: req.SpeciesVariant,
        BackgroundID:  req.BackgroundID,
        Classes:       []events.ClassEntry{{ClassID: primaryClass.ID, Level: 1}},
        Level:         1,
        AbilityScores: req.AbilityScores,
        MaxHP:         hp,
        SavingThrows:  e.content.Classes[primaryClass.ID].SavingThrows,
        Skills:        filterSkillsByLevel(req.Skills, 1),
        Spells:        filterSpellsByLevel(req.Spells, 1),
        Feats:         filterFeatsByLevel(req.Feats, 1),
        AbilityMethod: req.AbilityMethod,
    }
    evts = append(evts, &created)

    // 2. CharacterLeveledUpEvent para níveis 2 até total
    currentLevel := 1
    currentClassIdx := 0
    classProgress := make(map[types.ClassID]int)
    classProgress[primaryClass.ID] = 1

    for currentLevel < req.Level {
        currentLevel++

        // Determinar qual classe ganha o nível
        // Para single-class: sempre a mesma
        // Para multiclass: distribuição round-robin ou especificada
        var leveledClass types.ClassID
        if len(req.Classes) == 1 {
            leveledClass = req.Classes[0].ID
        } else {
            // Lógica: encontrar classe com menor progresso relativo
            leveledClass = determineNextClassLevel(req.Classes, classProgress)
        }
        classProgress[leveledClass]++

        hpGain := computeHPGain(leveledClass, req.AbilityScores.CON, e.content, e.rng)

        lvlEvt := events.CharacterLeveledUpEvent{
            CharacterID: created.CharacterID,
            ClassID:       leveledClass,
            NewLevel:      classProgress[leveledClass],
            HPGained:      hpGain,
        }

        // Se atingiu subclass level, incluir SubclassChosenEvent
        cls := e.content.Classes[leveledClass]
        if classProgress[leveledClass] == cls.SubclassLevel {
            for _, sc := range req.SubclassChoices {
                if sc.ClassID == leveledClass {
                    lvlEvt.SubclassChoice = &sc.SubclassID
                    evts = append(evts, &events.SubclassChosenEvent{
                        CharacterID: created.CharacterID,
                        ClassID:     leveledClass,
                        SubclassID:  sc.SubclassID,
                        Level:       currentLevel,
                    })
                }
            }
        }

        // Se ASI/Feat level, incluir FeatTakenEvent
        if isASILevel(cls, classProgress[leveledClass]) {
            for _, f := range req.Feats {
                if f.Level == currentLevel {
                    evts = append(evts, &events.FeatTakenEvent{
                        CharacterID: created.CharacterID,
                        FeatID:      f.FeatID,
                        Level:       currentLevel,
                    })
                }
            }
        }

        evts = append(evts, &lvlEvt)
    }

    // 3. ItemAcquiredEvent para equipment inicial
    for _, eq := range req.Equipment {
        evts = append(evts, &events.ItemAcquiredEvent{
            CharacterID: created.CharacterID,
            InstanceID:    types.NewItemInstanceID(),
            ItemID:        eq.ItemID,
            Quantity:      eq.Quantity,
        })
        if eq.Equipped {
            evts = append(evts, &events.ItemEquippedEvent{
                CharacterID: created.CharacterID,
                InstanceID:    types.NewItemInstanceID(), // mesma instance
            })
        }
    }

    return evts, nil
}
```

### 3.4 Critérios de Aceitação
- [ ] `BuildRequest` aceita `SubclassID` por classe
- [ ] `BuildRequest` aceita `Equipment`
- [ ] `BuildValidator` rejeita skills fora do pool
- [ ] `BuildValidator` rejeita spells fora da spell list
- [ ] `BuildValidator` rejeita multiclass sem prereqs (ability >= 13)
- [ ] `BuildValidator` valida standard array e point buy
- [ ] `BuildCharacterEvents` gera `CharacterCreatedEvent` + N `CharacterLeveledUpEvent`
- [ ] `BuildCharacterEvents` gera `SubclassChosenEvent` no nível correto
- [ ] `BuildCharacterEvents` gera `FeatTakenEvent` nos níveis de ASI

---

## 4. Fase C: Wizard Step-by-Step API

### 4.1 Endpoints por Step

```
POST /api/build/step/validate  → Valida dados parciais, retorna erros
POST /api/build/step/preview   → Retorna CharacterSheet preview (sem persistir)
POST /api/build/step/commit    → Persiste evento(s) no campaign
POST /api/build/finalize       → Valida tudo e persiste personagem completo
```

### 4.2 Step State Machine

```go
package wizard

type Step string

const (
    StepSpecies     Step = "species"
    StepBackground  Step = "background"
    StepClass       Step = "class"
    StepSubclass    Step = "subclass"
    StepScores      Step = "scores"
    StepSkills      Step = "skills"
    StepSpells      Step = "spells"
    StepFeats       Step = "feats"
    StepEquipment   Step = "equipment"
    StepReview      Step = "review"
)

type WizardState struct {
    SessionID    string
    CurrentStep  Step
    Draft        BuildRequest
    Validated    map[Step]bool
    Preview      *derive.CharacterSheet
}
```

### 4.3 Validação Parcial

```go
func (v *BuildValidator) ValidateStep(step Step, draft BuildRequest) error {
    switch step {
    case StepSpecies:
        if draft.SpeciesID == "" { return errors.New("species required") }
        if _, ok := v.content.Species[draft.SpeciesID]; !ok {
            return fmt.Errorf("invalid species: %s", draft.SpeciesID)
        }
        // Validar variant
        if draft.SpeciesVariant != nil {
            sp := v.content.Species[draft.SpeciesID]
            found := false
            for _, v := range sp.Variants {
                if v.ID == *draft.SpeciesVariant { found = true; break }
            }
            if !found { return fmt.Errorf("invalid variant: %s", *draft.SpeciesVariant) }
        }

    case StepBackground:
        if draft.BackgroundID == "" { return errors.New("background required") }
        if _, ok := v.content.Backgrounds[draft.BackgroundID]; !ok {
            return fmt.Errorf("invalid background: %s", draft.BackgroundID)
        }

    case StepClass:
        if len(draft.Classes) == 0 { return errors.New("at least one class required") }
        for _, c := range draft.Classes {
            if _, ok := v.content.Classes[c.ID]; !ok {
                return fmt.Errorf("invalid class: %s", c.ID)
            }
        }

    case StepSubclass:
        for _, c := range draft.Classes {
            if c.SubclassID != nil {
                cls := v.content.Classes[c.ID]
                if c.Level < cls.SubclassLevel {
                    return fmt.Errorf("subclass requires level %d", cls.SubclassLevel)
                }
            }
        }

    case StepScores:
        if draft.AbilityMethod == "" { draft.AbilityMethod = "standard-array" }
        switch draft.AbilityMethod {
        case "standard-array":
            scores := []int{draft.AbilityScores.STR, draft.AbilityScores.DEX, draft.AbilityScores.CON,
                draft.AbilityScores.INT, draft.AbilityScores.WIS, draft.AbilityScores.CHA}
            if !isPermutation(scores, []int{15, 14, 13, 12, 10, 8}) {
                return errors.New("standard array must be 15,14,13,12,10,8")
            }
        case "point-buy":
            if pointBuyCost(draft.AbilityScores) != 27 {
                return errors.New("point buy must equal 27")
            }
        }

    case StepSkills:
        // Validar contra pools
        return v.validateSkillsPartial(draft)

    case StepSpells:
        return v.validateSpellsPartial(draft)
    }
    return nil
}
```

### 4.4 Preview Parcial

```go
func (e *Engine) PreviewPartial(draft BuildRequest, step Step) (*derive.CharacterSheet, error) {
    // Criar um personagem "fake" com dados disponíveis até o step atual
    // Não persiste no event store — apenas deriva para preview

    char := runtime.Character{
        Name:          draft.Name,
        Species:       draft.SpeciesID,
        Background:    draft.BackgroundID,
        AbilityScores: draft.AbilityScores,
    }

    // Aplicar o que já foi escolhido
    if len(draft.Classes) > 0 {
        char.Classes = []runtime.ClassEnrollment{
            {ClassID: draft.Classes[0].ID, Level: 1},
        }
    }

    sheet := derive.BuildCharacterSheet(char, e.content)
    return &sheet, nil
}
```

### 4.5 Critérios de Aceitação
- [ ] `POST /api/build/step/validate` aceita dados parciais e retorna erros específicos do step
- [ ] `POST /api/build/step/preview` retorna `CharacterSheet` sem persistir
- [ ] Wizard no frontend pode navegar entre steps sem perder dados
- [ ] Step review mostra resumo completo antes de `finalize`
- [ ] `finalize` gera eventos corretos e persiste no campaign

---

## 5. Fase D: Prompt Parser (LLM Integration)

### 5.1 Arquitetura

```
Prompt (texto livre)
    ↓
[LLM Client] → Structured extraction (JSON)
    ↓
[Prompt Mapper] → BuildRequest v2
    ↓
[Auto-Selector] → Preenche spells/skills/equipment
    ↓
[Validator] → Valida regras
    ↓
[Event Generator] → []Event
    ↓
[Engine.Commit] → Persiste
```

### 5.2 LLM Prompt Template

```go
const promptTemplate = `
You are a D&D 5.5e character builder assistant. Extract character build parameters from the user's request.

Available content:
{{.ContentSummary}}

Rules:
- Species must be from the available list.
- Classes must be from the available list.
- Subclasses must match the class.
- Backgrounds must be from the available list.
- Ability scores: if "standard array", use [15,14,13,12,10,8]. If "point buy", distribute 27 points. If "rolled", use average [16,14,13,12,10,8].
- Skills must be from the class skill pool + background skills.
- Spells must be from the class spell list + subclass spells.
- Equipment should be basic starting equipment for the class.

User request: {{.UserPrompt}}

Respond ONLY with valid JSON matching this schema:
{
  "name": "string",
  "speciesId": "string",
  "speciesVariant": "string or null",
  "backgroundId": "string",
  "classes": [{"id": "string", "level": int, "subclassId": "string or null"}],
  "level": int,
  "abilityMethod": "standard-array|point-buy|rolled",
  "abilityScores": {"STR": int, "DEX": int, "CON": int, "INT": int, "WIS": int, "CHA": int},
  "skills": [{"skill": "string", "source": "background|class|feat|species"}],
  "spells": [{"spellId": "string", "source": "class|subclass|feat", "level": int}],
  "feats": [{"featId": "string", "level": int}],
  "equipment": [{"itemId": "string", "quantity": int, "equipped": bool}],
  "subclassChoices": [{"classId": "string", "subclassId": "string", "level": int}]
}

If the request is ambiguous, make reasonable choices that fit the character concept.
If a requested element doesn't exist in the available content, use the closest match and note it.
`
```

### 5.3 Content Summary para LLM

```go
func (c *scontent.ResolvedContent) ToLLMSummary() string {
    var b strings.Builder
    b.WriteString("Species: ")
    for id, sp := range c.Species { b.WriteString(string(id)); b.WriteString(", ") }
    b.WriteString("\nClasses: ")
    for id, cls := range c.Classes {
        b.WriteString(fmt.Sprintf("%s (subclasses: ", id))
        for _, sc := range cls.SubClasses { b.WriteString(string(sc.ID)); b.WriteString(", ") }
        b.WriteString("), ")
    }
    b.WriteString("\nBackgrounds: ")
    for id := range c.Backgrounds { b.WriteString(string(id)); b.WriteString(", ") }
    return b.String()
}
```

### 5.4 Mapper: LLM Output → BuildRequest

```go
package prompt

func MapLLMOutput(raw json.RawMessage, content scontent.ResolvedContent) (engine.BuildRequest, error) {
    var extracted struct {
        Name            string `json:"name"`
        SpeciesID       string `json:"speciesId"`
        SpeciesVariant  *string `json:"speciesVariant"`
        BackgroundID    string `json:"backgroundId"`
        Classes         []struct {
            ID         string `json:"id"`
            Level      int    `json:"level"`
            SubclassID *string `json:"subclassId"`
        } `json:"classes"`
        Level           int `json:"level"`
        AbilityMethod   string `json:"abilityMethod"`
        AbilityScores   map[string]int `json:"abilityScores"`
        Skills          []struct {
            Skill  string `json:"skill"`
            Source string `json:"source"`
        } `json:"skills"`
        Spells          []struct {
            SpellID string `json:"spellId"`
            Source  string `json:"source"`
            Level   int    `json:"level"`
        } `json:"spells"`
        Feats           []struct {
            FeatID string `json:"featId"`
            Level  int    `json:"level"`
        } `json:"feats"`
        Equipment       []struct {
            ItemID   string `json:"itemId"`
            Quantity int    `json:"quantity"`
            Equipped bool   `json:"equipped"`
        } `json:"equipment"`
        SubclassChoices []struct {
            ClassID    string `json:"classId"`
            SubclassID string `json:"subclassId"`
            Level      int    `json:"level"`
        } `json:"subclassChoices"`
    }

    if err := json.Unmarshal(raw, &extracted); err != nil {
        return engine.BuildRequest{}, fmt.Errorf("parse LLM output: %w", err)
    }

    // Mapear para BuildRequest v2
    req := engine.BuildRequest{
        Name:           extracted.Name,
        SpeciesID:      types.SpeciesID(extracted.SpeciesID),
        SpeciesVariant: extracted.SpeciesVariant,
        BackgroundID:   types.BackgroundID(extracted.BackgroundID),
        Level:          extracted.Level,
        AbilityMethod:  extracted.AbilityMethod,
    }

    // Mapear ability scores
    req.AbilityScores = types.AbilityScores{
        STR: extracted.AbilityScores["STR"],
        DEX: extracted.AbilityScores["DEX"],
        CON: extracted.AbilityScores["CON"],
        INT: extracted.AbilityScores["INT"],
        WIS: extracted.AbilityScores["WIS"],
        CHA: extracted.AbilityScores["CHA"],
    }

    // Mapear classes
    for _, c := range extracted.Classes {
        entry := engine.ClassBuildEntry{
            ID:    types.ClassID(c.ID),
            Level: c.Level,
        }
        if c.SubclassID != nil {
            sid := types.SubClassID(*c.SubclassID)
            entry.SubclassID = &sid
        }
        req.Classes = append(req.Classes, entry)
    }

    // Mapear skills
    for _, s := range extracted.Skills {
        req.Skills = append(req.Skills, engine.SkillChoice{
            Skill:  types.Skill(s.Skill),
            Source: s.Source,
        })
    }

    // Mapear spells
    for _, s := range extracted.Spells {
        req.Spells = append(req.Spells, engine.SpellChoice{
            SpellID: types.SpellID(s.SpellID),
            Source:  s.Source,
            Level:   s.Level,
        })
    }

    // Mapear feats
    for _, f := range extracted.Feats {
        req.Feats = append(req.Feats, engine.FeatChoice{
            FeatID: types.FeatID(f.FeatID),
            Level:  f.Level,
        })
    }

    // Mapear equipment
    for _, eq := range extracted.Equipment {
        req.Equipment = append(req.Equipment, engine.EquipmentChoice{
            ItemID:   types.ItemDefinitionID(eq.ItemID),
            Quantity: eq.Quantity,
            Equipped: eq.Equipped,
        })
    }

    // Mapear subclass choices
    for _, sc := range extracted.SubclassChoices {
        req.SubclassChoices = append(req.SubclassChoices, engine.SubclassChoice{
            ClassID:    types.ClassID(sc.ClassID),
            SubclassID: types.SubClassID(sc.SubclassID),
            Level:      sc.Level,
        })
    }

    return req, nil
}
```

### 5.5 Endpoint

```go
// POST /api/build/prompt
func (s *Server) handleBuildPrompt(w http.ResponseWriter, r *http.Request) {
    var req struct {
        Prompt string `json:"prompt"`
    }
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }

    // 1. Chamar LLM
    llmOutput, err := s.llmClient.ExtractBuild(req.Prompt, s.content.ToLLMSummary())
    if err != nil {
        http.Error(w, fmt.Sprintf("LLM extraction failed: %v", err), http.StatusInternalServerError)
        return
    }

    // 2. Mapear para BuildRequest
    buildReq, err := prompt.MapLLMOutput(llmOutput, s.content)
    if err != nil {
        http.Error(w, fmt.Sprintf("Mapping failed: %v", err), http.StatusInternalServerError)
        return
    }

    // 3. Auto-selecionar o que falta
    buildReq = s.autoSelector.FillDefaults(buildReq, s.content)

    // 4. Validar
    if err := s.validator.Validate(buildReq); err != nil {
        http.Error(w, fmt.Sprintf("Validation failed: %v", err), http.StatusBadRequest)
        return
    }

    // 5. Gerar eventos
    evts, err := s.engine.BuildCharacterEvents(buildReq)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    // 6. Commit
    ctx := r.Context()
    newCampaign, err := s.engine.Commit(ctx, s.campaign, evts)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    s.campaign = newCampaign

    // 7. Retornar YAML
    charID := evts[0].(*events.CharacterCreatedEvent).CharacterID
    char := s.campaign.State.Characters[charID]
    sheet := derive.BuildCharacterSheet(*char, s.content)
    yamlBytes, _ := yaml.Marshal(sheet)

    writeJSON(w, map[string]interface{}{
        "characterId": charID,
        "sheet": sheet,
        "yaml": string(yamlBytes),
        "eventsGenerated": len(evts),
    })
}
```

### 5.6 Critérios de Aceitação
- [ ] `POST /api/build/prompt` aceita `{"prompt": "..."}`
- [ ] LLM extrai entidades (species, class, subclass, background, level)
- [ ] Mapper converte LLM output para `BuildRequest` válido
- [ ] Auto-selector preenche gaps (spells, skills, equipment)
- [ ] Validação rejeita builds inválidos mesmo se LLM sugerir
- [ ] Resposta inclui `yaml` do personagem completo

---

## 6. Fase E: Auto-Selection Engine

### 6.1 Conceito

Dado um `BuildRequest` incompleto (sem spells, skills ou equipment), o engine preenche automaticamente com escolhas coerentes ao conceito.

### 6.2 Spell Themes

```go
package auto

var SpellThemes = map[string][]types.SpellID{
    "aberration": {
        "mind-sliver", "arms-of-hadar", "dissonant-whispers", 
        "detect-thoughts", "tasha-mind-whip", "hunger-of-hadar",
        "sending", "summon-aberration", "telekinesis", "warp-sense",
    },
    "psychic": {
        "mind-sliver", "message", "detect-thoughts", "tasha-mind-whip",
        "sending", "telekinesis", "dominate-person", "feeblemind",
    },
    "fire": {
        "fire-bolt", "burning-hands", "scorching-ray", "fireball",
        "wall-of-fire", "immolation", "fire-storm", "incendiary-cloud",
    },
    "healing": {
        "spare-the-dying", "healing-word", "prayer-of-healing", 
        "mass-healing-word", "revivify", "greater-restoration",
    },
    "stealth": {
        "minor-illusion", "disguise-self", "invisibility", "silence",
        "nondetection", "greater-invisibility", "mislead",
    },
}

func DetectTheme(prompt string) []string {
    lower := strings.ToLower(prompt)
    themes := []string{}
    if strings.Contains(lower, "aberrant") || strings.Contains(lower, "aberra") {
        themes = append(themes, "aberration")
    }
    if strings.Contains(lower, "psychic") || strings.Contains(lower, "mind") {
        themes = append(themes, "psychic")
    }
    if strings.Contains(lower, "fire") || strings.Contains(lower, "flame") {
        themes = append(themes, "fire")
    }
    if strings.Contains(lower, "heal") || strings.Contains(lower, "cleric") {
        themes = append(themes, "healing")
    }
    if strings.Contains(lower, "stealth") || strings.Contains(lower, "rogue") {
        themes = append(themes, "stealth")
    }
    return themes
}
```

### 6.3 Auto-Select Spells

```go
func (a *AutoSelector) SelectSpells(req *engine.BuildRequest, content scontent.ResolvedContent) {
    themes := DetectTheme(req.Name + " " + string(req.Classes[0].ID))

    for _, c := range req.Classes {
        cls := content.Classes[c.ID]
        if cls.Spellcasting == nil { continue }

        // Determinar quantos spells o personagem deve ter
        maxCantrips, maxKnown := a.getSpellLimits(c.ID, c.Level, content)

        // Cantrips: priorizar temas
        selectedCantrips := a.pickThemedSpells(
            a.getAvailableCantrips(c.ID, content), 
            themes, maxCantrips,
        )
        for _, sp := range selectedCantrips {
            req.Spells = append(req.Spells, engine.SpellChoice{
                SpellID: sp, Source: "class", Level: 0,
            })
        }

        // Leveled spells: priorizar temas, depois utilidade
        available := a.getAvailableSpells(c.ID, c.Level, content)
        selected := a.pickThemedSpells(available, themes, maxKnown)

        // Preencher restante com utilidade (shield, misty-step, etc.)
        utility := []types.SpellID{"shield", "absorb-elements", "misty-step", "counterspell"}
        for _, sp := range utility {
            if len(selected) >= maxKnown { break }
            if a.canLearn(spellID, c.ID, content) && !a.hasSpell(selected, sp) {
                selected = append(selected, sp)
            }
        }

        for _, sp := range selected {
            spell := content.Spells[sp]
            req.Spells = append(req.Spells, engine.SpellChoice{
                SpellID: sp, Source: "class", Level: int(spell.Level),
            })
        }
    }
}
```

### 6.4 Auto-Select Skills

```go
func (a *AutoSelector) SelectSkills(req *engine.BuildRequest, content scontent.ResolvedContent) {
    bg := content.Backgrounds[req.BackgroundID]

    // Background skills (automático)
    for _, sk := range bg.Skills {
        req.Skills = append(req.Skills, engine.SkillChoice{
            Skill: sk, Source: "background",
        })
    }

    // Class skills: priorizar coerência com classe
    for _, c := range req.Classes {
        cls := content.Classes[c.ID]
        pool := cls.Proficiencies.Skills

        // Prioridades por classe
        priority := a.classSkillPriority(c.ID)

        for _, si := range pool {
            selected := 0
            for _, sk := range si.From {
                if selected >= si.Choose { break }
                if a.hasSkill(req.Skills, sk) { continue }

                // Priorizar skills da lista de prioridade
                score := a.scoreSkill(sk, priority, req)
                if score > 0 {
                    req.Skills = append(req.Skills, engine.SkillChoice{
                        Skill: sk, Source: "class",
                    })
                    selected++
                }
            }
        }
    }
}

func (a *AutoSelector) classSkillPriority(classID types.ClassID) []types.Skill {
    switch classID {
    case "sorcerer":
        return []types.Skill{types.SkillArcana, types.SkillPersuasion, types.SkillDeception, types.SkillInsight}
    case "wizard":
        return []types.Skill{types.SkillArcana, types.SkillHistory, types.SkillInvestigation, types.SkillInsight}
    case "rogue":
        return []types.Skill{types.SkillStealth, types.SkillSleightOfHand, types.SkillAcrobatics, types.SkillPerception}
    // ... etc
    }
    return nil
}
```

### 6.5 Auto-Select Equipment

```go
func (a *AutoSelector) SelectEquipment(req *engine.BuildRequest, content scontent.ResolvedContent) {
    for _, c := range req.Classes {
        cls := content.Classes[c.ID]

        // Equipment básico por classe
        switch c.ID {
        case "sorcerer":
            req.Equipment = append(req.Equipment,
                engine.EquipmentChoice{ItemID: "light-crossbow", Quantity: 1, Equipped: true},
                engine.EquipmentChoice{ItemID: "bolt-case", Quantity: 20, Equipped: false},
                engine.EquipmentChoice{ItemID: "component-pouch", Quantity: 1, Equipped: false},
                engine.EquipmentChoice{ItemID: "dungeoneers-pack", Quantity: 1, Equipped: false},
                engine.EquipmentChoice{ItemID: "dagger", Quantity: 2, Equipped: true},
            )
        case "fighter":
            req.Equipment = append(req.Equipment,
                engine.EquipmentChoice{ItemID: "chain-mail", Quantity: 1, Equipped: true},
                engine.EquipmentChoice{ItemID: "longsword", Quantity: 1, Equipped: true},
                engine.EquipmentChoice{ItemID: "shield", Quantity: 1, Equipped: true},
                engine.EquipmentChoice{ItemID: "explorers-pack", Quantity: 1, Equipped: false},
            )
        }
    }
}
```

### 6.6 Critérios de Aceitação
- [ ] `AutoSelector.FillDefaults` preenche spells faltantes com base no tema
- [ ] Skills são escolhidas por prioridade de classe
- [ ] Equipment é escolhido por classe
- [ ] Nunca sobrescreve escolhas explícitas do usuário
- [ ] Respeita limites (max spells known, max skill choices)

---

## 7. Fase F: Correções Críticas do Estado Atual

### 7.1 Fix: SnapshotStore.Load retorna runtime.CampaignState

```go
func (s *sqliteSnapshotStore) Load(ctx context.Context, aggregateID string) (interface{}, int, error) {
    var stateJSON []byte
    var version int
    err := s.db.QueryRowContext(ctx, `
        SELECT state, version FROM snapshots WHERE aggregate_id = ?
    `, aggregateID).Scan(&stateJSON, &version)
    if err == sql.ErrNoRows {
        return nil, 0, nil
    }
    if err != nil {
        return nil, 0, err
    }

    var state runtime.CampaignState
    if err := json.Unmarshal(stateJSON, &state); err != nil {
        return nil, 0, fmt.Errorf("unmarshal snapshot: %w", err)
    }

    return state, version, nil
}
```

### 7.2 Fix: computeAC considera equipamento

```go
func computeAC(char runtime.Character, scores types.AbilityScores, content scontent.ResolvedContent) int {
    baseAC := 10 + abilityModifier(scores.DEX)

    // Verificar armadura equipada
    for _, item := range char.Items {
        if !item.Equipped { continue }
        def, ok := content.Items[item.DefinitionID]
        if !ok { continue }

        switch def.Type {
        case "light-armor":
            // Leather: 11+DEX, Studded: 12+DEX
            if def.ACBonus > 0 {
                return def.ACBonus + abilityModifier(scores.DEX)
            }
        case "medium-armor":
            // Max DEX +2
            dexMod := abilityModifier(scores.DEX)
            if dexMod > 2 { dexMod = 2 }
            if def.ACBonus > 0 {
                return def.ACBonus + dexMod
            }
        case "heavy-armor":
            // Sem DEX
            if def.ACBonus > 0 {
                return def.ACBonus
            }
        case "shield":
            baseAC += 2
        }
    }

    // Verificar spells ativos (Mage Armor: 13+DEX)
    for _, cond := range char.Conditions {
        if cond.ConditionID == "mage-armor" {
            mageAC := 13 + abilityModifier(scores.DEX)
            if mageAC > baseAC { baseAC = mageAC }
        }
    }

    return baseAC
}
```

### 7.3 Fix: Projections populadas no Commit

```go
func (e *Engine) Commit(ctx context.Context, campaign Campaign, evts []events.Event) (Campaign, error) {
    // ... persistir eventos ...
    // ... aplicar ao estado ...

    // Atualizar projections
    for _, evt := range evts {
        switch e := evt.(type) {
        case *events.CharacterCreatedEvent:
            e.projectionHandler.OnCharacterCreated(ctx, e)
        case *events.DamageAppliedEvent:
            e.projectionHandler.OnDamageApplied(ctx, e)
        // ... etc
        }
    }

    return newCampaign, nil
}
```

### 7.4 Fix: Remover SavedCharacter YAML paralelo

```go
// Deprecar handleSaveCharacter, handleGetCharacter, handleListCharacters
// Substituir por:
// GET /api/characters/{id} → lê da projection character_sheets
// POST /api/characters/{id} → não existe mais; personagens são criados via /api/build
```

### 7.5 Critérios de Aceitação
- [ ] Snapshot recovery funciona (state é `runtime.CampaignState`, não `map[string]interface{}`)
- [ ] AC considera armadura equipada e spells ativos
- [ ] `character_sheets` projection é populada no Commit
- [ ] YAML filesystem é removido; todos os endpoints usam event store + projections

---

## 8. API Endpoints — Resumo

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/build/prompt` | Cria personagem a partir de prompt em linguagem natural |
| POST | `/api/build/step/validate` | Valida dados parciais de um step do wizard |
| POST | `/api/build/step/preview` | Retorna preview do character sheet (sem persistir) |
| POST | `/api/build/step/commit` | Persiste progresso do wizard no campaign |
| POST | `/api/build/finalize` | Valida build completo e persiste eventos finais |
| POST | `/api/build` | **(deprecated)** Mantido para compatibilidade; redireciona para finalize |
| GET | `/api/characters` | Lista personagens da campanha (da projection) |
| GET | `/api/characters/{id}` | Retorna personagem por ID (da projection) |
| DELETE | `/api/characters/{id}` | Remove personagem (emite evento de deleção) |

---

## 9. Estimativa

| Fase | Duração | Complexidade |
|------|---------|-------------|
| A. Content Expansion | 2-3 dias | Média |
| B. BuildRequest v2 + Validator | 3-4 dias | Alta |
| C. Wizard Step-by-Step API | 2-3 dias | Média |
| D. Prompt Parser (LLM) | 2-3 dias | Média |
| E. Auto-Selection Engine | 2-3 dias | Média |
| F. Correções Críticas | 1-2 dias | Baixa |
| **Total** | **12-18 dias** | |

---

## 10. Definition of Done

- [ ] Prompt "Kalashtar, 6th level, sorcerer aberrante, background aberrant heir" gera YAML válido
- [ ] Wizard step-by-step permite preview em cada step sem erro
- [ ] Validação rejeita spells fora da spell list
- [ ] Validação rejeita skills fora do pool
- [ ] Validação rejeita multiclass sem prereqs
- [ ] Event store contém `CharacterCreatedEvent` + 5x `CharacterLeveledUpEvent` para nível 6
- [ ] Restart do servidor recupera personagem corretamente
- [ ] Snapshot recovery funciona (não faz replay completo)
- [ ] AC considera armadura equipada
- [ ] `data/characters/*.yaml` não é mais usado

---

## 11. Apêndice: Estrutura de Diretórios Final

```
internal/
├── content/
│   ├── loader.go              # Carrega content packs com dependencies
│   └── packs/                 # (novo) Lógica de merge e validação
├── engine/
│   ├── engine.go
│   ├── commit.go
│   ├── restore.go
│   ├── apply.go
│   ├── derive/
│   ├── validator.go           # (novo) BuildValidator
│   ├── builder.go             # (novo) BuildCharacterEvents
│   └── planner.go             # (novo) Wizard state machine
├── auto/                      # (novo)
│   ├── selector.go            # AutoSelector
│   ├── spells.go              # Spell themes e seleção
│   ├── skills.go              # Skill priority e seleção
│   └── equipment.go           # Equipment básico por classe
├── prompt/                    # (novo)
│   ├── client.go              # LLM client interface
│   ├── openai.go              # Implementação OpenAI
│   ├── mapper.go              # LLM output → BuildRequest
│   └── template.go            # Prompt templates
├── api/
│   └── server.go              # Handlers atualizados
└── database/
    ├── projections/
    │   ├── character.go       # Projection handlers
    │   └── campaign.go
    └── ...

data/
├── content-packs/             # (novo)
│   ├── srd5.2-species.yaml
│   ├── srd5.2-backgrounds.yaml
│   ├── srd5.2-classes.yaml
│   ├── eberron-species.yaml
│   ├── eberron-backgrounds.yaml
│   └── tashas-subclasses.yaml
└── characters/                # (remover — migrar para event store)
```
