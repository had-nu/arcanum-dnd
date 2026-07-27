package main

import (
	"context"
	"log"
	"time"

	"github.com/hadnu/arcanum/internal/character"
	contentpack "github.com/hadnu/arcanum/internal/content"
	"github.com/hadnu/arcanum/internal/database"
	"github.com/hadnu/arcanum/internal/engine"
	"github.com/hadnu/arcanum/internal/engine/derive"
	"github.com/hadnu/arcanum/internal/rng"
	"github.com/hadnu/arcanum/internal/schemas/events"
)

func main() {
	log.Println("Arcanum — Character Creator (SRD 5.2)")
	start := time.Now()

	content, err := contentpack.LoadAllFromDataDir("data")
	if err != nil {
		log.Fatalf("Failed to load content packs: %v", err)
	}

	loadTime := time.Since(start)
	log.Printf("Loaded: %d classes, %d species, %d backgrounds, %d feats, %d spells, %d items, %d conditions (%v)",
		len(content.Classes), len(content.Species), len(content.Backgrounds),
		len(content.Feats), len(content.Spells), len(content.Items), len(content.Conditions),
		loadTime.Round(time.Millisecond))

	creator := character.NewCreator(content)
	creator.RunInteractive()

	result := creator.Result

	randSource := rng.NewSeededRNG(42)
	
	// Create in-memory event store for TUI player (no persistence)
	db, err := database.Open(":memory:")
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()
	
	if err := database.Migrate(db); err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}
	
	eventStore := database.NewEventStore(db)
	snapshotStore := database.NewSnapshotStore(db)
	
	e := engine.NewEngine(content, randSource, eventStore, snapshotStore)
	
	ctx := context.Background()
	campaign, err := e.CreateCampaign(ctx, "Arcanum Playtest")
	if err != nil {
		log.Fatalf("Failed to create campaign: %v", err)
	}

	evt := &events.CharacterCreatedEvent{
		CharacterID:    result.Event.CharacterID,
		Name:           result.Event.Name,
		SpeciesID:      result.Event.SpeciesID,
		SpeciesVariant: result.Event.SpeciesVariant,
		BackgroundID:   result.Event.BackgroundID,
		Classes:        make([]events.ClassEntry, len(result.Event.Classes)),
		Level:          result.Event.Level,
		AbilityScores:  result.Event.AbilityScores,
		MaxHP:          result.Event.MaxHP,
		SavingThrows:   result.Event.SavingThrows,
		Skills:         result.Event.Skills,
		Spells:         result.Event.Spells,
		Feats:          result.Event.Feats,
		AbilityMethod:  result.Event.AbilityMethod,
	}
	for i, c := range result.Event.Classes {
		evt.Classes[i] = events.ClassEntry{
			ClassID:    c.ClassID,
			Level:      c.Level,
			SubclassID: c.SubclassID,
		}
	}
	campaign, err = e.Commit(ctx, campaign, []events.Event{evt})
	if err != nil {
		log.Fatalf("Failed to commit: %v", err)
	}

	char, ok := campaign.State.Characters[result.Event.CharacterID]
	if !ok {
		log.Fatal("Character not found in state after commit!")
	}

	sheet := derive.BuildCharacterSheet(*char, content)
	log.Printf("Derived: %s — AC:%d HP:%d/%d Prof:+%d",
		sheet.Name, sheet.AC, sheet.HP.Current, sheet.HP.Max, sheet.ProficiencyBonus)

	result.Sheet.Print()

	log.Printf("Events: %d | Campaign: %s", campaign.Version, campaign.ID)
}
