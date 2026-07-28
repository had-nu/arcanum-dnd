package engine

import "github.com/hadnu/arcanum/internal/types"

type BuildRequest struct {
	Name            string               `json:"name"`
	SpeciesID       types.SpeciesID      `json:"speciesId"`
	SpeciesVariant  *string              `json:"speciesVariant,omitempty"`
	BackgroundID    types.BackgroundID   `json:"backgroundId"`
	Classes         []ClassBuildEntry    `json:"classes"`
	Level           int                  `json:"level"`
	AbilityScores   types.AbilityScores  `json:"abilityScores"`
	AbilityMethod   string               `json:"abilityMethod,omitempty"`
	Skills          []SkillChoice        `json:"skills"`
	Spells          []SpellChoice        `json:"spells"`
	Feats           []FeatChoice         `json:"feats"`
	Equipment       []EquipmentChoice    `json:"equipment,omitempty"`
	SubclassChoices []SubclassChoice     `json:"subclassChoices,omitempty"`
}

type ClassBuildEntry struct {
	ID         types.ClassID     `json:"id"`
	Level      int               `json:"level"`
	SubclassID *types.SubClassID `json:"subclassId,omitempty"`
}

type SkillChoice struct {
	Skill  types.Skill `json:"skill"`
	Source string      `json:"source"`
}

type SpellChoice struct {
	SpellID types.SpellID `json:"spellId"`
	Source  string        `json:"source"`
	Level   int           `json:"level,omitempty"`
}

type FeatChoice struct {
	FeatID types.FeatID `json:"featId"`
	Level  int          `json:"level"`
	ASI    *ASIChoice   `json:"asi,omitempty"`
}

type ASIChoice struct {
	Ability types.AbilityScore `json:"ability"`
	Amount  int                `json:"amount"`
}

type EquipmentChoice struct {
	ItemID   types.ItemDefinitionID `json:"itemId"`
	Quantity int                    `json:"quantity"`
	Equipped bool                   `json:"equipped"`
}

type SubclassChoice struct {
	ClassID    types.ClassID    `json:"classId"`
	SubclassID types.SubClassID `json:"subclassId"`
	Level      int              `json:"level"`
}
