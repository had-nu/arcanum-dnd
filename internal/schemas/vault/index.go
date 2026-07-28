package vault

import (
	"time"

	"github.com/hadnu/arcanum/internal/types"
)

// VaultIndex represents the _index.yaml file.
type VaultIndex struct {
	VaultVersion int              `yaml:"vaultVersion" json:"vaultVersion"`
	SchemaVersion int             `yaml:"schemaVersion" json:"schemaVersion"`
	Characters   []VaultIndexEntry `yaml:"characters" json:"characters"`
	UpdatedAt    time.Time         `yaml:"updatedAt" json:"updatedAt"`
}

// VaultIndexEntry is a lightweight entry in the vault index.
type VaultIndexEntry struct {
	ID           types.CharacterID `yaml:"id" json:"id"`
	File         string            `yaml:"file" json:"file"`
	Name         string            `yaml:"name" json:"name"`
	Status       CharacterStatus   `yaml:"status" json:"status"`
	Level        int               `yaml:"level" json:"level"`
	Classes      []string          `yaml:"classes" json:"classes"`
	Species      string            `yaml:"species" json:"species"`
	Background   string            `yaml:"background" json:"background"`
	UpdatedAt    time.Time         `yaml:"updatedAt" json:"updatedAt"`
	EventVersion int               `yaml:"eventVersion" json:"eventVersion"`
}

// NewVaultIndex creates a new empty vault index.
func NewVaultIndex() *VaultIndex {
	return &VaultIndex{
		VaultVersion:  2,
		SchemaVersion: 1,
		Characters:    []VaultIndexEntry{},
		UpdatedAt:     time.Now(),
	}
}

// AddOrUpdate adds or updates an entry in the index.
func (idx *VaultIndex) AddOrUpdate(entry VaultIndexEntry) {
	for i, e := range idx.Characters {
		if e.ID == entry.ID {
			idx.Characters[i] = entry
			idx.UpdatedAt = time.Now()
			return
		}
	}
	idx.Characters = append(idx.Characters, entry)
	idx.UpdatedAt = time.Now()
}

// Remove removes an entry from the index.
func (idx *VaultIndex) Remove(id types.CharacterID) {
	for i, e := range idx.Characters {
		if e.ID == id {
			idx.Characters = append(idx.Characters[:i], idx.Characters[i+1:]...)
			idx.UpdatedAt = time.Now()
			return
		}
	}
}

// Get retrieves an entry by ID.
func (idx *VaultIndex) Get(id types.CharacterID) *VaultIndexEntry {
	for _, e := range idx.Characters {
		if e.ID == id {
			return &e
		}
	}
	return nil
}

// List returns all entries, optionally filtered by status.
func (idx *VaultIndex) List(status CharacterStatus) []VaultIndexEntry {
	if status == "" {
		return idx.Characters
	}
	var result []VaultIndexEntry
	for _, e := range idx.Characters {
		if e.Status == status {
			result = append(result, e)
		}
	}
	return result
}