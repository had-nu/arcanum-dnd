package vault

import (
	"time"

	"github.com/hadnu/arcanum/internal/types"
)

// ProficiencyLevel represents skill proficiency tiers.
type ProficiencyLevel int

const (
	ProficiencyNone       ProficiencyLevel = 0
	ProficiencyProficient ProficiencyLevel = 1
	ProficiencyExpert     ProficiencyLevel = 2
	ProficiencyMaster     ProficiencyLevel = 3
)

// CharacterStatus represents the lifecycle state of a character in the vault.
type CharacterStatus string

const (
	StatusDraft      CharacterStatus = "draft"
	StatusCompleted  CharacterStatus = "completed"
	StatusArchived   CharacterStatus = "archived"
)

// VaultMetadata contains metadata about a vault entry.
type VaultMetadata struct {
	ID            types.CharacterID `yaml:"id" json:"id"`
	Version       int               `yaml:"version" json:"version"`                 // schema version of this file
	Status        CharacterStatus   `yaml:"status" json:"status"`
	CreatedAt     time.Time         `yaml:"createdAt" json:"createdAt"`
	UpdatedAt     time.Time         `yaml:"updatedAt" json:"updatedAt"`
	EventVersion  int               `yaml:"eventVersion" json:"eventVersion"`       // aggregate version in event store
	CampaignID    *types.CampaignID `yaml:"campaignId,omitempty" json:"campaignId,omitempty"`
}

// Identity contains core identity fields.
type Identity struct {
	Name             string `yaml:"name" json:"name"`
	Level            int    `yaml:"level" json:"level"`
	XP               int    `yaml:"xp,omitempty" json:"xp,omitempty"`
	ProgressionType  string `yaml:"progressionType" json:"progressionType"` // milestone | xp
}

// Origin contains species, background, and ability generation method.
type Origin struct {
	Species           string `yaml:"species" json:"species"`
	SpeciesVariant    string `yaml:"speciesVariant,omitempty" json:"speciesVariant,omitempty"`
	Background        string `yaml:"background" json:"background"`
	BackgroundVariant string `yaml:"backgroundVariant,omitempty" json:"backgroundVariant,omitempty"`
	AbilityMethod     string `yaml:"abilityMethod" json:"abilityMethod"` // standard_array | point_buy | rolled
}

// ClassEntry represents a class and its level (supports multiclass).
type ClassEntry struct {
	ClassID        string  `yaml:"classId" json:"classId"`
	Level          int     `yaml:"level" json:"level"`
	SubclassID     string  `yaml:"subclassId,omitempty" json:"subclassId,omitempty"`
	SubclassChosenAt int   `yaml:"subclassChosenAt,omitempty" json:"subclassChosenAt,omitempty"`
}

// Abilities contains the six ability scores.
type Abilities struct {
	STR int `yaml:"str" json:"str"`
	DEX int `yaml:"dex" json:"dex"`
	CON int `yaml:"con" json:"con"`
	INT int `yaml:"int" json:"int"`
	WIS int `yaml:"wis" json:"wis"`
	CHA int `yaml:"cha" json:"cha"`
}

// Skills tracks proficiencies and their sources.
type Skills struct {
	Proficient []string          `yaml:"proficient" json:"proficient"`
	Expertise  []string          `yaml:"expertise,omitempty" json:"expertise,omitempty"`
	Sources    map[string]string `yaml:"sources,omitempty" json:"sources,omitempty"` // skill -> source (background|class|feat)
}

// FeatEntry represents a feat with metadata.
type FeatEntry struct {
	FeatID   string            `yaml:"featId" json:"featId"`
	Level    int               `yaml:"level" json:"level"`
	Source   string            `yaml:"source" json:"source"` // background | class | feat
	Choices  map[string]string `yaml:"choices,omitempty" json:"choices,omitempty"` // e.g., ability: "cha", value: "1"
}

