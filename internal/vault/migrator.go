package vault

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/hadnu/arcanum/internal/schemas/vault"
	"github.com/hadnu/arcanum/internal/types"
	"gopkg.in/yaml.v3"
)

// Migrator handles migration from old data/characters/*.yaml to new char/ vault.
type Migrator struct {
	sourceDir string
	vault     *Vault
}

// NewMigrator creates a new migrator.
func NewMigrator(sourceDir, vaultDir string) (*Migrator, error) {
	v, err := NewVault(vaultDir)
	if err != nil {
		return nil, err
	}
	return &Migrator{
		sourceDir: sourceDir,
		vault:     v,
	}, nil
}

// Migrate runs the migration and returns count of migrated characters.
func (m *Migrator) Migrate() (int, error) {
	entries, err := os.ReadDir(m.sourceDir)
	if err != nil {
		if os.IsNotExist(err) {
			fmt.Printf("Source directory %s does not exist, skipping\n", m.sourceDir)
			return 0, nil
		}
		return 0, err
	}

	count := 0
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".yaml") {
			continue
		}

		path := filepath.Join(m.sourceDir, e.Name())
		fmt.Printf("  Migrating %s...", e.Name())

		entry, err := m.migrateFile(path)
		if err != nil {
			fmt.Printf(" FAILED: %v\n", err)
			continue
		}

		if err := m.vault.Save(entry); err != nil {
			fmt.Printf(" FAILED: %v\n", err)
			continue
		}

		fmt.Printf(" OK (%s)\n", entry.Metadata.ID)
		count++
	}

	return count, nil
}

// migrateFile reads an old SavedCharacter YAML and converts to CharacterVaultEntry.
func (m *Migrator) migrateFile(path string) (*vault.CharacterVaultEntry, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var old SavedCharacter
	if err := yaml.Unmarshal(data, &old); err != nil {
		return nil, fmt.Errorf("unmarshal old format: %w", err)
	}

	return m.convert(&old), nil
}

// SavedCharacter represents the old YAML format from data/characters/*.yaml
type SavedCharacter struct {
	Name            string            `yaml:"name"`
	Classes         []SavedClass      `yaml:"classes"`
	BackgroundID    string            `yaml:"backgroundId"`
	BackgroundName  string            `yaml:"backgroundName,omitempty"`
	SpeciesID       string            `yaml:"speciesId"`
	SpeciesVariant  string            `yaml:"speciesVariant,omitempty"`
	SpeciesHybrid   string            `yaml:"speciesHybrid,omitempty"`
	Level           int               `yaml:"level"`
	AbilityMethod   string            `yaml:"abilityMethod"`
	Abilities       map[string]int    `yaml:"abilities"`
	Skills          []string          `yaml:"skills"`
	Spells          []string          `yaml:"spells,omitempty"`
	Feats           []string          `yaml:"feats,omitempty"`
	Equipment       []string          `yaml:"equipment,omitempty"`
	SubclassID      string            `yaml:"subclassId,omitempty"`
	BGAlignment     string            `yaml:"bgAlignment,omitempty"`
	BGFaith         string            `yaml:"bgFaith,omitempty"`
	BGTrait         string            `yaml:"bgTrait,omitempty"`
	BGIdeal         string            `yaml:"bgIdeal,omitempty"`
	BGBond          string            `yaml:"bgBond,omitempty"`
	BGFlaw          string            `yaml:"bgFlaw,omitempty"`
	BGAge           string            `yaml:"bgAge,omitempty"`
	BGHeight        string            `yaml:"bgHeight,omitempty"`
	BGWeight        string            `yaml:"bgWeight,omitempty"`
	BGEyes          string            `yaml:"bgEyes,omitempty"`
	BGSkin          string            `yaml:"bgSkin,omitempty"`
	BGHair          string            `yaml:"bgHair,omitempty"`
	BGNotes         string            `yaml:"bgNotes,omitempty"`
	XP              int               `yaml:"xp"`
	ProgressionType string            `yaml:"progressionType"`
	CreatedAt       string            `yaml:"createdAt"`
	UpdatedAt       string            `yaml:"updatedAt"`
}

type SavedClass struct {
	ID         string `yaml:"id"`
	Name       string `yaml:"name"`
	Level      int    `yaml:"level"`
	SubclassID string `yaml:"subclassId,omitempty"`
}

