package runtime

import "github.com/hadnu/arcanum/internal/types"

type HP struct {
	Current  int `json:"current" validate:"min=0"`
	Max      int `json:"max" validate:"min=1"`
	Temp     int `json:"temp,omitempty"`
}

type DeathSaves struct {
	Successes int `json:"successes" validate:"min=0,max=3"`
	Failures  int `json:"failures" validate:"min=0,max=3"`
}

type ClassEnrollment struct {
	ClassID    types.ClassID     `json:"classId" validate:"required"`
	SubClassID *types.SubClassID `json:"subClassId,omitempty"`
	Level      int               `json:"level" validate:"min=1,max=20"`
}

type PreparedSpellEntry struct {
	SpellID types.SpellID `json:"spellId" validate:"required"`
	ClassID types.ClassID `json:"classId" validate:"required"`
}

type ActiveConcentration struct {
	SpellID   types.SpellID `json:"spellId" validate:"required"`
	CastLevel int           `json:"castLevel" validate:"min=1,max=9"`
}

type AppliedCondition struct {
	ConditionID types.ConditionID `json:"conditionId" validate:"required"`
	SourceID    string            `json:"sourceId,omitempty"`
	DC          *int              `json:"dc,omitempty"`
	Duration    *string           `json:"duration,omitempty"`
}

type ResourceState struct {
	ResourceID string `json:"resourceId" validate:"required"`
	Current    int    `json:"current" validate:"min=0"`
	Max        int    `json:"max" validate:"min=0"`
}

type ItemInstance struct {
	InstanceID   types.ItemInstanceID   `json:"instanceId" validate:"required"`
	DefinitionID types.ItemDefinitionID `json:"definitionId" validate:"required"`
	Quantity     int                    `json:"quantity" validate:"min=1"`
	Attuned      bool                   `json:"attuned,omitempty"`
}

type PendingChoice struct {
	ChoiceID    string               `json:"choiceId" validate:"required"`
	CharacterID types.CharacterID    `json:"characterId" validate:"required"`
	Options     []types.ChoiceOption `json:"options" validate:"required,min=1"`
	SourceType  string               `json:"sourceType,omitempty"`
	SourceID    string               `json:"sourceId,omitempty"`
}

type Character struct {
	ID         types.CharacterID  `json:"id" validate:"required"`
	Name       string             `json:"name" validate:"required"`
	Species    types.SpeciesID    `json:"species" validate:"required"`
	Background types.BackgroundID `json:"background,omitempty"`
	Classes    []ClassEnrollment  `json:"classes" validate:"required,min=1"`
	Level      int                `json:"level" validate:"min=1,max=20"`

	AbilityScores   types.AbilityScores        `json:"abilityScores" validate:"required"`
	BackgroundASI   map[types.AbilityScore]int `json:"backgroundASI,omitempty"`
	HP              HP                         `json:"hp" validate:"required"`
	TempHP          int                        `json:"tempHP,omitempty"`
	DeathSaves      DeathSaves                 `json:"deathSaves,omitempty"`
	ExhaustionLevel int                        `json:"exhaustionLevel" validate:"min=0,max=6"`

	PreparedSpells      []PreparedSpellEntry `json:"preparedSpells,omitempty"`
	KnownCantrips       []PreparedSpellEntry `json:"knownCantrips,omitempty"`
	SpellSlotsUsed      map[int]int          `json:"spellSlotsUsed,omitempty"`
	WarlockSlotsUsed    int                  `json:"warlockSlotsUsed,omitempty"`
	HitDiceUsed         map[types.HitDie]int `json:"hitDiceUsed,omitempty"`
	ActiveConcentration *ActiveConcentration `json:"activeConcentration,omitempty"`

	Conditions     []AppliedCondition `json:"conditions,omitempty"`
	Resources      []ResourceState    `json:"resources,omitempty"`
	Items          []ItemInstance     `json:"items,omitempty"`
	PendingChoices []PendingChoice    `json:"pendingChoices,omitempty"`

	Proficiencies struct {
		Armor        []string                               `json:"armor,omitempty"`
		Weapons      []string                               `json:"weapons,omitempty"`
		Tools        []string                               `json:"tools,omitempty"`
		SavingThrows []types.AbilityScore                   `json:"savingThrows,omitempty"`
		Skills       map[types.Skill]types.ProficiencyLevel `json:"skills,omitempty"`
	} `json:"proficiencies,omitempty"`

	Languages   []string       `json:"languages,omitempty"`
	Feats       []types.FeatID `json:"feats,omitempty"`
	Inspiration bool           `json:"inspiration,omitempty"`
}

type Combatant struct {
	ID           types.CharacterID `json:"id" validate:"required"`
	Name         string            `json:"name" validate:"required"`
	Initiative   int               `json:"initiative"`
	AC           int               `json:"ac"`
	HP           HP                `json:"hp" validate:"required"`
	Conditions   []AppliedCondition `json:"conditions,omitempty"`
	IsPlayer     bool              `json:"isPlayer"`
}

type Encounter struct {
	ID          types.EncounterID `json:"id" validate:"required"`
	Name        string            `json:"name" validate:"required"`
	Combatants  []Combatant       `json:"combatants,omitempty"`
	InitiativeOrder []string       `json:"initiativeOrder,omitempty"`
	CurrentTurn string             `json:"currentTurn,omitempty"`
	Round       int               `json:"round"`
	Status      string            `json:"status"`
}
