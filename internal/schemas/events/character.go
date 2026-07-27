package events

import (
	"errors"

	"github.com/hadnu/arcanum/internal/types"
)

// CharacterCreatedEvent represents the creation of a new character.
type CharacterCreatedEvent struct {
	CharacterID    types.CharacterID   `json:"characterId" validate:"required"`
	Name           string              `json:"name" validate:"required"`
	SpeciesID      types.SpeciesID     `json:"speciesId" validate:"required"`
	SpeciesVariant string              `json:"speciesVariant,omitempty"`
	BackgroundID   types.BackgroundID  `json:"backgroundId,omitempty"`
	Classes        []ClassEntry        `json:"classes" validate:"required,min=1,dive"`
	Level          int                 `json:"level" validate:"min=1,max=20"`
	AbilityScores  types.AbilityScores `json:"abilityScores" validate:"required"`
	MaxHP          int                 `json:"maxHp" validate:"min=1"`
	SavingThrows   []types.AbilityScore `json:"savingThrows,omitempty"`
	Skills         map[types.Skill]types.ProficiencyLevel `json:"skills,omitempty"`
	Spells         []types.SpellID     `json:"spells,omitempty"`
	Feats          []types.FeatID      `json:"feats,omitempty"`
	AbilityMethod  string              `json:"abilityMethod,omitempty"`
}

func (e CharacterCreatedEvent) EventType() EventType     { return EventCharacterCreated }
func (e CharacterCreatedEvent) SchemaVersion() int       { return 1 }
func (e CharacterCreatedEvent) Validate() error {
	if e.Name == "" { return errors.New("name is required") }
	if e.Level < 1 || e.Level > 20 { return errors.New("level must be 1-20") }
	if len(e.Classes) == 0 { return errors.New("at least one class required") }
	if e.MaxHP < 1 { return errors.New("maxHp must be >= 1") }
	return nil
}

// CharacterLeveledUpEvent represents a character leveling up.
type CharacterLeveledUpEvent struct {
	CharacterID   types.CharacterID `json:"characterId" validate:"required"`
	ClassID       types.ClassID     `json:"classId" validate:"required"`
	NewLevel      int               `json:"newLevel" validate:"min=1,max=20"`
	HPGained      int               `json:"hpGained" validate:"min=1"`
	FeatChoice    *types.FeatID     `json:"featChoice,omitempty"`
	SubclassChoice *types.SubClassID `json:"subclassChoice,omitempty"`
}

func (e CharacterLeveledUpEvent) EventType() EventType   { return EventCharacterLeveledUp }
func (e CharacterLeveledUpEvent) SchemaVersion() int     { return 1 }
func (e CharacterLeveledUpEvent) Validate() error {
	if e.NewLevel < 1 || e.NewLevel > 20 { return errors.New("newLevel must be 1-20") }
	if e.HPGained < 1 { return errors.New("hpGained must be >= 1") }
	return nil
}

// FeatTakenEvent represents a character taking a feat.
type FeatTakenEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	FeatID      types.FeatID      `json:"featId" validate:"required"`
	Level       int               `json:"level" validate:"min=1,max=20"`
}

func (e FeatTakenEvent) EventType() EventType { return EventFeatTaken }
func (e FeatTakenEvent) SchemaVersion() int   { return 1 }
func (e FeatTakenEvent) Validate() error { return nil }

// SubclassChosenEvent represents a character choosing a subclass.
type SubclassChosenEvent struct {
	CharacterID types.CharacterID  `json:"characterId" validate:"required"`
	ClassID     types.ClassID      `json:"classId" validate:"required"`
	SubclassID  types.SubClassID   `json:"subclassId" validate:"required"`
	Level       int                `json:"level" validate:"min=1,max=20"`
}

func (e SubclassChosenEvent) EventType() EventType { return EventSubclassChosen }
func (e SubclassChosenEvent) SchemaVersion() int   { return 1 }
func (e SubclassChosenEvent) Validate() error { return nil }

// ClassEntry represents a class and level entry for a character.
type ClassEntry struct {
	ClassID     types.ClassID      `json:"classId" validate:"required"`
	Level       int                `json:"level" validate:"min=1,max=20"`
	SubclassID  *types.SubClassID  `json:"subclassId,omitempty"`
}

func init() {
	RegisterEvent(EventCharacterCreated, 1, func() Event { return &CharacterCreatedEvent{} })
	RegisterEvent(EventCharacterLeveledUp, 1, func() Event { return &CharacterLeveledUpEvent{} })
	RegisterEvent(EventFeatTaken, 1, func() Event { return &FeatTakenEvent{} })
	RegisterEvent(EventSubclassChosen, 1, func() Event { return &SubclassChosenEvent{} })
}