// convert transforms a SavedCharacter to a CharacterVaultEntry.
func (m *Migrator) convert(old *SavedCharacter) *vault.CharacterVaultEntry {
	now := time.Now()
	createdAt := parseTime(old.CreatedAt, now)
	updatedAt := parseTime(old.UpdatedAt, now)

	// Build classes
	classes := make([]vault.ClassEntry, len(old.Classes))
	for i, c := range old.Classes {
		subclassLevel := 0
		if c.SubclassID != "" {
			subclassLevel = inferSubclassLevel(c.SubclassID, c.Level)
		}
		classes[i] = vault.ClassEntry{
			ClassID:          c.ID,
			Level:            c.Level,
			SubclassID:       c.SubclassID,
			SubclassChosenAt: subclassLevel,
		}
	}

	// Build abilities
	abilities := vault.Abilities{}
	for k, v := range old.Abilities {
		switch strings.ToUpper(k) {
		case "STR", "STRENGTH":
			abilities.STR = v
		case "DEX", "DEXTERITY":
			abilities.DEX = v
		case "CON", "CONSTITUTION":
			abilities.CON = v
		case "INT", "INTELLIGENCE":
			abilities.INT = v
		case "WIS", "WISDOM":
			abilities.WIS = v
		case "CHA", "CHARISMA":
			abilities.CHA = v
		}
	}

	// Build skills
	skills := vault.Skills{
		Proficient: old.Skills,
		Sources:    make(map[string]string),
	}
	for _, s := range old.Skills {
		skills.Sources[s] = "unknown"
	}

	// Build feats
	feats := make([]vault.FeatEntry, 0, len(old.Feats))
	for _, f := range old.Feats {
		source := "feat"
		if isBackgroundFeat(f) {
			source = "background"
		} else if isClassFeat(f) {
			source = "class"
		}
		feats = append(feats, vault.FeatEntry{
			FeatID: f,
			Level:  1, // unknown, default to 1
			Source: source,
		})
	}

	// Build equipment
	equipment := make([]vault.EquipmentEntry, 0, len(old.Equipment))
	for _, e := range old.Equipment {
		equipment = append(equipment, vault.EquipmentEntry{
			ItemID:   e,
			Quantity: 1,
			Equipped: false,
		})
	}

	// Build spells
	spells := vault.Spells{
		Known:          make([]vault.SpellEntry, 0, len(old.Spells)),
		AlwaysPrepared: []vault.SpellEntry{},
	}
	for _, s := range old.Spells {
		level := inferSpellLevel(s)
		spells.Known = append(spells.Known, vault.SpellEntry{
			SpellID: s,
			Level:   level,
			Source:  "class",
		})
	}

	// Build notes
	notes := vault.Notes{
		Personality: old.BGAlignment,
		Ideals:      old.BGIdeal,
		Bonds:       old.BGBond,
		Flaws:       old.BGFlaw,
		Appearance:  old.BGAge + " " + old.BGHeight + " " + old.BGWeight,
		Backstory:   old.BGNotes,
	}

	return &vault.CharacterVaultEntry{
		Metadata: vault.VaultMetadata{
			ID:            types.NewCharacterID(),
			Version:       2,
			Status:        vault.StatusCompleted, // migrated chars are complete
			CreatedAt:     createdAt,
			UpdatedAt:     updatedAt,
			EventVersion:  0,
		},
		Identity: vault.Identity{
			Name:            old.Name,
			Level:           old.Level,
			XP:              old.XP,
			ProgressionType: old.ProgressionType,
		},
		Origin: vault.Origin{
			Species:           old.SpeciesID,
			SpeciesVariant:    old.SpeciesVariant,
			Background:        old.BackgroundID,
			BackgroundVariant: "",
			AbilityMethod:     old.AbilityMethod,
		},
		Classes:    classes,
		Abilities:  abilities,
		Skills:     skills,
		Feats:      feats,
		Spells:     spells,
		Equipment:  equipment,
		Currency:   vault.Currency{GP: 10},
		Languages:  []string{"Common"},
		Notes:      notes,
		EventLog:   []vault.EventRef{},
	}
}

// Helper functions (local to migrator)

func parseTime(s string, fallback time.Time) time.Time {
	if s == "" {
		return fallback
	}
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		return fallback
	}
	return t
}

func inferSubclassLevel(subclassID string, classLevel int) int {
	if subclassID == "" {
		return 0
	}
	if classLevel >= 3 {
		return 3
	}
	return 1
}

func isBackgroundFeat(featID string) bool {
	backgroundFeats := map[string]bool{
		"magic-initiate-cleric":  true,
		"magic-initiate-druid":   true,
		"magic-initiate-wizard":  true,
		"skilled":                true,
		"tough":                  true,
		"alert":                  true,
		"lucky":                  true,
		"healer":                 true,
		"crafter":                true,
		"musician":               true,
		"savage-attacker":        true,
		"tavern-brawler":         true,
		"aberrant-dragonmark":    true,
	}
	return backgroundFeats[featID]
}

func isClassFeat(featID string) bool {
	return featID == "ability-score-improvement"
}

func inferSpellLevel(spellID string) int {
	level1 := []string{"shield", "mage-armor", "chromatic-orb", "dissonant-whispers", "color-spray", "thunderwave", "witch-bolt", "cure-wounds", "burning-hands", "magic-missile"}
	level2 := []string{"crown-of-madness", "detect-thoughts", "shatter", "misty-step", "blur", "invisibility", "scorching-ray", "hold-person"}
	level3 := []string{"hunger-of-hadar", "hypnotic-pattern", "fireball", "lightning-bolt", "fly", "counterspell"}

	lower := strings.ToLower(spellID)
	for _, s := range level1 {
		if strings.Contains(lower, s) {
			return 1
		}
	}
	for _, s := range level2 {
		if strings.Contains(lower, s) {
			return 2
		}
	}
	for _, s := range level3 {
		if strings.Contains(lower, s) {
			return 3
		}
	}
	cantrips := []string{"mind-sliver", "mage-hand", "minor-illusion", "message", "fire-bolt", "ray-of-frost", "shocking-grasp", "prestidigitation", "druidcraft", "guidance"}
	for _, s := range cantrips {
		if strings.Contains(lower, s) {
			return 0
		}
	}
	return 1 // default
}