package vault

import (
	"fmt"
	"os"
	"path/filepath"
	"testing"
	"time"

	svault "github.com/hadnu/arcanum/internal/schemas/vault"
	"github.com/hadnu/arcanum/internal/types"
)

func TestVault_CRUD(t *testing.T) {
	tmpDir := t.TempDir()
	v, err := NewVault(tmpDir)
	if err != nil {
		t.Fatalf("NewVault: %v", err)
	}

	// Create
	entry := &svault.CharacterVaultEntry{
		Metadata: svault.VaultMetadata{
			ID:        types.NewCharacterID(),
			Version:   2,
			Status:    svault.StatusDraft,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		Identity: svault.Identity{
			Name:  "Test Character",
			Level: 1,
		},
		Origin: svault.Origin{
			Species:    "human",
			Background: "acolyte",
		},
		Classes: []svault.ClassEntry{{ClassID: "fighter", Level: 1}},
		Abilities: svault.Abilities{
			STR: 16, DEX: 12, CON: 14, INT: 10, WIS: 13, CHA: 8,
		},
	}

	if err := v.Save(entry); err != nil {
		t.Fatalf("Save: %v", err)
	}

	// Get
	got, err := v.Get(entry.Metadata.ID)
	if err != nil {
		t.Fatalf("Get: %v", err)
	}
	if got.Identity.Name != "Test Character" {
		t.Errorf("name mismatch: %s", got.Identity.Name)
	}

	// List
	list := v.List("")
	if len(list) != 1 {
		t.Errorf("expected 1 entry, got %d", len(list))
	}

	// Update
	got.Identity.Name = "Updated Name"
	if err := v.Save(got); err != nil {
		t.Fatalf("Save update: %v", err)
	}

	got2, _ := v.Get(entry.Metadata.ID)
	if got2.Identity.Name != "Updated Name" {
		t.Errorf("update not persisted: %s", got2.Identity.Name)
	}

	// Soft delete
	if err := v.Delete(entry.Metadata.ID, false); err != nil {
		t.Fatalf("Delete: %v", err)
	}
	list = v.List(svault.StatusArchived)
	if len(list) != 1 {
		t.Errorf("expected 1 archived, got %d", len(list))
	}

	// Hard delete
	if err := v.Delete(entry.Metadata.ID, true); err != nil {
		t.Fatalf("Hard delete: %v", err)
	}
	list = v.List("")
	if len(list) != 0 {
		t.Errorf("expected empty vault after hard delete, got %d", len(list))
	}
}

func TestVault_IndexPersistence(t *testing.T) {
	tmpDir := t.TempDir()

	// Create vault and save character
	v1, err := NewVault(tmpDir)
	if err != nil {
		t.Fatalf("NewVault: %v", err)
	}

	entry := &svault.CharacterVaultEntry{
		Metadata: svault.VaultMetadata{
			ID:        types.NewCharacterID(),
			Version:   2,
			Status:    svault.StatusCompleted,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		Identity: svault.Identity{Name: "Persist Test", Level: 5},
		Origin:   svault.Origin{Species: "elf", Background: "sage"},
		Classes:  []svault.ClassEntry{{ClassID: "wizard", Level: 5}},
	}
	if err := v1.Save(entry); err != nil {
		t.Fatalf("Save: %v", err)
	}
	id := entry.Metadata.ID

	// Create new vault instance (simulates restart)
	v2, err := NewVault(tmpDir)
	if err != nil {
		t.Fatalf("NewVault restart: %v", err)
	}

	// Verify index loaded
	list := v2.List("")
	if len(list) != 1 {
		t.Fatalf("expected 1 in index after restart, got %d", len(list))
	}
	if list[0].ID != id {
		t.Errorf("index ID mismatch: %s != %s", list[0].ID, id)
	}
	if list[0].Name != "Persist Test" {
		t.Errorf("index name mismatch: %s", list[0].Name)
	}

	// Verify character loads
	got, err := v2.Get(id)
	if err != nil {
		t.Fatalf("Get after restart: %v", err)
	}
	if got.Identity.Name != "Persist Test" {
		t.Errorf("character name mismatch: %s", got.Identity.Name)
	}
}

func TestVault_ExportImport(t *testing.T) {
	tmpDir := t.TempDir()
	v, err := NewVault(tmpDir)
	if err != nil {
		t.Fatalf("NewVault: %v", err)
	}

	entry := &svault.CharacterVaultEntry{
		Metadata: svault.VaultMetadata{
			ID:        types.NewCharacterID(),
			Version:   2,
			Status:    svault.StatusCompleted,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		Identity: svault.Identity{Name: "Export Test", Level: 3},
		Origin:   svault.Origin{Species: "dwarf", Background: "artisan"},
		Classes:  []svault.ClassEntry{{ClassID: "cleric", Level: 3}},
	}
	if err := v.Save(entry); err != nil {
		t.Fatalf("Save: %v", err)
	}

	// Export
	data, err := v.Export(entry.Metadata.ID)
	if err != nil {
		t.Fatalf("Export: %v", err)
	}

	// Import into new vault
	tmpDir2 := t.TempDir()
	v2, err := NewVault(tmpDir2)
	if err != nil {
		t.Fatalf("NewVault2: %v", err)
	}

	imported, err := v2.Import(data)
	if err != nil {
		t.Fatalf("Import: %v", err)
	}

	if imported.Identity.Name != "Export Test" {
		t.Errorf("imported name mismatch: %s", imported.Identity.Name)
	}
	if imported.Metadata.ID == entry.Metadata.ID {
		t.Errorf("import should generate new ID")
	}
	if imported.Metadata.Status != svault.StatusDraft {
		t.Errorf("imported status should be draft, got %s", imported.Metadata.Status)
	}
}

func TestVault_Slugify(t *testing.T) {
	id, _ := types.ParseCharacterID("01KYJQ4JEKV93S8G8TTRYRA358")
	slug := slugifyID(id)
	expected := "01kyjq4jekv93s8g8ttryra358"
	if slug != expected {
		t.Errorf("slugify: got %s, want %s", slug, expected)
	}
}

func TestVault_Clone(t *testing.T) {
	tmpDir := t.TempDir()
	v, err := NewVault(tmpDir)
	if err != nil {
		t.Fatalf("NewVault: %v", err)
	}

	entry := &svault.CharacterVaultEntry{
		Metadata: svault.VaultMetadata{
			ID:        types.NewCharacterID(),
			Version:   2,
			Status:    svault.StatusCompleted,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		Identity: svault.Identity{Name: "Original", Level: 1},
		Origin:   svault.Origin{Species: "human", Background: "acolyte"},
		Classes:  []svault.ClassEntry{{ClassID: "fighter", Level: 1}},
	}
	if err := v.Save(entry); err != nil {
		t.Fatalf("Save: %v", err)
	}

	clone, err := v.Clone(entry.Metadata.ID, "Clone Name")
	if err != nil {
		t.Fatalf("Clone: %v", err)
	}

	if clone.Identity.Name != "Clone Name" {
		t.Errorf("clone name: %s", clone.Identity.Name)
	}
	if clone.Metadata.ID == entry.Metadata.ID {
		t.Errorf("clone should have new ID")
	}
	if clone.Metadata.Status != svault.StatusDraft {
		t.Errorf("clone status should be draft: %s", clone.Metadata.Status)
	}

	// Verify both exist
	list := v.List("")
	if len(list) != 2 {
		t.Errorf("expected 2 entries after clone, got %d", len(list))
	}
}

// Integration test: full migration round-trip
func TestVault_MigrationRoundTrip(t *testing.T) {
	// Create temp dirs
	sourceDir := t.TempDir()
	vaultDir := t.TempDir()

	// Write old format file
	oldYAML := `
name: "Migrated Character"
classes:
  - id: "sorcerer"
    name: "Sorcerer"
    level: 6
    subclassId: "aberrant-sorcery"
backgroundId: "aberrant-heir"
speciesId: "kalashtar"
level: 6
abilityMethod: "standard_array"
abilities:
  STR: 8
  DEX: 12
  CON: 15
  INT: 10
  WIS: 14
  CHA: 17
skills:
  - "arcana"
  - "intimidation"
  - "deception"
  - "insight"
spells:
  - "mind-sliver"
  - "mage-hand"
  - "minor-illusion"
  - "message"
  - "shield"
  - "mage-armor"
  - "chromatic-orb"
  - "dissonant-whispers"
  - "color-spray"
  - "thunderwave"
  - "witch-bolt"
  - "crown-of-madness"
  - "detect-thoughts"
  - "shatter"
  - "misty-step"
  - "hunger-of-hadar"
  - "hypnotic-pattern"
feats:
  - "aberrant-dragonmark"
  - "ability-score-improvement"
equipment:
  - "dagger"
  - "component-pouch"
  - "backpack"
  - "bedroll"
  - "rations-1"
  - "waterskin"
  - "spellbook"
subclassId: "aberrant-sorcery"
xp: 14000
progressionType: "milestone"
createdAt: "2026-07-27T21:38:40Z"
updatedAt: "2026-07-27T21:38:40Z"
`
	oldPath := filepath.Join(sourceDir, "migrated-character.yaml")
	if err := os.WriteFile(oldPath, []byte(oldYAML), 0644); err != nil {
		t.Fatalf("write old file: %v", err)
	}

	// Run migration
	migrator, err := NewMigrator(sourceDir, vaultDir)
	if err != nil {
		t.Fatalf("NewMigrator: %v", err)
	}

	count, err := migrator.Migrate()
	if err != nil {
		t.Fatalf("Migrate: %v", err)
	}
	if count != 1 {
		t.Errorf("expected 1 migrated, got %d", count)
	}

	// Verify migrated character
	v, err := NewVault(vaultDir)
	if err != nil {
		t.Fatalf("NewVault after migrate: %v", err)
	}

	list := v.List(svault.StatusCompleted)
	if len(list) != 1 {
		t.Fatalf("expected 1 completed char, got %d", len(list))
	}

	got, err := v.Get(list[0].ID)
	if err != nil {
		t.Fatalf("Get migrated: %v", err)
	}

	if got.Identity.Name != "Migrated Character" {
		t.Errorf("name: %s", got.Identity.Name)
	}
	if got.Identity.Level != 6 {
		t.Errorf("level: %d", got.Identity.Level)
	}
	if got.Origin.Species != "kalashtar" {
		t.Errorf("species: %s", got.Origin.Species)
	}
	if got.Origin.Background != "aberrant-heir" {
		t.Errorf("background: %s", got.Origin.Background)
	}
	if len(got.Classes) != 1 || got.Classes[0].ClassID != "sorcerer" {
		t.Errorf("classes: %+v", got.Classes)
	}
	if got.Abilities.CHA != 17 {
		t.Errorf("CHA: %d", got.Abilities.CHA)
	}
	if len(got.Skills.Proficient) != 4 {
		t.Errorf("skills count: %d", len(got.Skills.Proficient))
	}
	if got.Metadata.Status != svault.StatusCompleted {
		t.Errorf("status: %s", got.Metadata.Status)
	}

	fmt.Printf("Migration test passed! Character: %s (ID: %s)\n", got.Identity.Name, got.Metadata.ID)
}