// SpellEntry represents a known or prepared spell.
type SpellEntry struct {
	SpellID      string `yaml:"spellId" json:"spellId"`
	Level        int    `yaml:"level" json:"level"`
	Source       string `yaml:"source" json:"source"` // class | subclass | feat | item
	UnlockedAt   int    `yaml:"unlockedAt,omitempty" json:"unlockedAt,omitempty"` // level when unlocked (for subclass spells)
	AlwaysPrepared bool  `yaml:"alwaysPrepared,omitempty" json:"alwaysPrepared,omitempty"` // doesn't count against known
}

// Spells contains known and always-prepared spells.
type Spells struct {
	Known          []SpellEntry `yaml:"known" json:"known"`
	AlwaysPrepared []SpellEntry `yaml:"alwaysPrepared" json:"alwaysPrepared"`
}

// EquipmentEntry represents an item in inventory.
type EquipmentEntry struct {
	ItemID    string `yaml:"itemId" json:"itemId"`
	Quantity  int    `yaml:"quantity" json:"quantity"`
	Equipped  bool   `yaml:"equipped" json:"equipped"`
	Attuned   bool   `yaml:"attuned,omitempty" json:"attuned,omitempty"`
}

// Currency tracks money.
type Currency struct {
	PP int `yaml:"pp,omitempty" json:"pp,omitempty"`
	GP int `yaml:"gp,omitempty" json:"gp,omitempty"`
	EP int `yaml:"ep,omitempty" json:"ep,omitempty"`
	SP int `yaml:"sp,omitempty" json:"sp,omitempty"`
	CP int `yaml:"cp,omitempty" json:"cp,omitempty"`
}

// Notes contains roleplay notes.
type Notes struct {
	Personality    string `yaml:"personality,omitempty" json:"personality,omitempty"`
	Ideals         string `yaml:"ideals,omitempty" json:"ideals,omitempty"`
	Bonds          string `yaml:"bonds,omitempty" json:"bonds,omitempty"`
	Flaws          string `yaml:"flaws,omitempty" json:"flaws,omitempty"`
	Appearance     string `yaml:"appearance,omitempty" json:"appearance,omitempty"`
	Backstory      string `yaml:"backstory,omitempty" json:"backstory,omitempty"`
	CampaignNotes  string `yaml:"campaignNotes,omitempty" json:"campaignNotes,omitempty"`
}

// EventRef is a lightweight reference to an event in the event log.
type EventRef struct {
	EventID     string            `yaml:"eventId" json:"eventId"`
	Type        string            `yaml:"type" json:"type"`
	Version     int               `yaml:"version" json:"version"`
	Details     map[string]string `yaml:"details,omitempty" json:"details,omitempty"` // e.g., newLevel, subclass, feat
}

// CharacterVaultEntry is the complete vault representation of a character.
type CharacterVaultEntry struct {
	Metadata     VaultMetadata     `yaml:"metadata" json:"metadata"`
	Identity     Identity          `yaml:"identity" json:"identity"`
	Origin       Origin            `yaml:"origin" json:"origin"`
	Classes      []ClassEntry      `yaml:"classes" json:"classes"`
	Abilities    Abilities         `yaml:"abilities" json:"abilities"`
	Skills       Skills            `yaml:"skills" json:"skills"`
	Feats        []FeatEntry       `yaml:"feats" json:"feats"`
	Spells       Spells            `yaml:"spells" json:"spells"`
	Equipment    []EquipmentEntry  `yaml:"equipment" json:"equipment"`
	Currency     Currency          `yaml:"currency" json:"currency"`
	Languages    []string          `yaml:"languages" json:"languages"`
	Notes        Notes             `yaml:"notes" json:"notes"`
	EventLog     []EventRef        `yaml:"eventLog" json:"eventLog"`
}

// ToAbilityScores converts Abilities to types.AbilityScores.
func (a Abilities) ToAbilityScores() types.AbilityScores {
	return types.AbilityScores{
		STR: a.STR,
		DEX: a.DEX,
		CON: a.CON,
		INT: a.INT,
		WIS: a.WIS,
		CHA: a.CHA,
	}
}