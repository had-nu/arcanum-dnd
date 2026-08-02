package vault

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/hadnu/arcanum/internal/schemas/vault"
	"github.com/hadnu/arcanum/internal/types"
	"gopkg.in/yaml.v3"
)

// Vault manages the character vault (char/ directory with YAML files + _index.yaml).
type Vault struct {
	rootDir string
	index   *vault.VaultIndex
	mu      sync.RWMutex
}

// NewVault creates a new Vault instance.
func NewVault(rootDir string) (*Vault, error) {
	v := &Vault{rootDir: rootDir}
	if err := v.ensureDirs(); err != nil {
		return nil, err
	}
	if err := v.loadIndex(); err != nil {
		return nil, err
	}
	return v, nil
}

// ensureDirs creates the vault directory if it doesn't exist.
func (v *Vault) ensureDirs() error {
	return os.MkdirAll(v.rootDir, 0755)
}

// indexPath returns the path to the _index.yaml file.
func (v *Vault) indexPath() string {
	return filepath.Join(v.rootDir, "_index.yaml")
}

// characterPath returns the path to a character YAML file.
func (v *Vault) characterPath(id types.CharacterID) string {
	return filepath.Join(v.rootDir, slugifyID(id)+".yaml")
}

// loadIndex loads or creates the vault index.
func (v *Vault) loadIndex() error {
	v.mu.Lock()
	defer v.mu.Unlock()

	path := v.indexPath()
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			v.index = vault.NewVaultIndex()
			return v.saveIndexLocked()
		}
		return err
	}

	var idx vault.VaultIndex
	if err := yaml.Unmarshal(data, &idx); err != nil {
		return fmt.Errorf("unmarshal index: %w", err)
	}
	v.index = &idx
	return nil
}

// saveIndexLocked saves the index (must hold lock).
func (v *Vault) saveIndexLocked() error {
	v.index.UpdatedAt = time.Now()
	data, err := yaml.Marshal(v.index)
	if err != nil {
		return fmt.Errorf("marshal index: %w", err)
	}
	return os.WriteFile(v.indexPath(), data, 0644)
}

// List returns all characters in the vault, optionally filtered by status.
func (v *Vault) List(status vault.CharacterStatus) []vault.VaultIndexEntry {
	v.mu.RLock()
	defer v.mu.RUnlock()
	return v.index.List(status)
}

// Get loads a character from the vault by ID.
func (v *Vault) Get(id types.CharacterID) (*vault.CharacterVaultEntry, error) {
	v.mu.RLock()
	defer v.mu.RUnlock()

	path := v.characterPath(id)
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("character not found: %s", id)
		}
		return nil, err
	}

	var entry vault.CharacterVaultEntry
	if err := yaml.Unmarshal(data, &entry); err != nil {
		return nil, fmt.Errorf("unmarshal character: %w", err)
	}
	return &entry, nil
}

// Save persists a character to the vault and updates the index.
func (v *Vault) Save(entry *vault.CharacterVaultEntry) error {
	v.mu.Lock()
	defer v.mu.Unlock()

	// Validate
	if entry.Metadata.ID.String() == "" {
		return fmt.Errorf("character ID is required")
	}
	if entry.Identity.Name == "" {
		return fmt.Errorf("character name is required")
	}

	// Set timestamps
	now := time.Now()
	if entry.Metadata.CreatedAt.IsZero() {
		entry.Metadata.CreatedAt = now
	}
	entry.Metadata.UpdatedAt = now
	entry.Metadata.Version = 2 // current schema version

	// Marshal
	data, err := yaml.Marshal(entry)
	if err != nil {
		return fmt.Errorf("marshal character: %w", err)
	}

	// Write character file
	path := v.characterPath(entry.Metadata.ID)
	if err := os.WriteFile(path, data, 0644); err != nil {
		return fmt.Errorf("write character file: %w", err)
	}

	// Update index
	indexEntry := vault.VaultIndexEntry{
		ID:           entry.Metadata.ID,
		File:         filepath.Base(path),
		Name:         entry.Identity.Name,
		Status:       entry.Metadata.Status,
		Level:        entry.Identity.Level,
		Classes:      extractClassNames(entry.Classes),
		Species:      entry.Origin.Species,
		Background:   entry.Origin.Background,
		UpdatedAt:    entry.Metadata.UpdatedAt,
		EventVersion: entry.Metadata.EventVersion,
	}
	v.index.AddOrUpdate(indexEntry)

	// Save index
	return v.saveIndexLocked()
}

