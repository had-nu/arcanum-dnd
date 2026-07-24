package main

import (
	"log"
	"time"

	"github.com/hadnu/arcanum/internal/character"
	contentpack "github.com/hadnu/arcanum/internal/content"
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
	e := engine.NewEngine(content, randSource)
	campaign := e.CreateCampaign("Arcanum Playtest")

	evt := events.Event{
		Type:             events.EventCharacterCreated,
		CharacterCreated: &result.Event,
	}
	campaign = e.Commit(campaign, []events.Event{evt})

	char, ok := campaign.State.Characters[result.Event.CharacterID]
	if !ok {
		log.Fatal("Character not found in state after commit!")
	}

	sheet := derive.BuildCharacterSheet(*char, content)
	log.Printf("Derived: %s — AC:%d HP:%d/%d Prof:+%d",
		sheet.Name, sheet.AC, sheet.HP.Current, sheet.HP.Max, sheet.ProficiencyBonus)

	result.Sheet.Print()

	log.Printf("Events: %d | Campaign: %s", campaign.Cursor, campaign.ID)
}