// Delete removes a character from the vault (soft delete by default).
func (v *Vault) Delete(id types.CharacterID, hardDelete bool) error {
	v.mu.Lock()
	defer v.mu.Unlock()

	path := v.characterPath(id)
	if _, err := os.Stat(path); os.IsNotExist(err) {
		return fmt.Errorf("character not found: %s", id)
	}

	if hardDelete {
		if err := os.Remove(path); err != nil {
			return err
		}
		// Remove from index
		v.index.Remove(id)
	} else {
		// Soft delete: mark as archived — read file directly to avoid lock reentry
		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		var entry vault.CharacterVaultEntry
		if err := yaml.Unmarshal(data, &entry); err != nil {
			return err
		}
		entry.Metadata.Status = vault.StatusArchived
		entry.Metadata.UpdatedAt = time.Now()
		data, _ = yaml.Marshal(entry)
		if err := os.WriteFile(path, data, 0644); err != nil {
			return err
		}
		// Update existing index entry to archived status
		for i, ie := range v.index.Characters {
			if ie.ID == id {
				v.index.Characters[i].Status = vault.StatusArchived
				break
			}
		}
	}

	return v.saveIndexLocked()
}

// Clone creates a copy of a character with a new ID.
func (v *Vault) Clone(id types.CharacterID, newName string) (*vault.CharacterVaultEntry, error) {
	entry, err := v.Get(id)
	if err != nil {
		return nil, err
	}

	// Create clone
	clone := *entry
	clone.Metadata.ID = types.NewCharacterID()
	clone.Metadata.CreatedAt = time.Now()
	clone.Metadata.UpdatedAt = time.Now()
	clone.Metadata.EventVersion = 0
	clone.Metadata.Status = vault.StatusDraft
	clone.Identity.Name = newName

	if err := v.Save(&clone); err != nil {
		return nil, err
	}

	return &clone, nil
}

// Export returns the character as YAML bytes.
func (v *Vault) Export(id types.CharacterID) ([]byte, error) {
	entry, err := v.Get(id)
	if err != nil {
		return nil, err
	}
	return yaml.Marshal(entry)
}

// Import loads a character from YAML bytes and saves to vault.
func (v *Vault) Import(data []byte) (*vault.CharacterVaultEntry, error) {
	var entry vault.CharacterVaultEntry
	if err := yaml.Unmarshal(data, &entry); err != nil {
		return nil, fmt.Errorf("unmarshal: %w", err)
	}

	// Generate new ID for import
	entry.Metadata.ID = types.NewCharacterID()
	entry.Metadata.CreatedAt = time.Now()
	entry.Metadata.UpdatedAt = time.Now()
	entry.Metadata.EventVersion = 0
	entry.Metadata.Status = vault.StatusDraft

	if err := v.Save(&entry); err != nil {
		return nil, err
	}

	return &entry, nil
}

// slugifyID converts a CharacterID to a filesystem-safe slug.
func slugifyID(id types.CharacterID) string {
	s := id.String()
	return strings.ToLower(s)
}

func extractClassNames(classes []vault.ClassEntry) []string {
	names := make([]string, len(classes))
	for i, c := range classes {
		names[i] = c.ClassID // TODO: resolve to display name via content
	}
	return names
}

// Compute helpers (would use actual D&D math in real implementation)

func computeMaxHPAtLevel(entry *vault.CharacterVaultEntry, level int) int {
	conMod := (entry.Abilities.CON - 10) / 2
	if conMod < 0 {
		conMod = 0
	}
	return 6 + conMod + (level-1)*(4+conMod) // d6 avg 4 + CON
}

func computeHPGain(entry *vault.CharacterVaultEntry, level int) int {
	conMod := (entry.Abilities.CON - 10) / 2
	if conMod < 0 {
		conMod = 0
	}
	return 4 + conMod // average d6 + CON
}

func computeSavingThrows(entry *vault.CharacterVaultEntry) []string {
	if len(entry.Classes) > 0 {
		// Sorcerer: CON, CHA
		return []string{"CON", "CHA"}
	}
	return []string{}
}

func subclassAtLevel(entry *vault.CharacterVaultEntry, level int) string {
	for _, c := range entry.Classes {
		if c.SubclassChosenAt == level && c.SubclassID != "" {
			return c.SubclassID
		}
	}
	return ""
}

func featAtLevel(entry *vault.CharacterVaultEntry, level int) string {
	// Check for ASI at levels 4, 8, 12, 16, 19
	if level == 4 || level == 8 || level == 12 || level == 16 || level == 19 {
		for _, f := range entry.Feats {
			if f.Level == level && f.FeatID == "ability-score-improvement" {
				return f.FeatID
			}
		}
	}
	// Background feats at level 1
	if level == 1 {
		for _, f := range entry.Feats {
			if f.Source == "background" {
				return f.FeatID
			}
		}
	}
	return ""
}

func getSubclass(entry *vault.CharacterVaultEntry) string {
	for _, c := range entry.Classes {
		if c.SubclassID != "" {
			return c.SubclassID
		}
	}
	return ""
}

func getSubclassLevel(entry *vault.CharacterVaultEntry) int {
	for _, c := range entry.Classes {
		if c.SubclassID != "" {
			return c.SubclassChosenAt
		}
	}
	return 0
}

// Conversion helpers

func abilitiesToAbilityScores(a vault.Abilities) types.AbilityScores {
	return types.AbilityScores{
		STR: a.STR,
		DEX: a.DEX,
		CON: a.CON,
		INT: a.INT,
		WIS: a.WIS,
		CHA: a.CHA,
	}
}

func skillsToProficiencyMap(s vault.Skills) map[string]vault.ProficiencyLevel {
	m := make(map[string]vault.ProficiencyLevel)
	for _, skill := range s.Proficient {
		m[skill] = vault.ProficiencyProficient
	}
	for _, skill := range s.Expertise {
		m[skill] = vault.ProficiencyExpert
	}
	return m
}

func featsToFeatIDs(feats []vault.FeatEntry) []types.FeatID {
	ids := make([]types.FeatID, len(feats))
	for i, f := range feats {
		ids[i] = types.FeatID(f.FeatID)
	}
	return ids
}

func classesToClassEntries(classes []vault.ClassEntry) []vault.ClassEntry {
	return classes
}

// Domain event types (simplified - would be in schemas/events)

type CharacterCreatedEvent struct {
	CharacterID    types.CharacterID
	Name           string
	SpeciesID      string
	BackgroundID   string
	Level          int
	AbilityScores  types.AbilityScores
	MaxHP          int
	SavingThrows   []string
	Skills         map[string]vault.ProficiencyLevel
	Feats          []types.FeatID
	AbilityMethod  string
	Classes        []vault.ClassEntry
}

func (e *CharacterCreatedEvent) EventType() string { return "CharacterCreated" }

type CharacterLeveledUpEvent struct {
	CharacterID    types.CharacterID
	ClassID        string
	NewLevel       int
	HPGained       int
	SubclassChoice string
	FeatChoice     string
}

func (e *CharacterLeveledUpEvent) EventType() string { return "CharacterLeveledUp" }

type SubclassChosenEvent struct {
	CharacterID types.CharacterID
	ClassID     string
	SubclassID  string
	Level       int
}

func (e *SubclassChosenEvent) EventType() string { return "SubclassChosen" }

type FeatTakenEvent struct {
	CharacterID types.CharacterID
	FeatID      string
	Level       int
}

func (e *FeatTakenEvent) EventType() string { return "FeatTaken" }

// ProficiencyLevel constants
const (
	ProficiencyNone       vault.ProficiencyLevel = 0
	ProficiencyProficient vault.ProficiencyLevel = 1
	ProficiencyExpert     vault.ProficiencyLevel = 2
	ProficiencyMaster     vault.ProficiencyLevel = 3
)

// Helper: parseTime (for migration) — see migrator.go for implementation