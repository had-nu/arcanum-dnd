package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/hadnu/arcanum/internal/auto"
	contentpack "github.com/hadnu/arcanum/internal/content"
	"github.com/hadnu/arcanum/internal/engine"
	"github.com/hadnu/arcanum/internal/engine/derive"
	scontent "github.com/hadnu/arcanum/internal/schemas/content"
	"github.com/hadnu/arcanum/internal/schemas/events"
	sruntime "github.com/hadnu/arcanum/internal/schemas/runtime"
	"github.com/hadnu/arcanum/internal/types"
	"gopkg.in/yaml.v3"
)

func main() {
	prompt := "Kalashtar, 6th level, sorcerer aberrante, background aberrant heir, standard array, spells e skills coerentes, equipamentos básicos"
	if len(os.Args) > 1 {
		prompt = strings.Join(os.Args[1:], " ")
	}

	dataDir := findDataDir()
	log.Printf("Loading content from %s...", dataDir)
	content, err := contentpack.LoadAllFromDataDir(dataDir)
	if err != nil {
		log.Fatalf("Failed to load content: %v", err)
	}
	log.Printf("Loaded: %d classes, %d species, %d backgrounds, %d feats, %d spells",
		len(content.Classes), len(content.Species), len(content.Backgrounds),
		len(content.Feats), len(content.Spells))

	log.Printf("Prompt: %s", prompt)
	log.Println("[LLM Parser] → extracting entities...")

	req := parsePrompt(prompt, content)
	log.Printf("Parsed: Species=%s Class=%s Lvl=%d Background=%s Method=%s",
		req.SpeciesID, req.Classes[0].ID, req.Level, req.BackgroundID, req.AbilityMethod)

	optimizeAbilityScores(req, content)

	log.Println("[Auto-Selector] → filling spells, skills, feats, equipment...")
	sel := auto.NewAutoSelector(content)
	sel.FillDefaults(req, prompt)
	fillFeats(req, content)
	log.Printf("  Spells: %d selected", len(req.Spells))
	for _, s := range req.Spells {
		log.Printf("    - %s (lvl %d, %s)", s.SpellID, s.Level, s.Source)
	}
	log.Printf("  Skills: %d selected", len(req.Skills))
	for _, s := range req.Skills {
		log.Printf("    - %s (%s)", s.Skill, s.Source)
	}
	log.Printf("  Feats: %d selected", len(req.Feats))
	for _, f := range req.Feats {
		log.Printf("    - %s (lvl %d)", f.FeatID, f.Level)
	}
	log.Printf("  Equipment: %d items", len(req.Equipment))
	for _, e := range req.Equipment {
		log.Printf("    - %s x%d", e.ItemID, e.Quantity)
	}

	log.Println("[Validator] → checking against content...")
	validator := engine.NewBuildValidator(content)
	if err := validator.Validate(*req); err != nil {
		log.Fatalf("Validation FAILED: %v", err)
	}
	log.Println("  Validation PASSED")

	log.Println("[Event Generator] → building events...")
	gen := engine.NewEventGenerator(content)
	evts, err := gen.BuildCharacterEvents(*req)
	if err != nil {
		log.Fatalf("Event generation FAILED: %v", err)
	}
	log.Printf("  Generated %d events:", len(evts))
	for _, e := range evts {
		log.Printf("    - %s", e.EventType())
	}

	log.Println("[Engine.Commit] → applying events to state...")
	applier := engine.NewApplier(content)
	state := sruntime.NewCampaignState()
	state.Settings = sruntime.CampaignSettings{}
	for _, evt := range evts {
		state = applier.Apply(state, evt)
	}
	charID := evts[0].(*events.CharacterCreatedEvent).CharacterID
	char, ok := state.Characters[charID]
	if !ok {
		log.Fatal("character not found after event replay")
	}
	log.Printf("  Character: %s | Level %d | HP %d/%d", char.Name, char.Level, char.HP.Current, char.HP.Max)

	log.Println("[Derive] → building character sheet...")
	sheet := derive.BuildCharacterSheet(*char, content)

	out, _ := yaml.Marshal(sheet)
	outputPath := "output/character.yaml"
	os.MkdirAll("output", 0755)
	if err := os.WriteFile(outputPath, out, 0644); err != nil {
		log.Printf("Warning: failed to write YAML: %v", err)
	}
	log.Printf("YAML saved to %s", outputPath)
	fmt.Println("\n=== CHARACTER SHEET (YAML) ===")
	fmt.Println(string(out))

	fmt.Println("\n=== SUMMARY ===")
	fmt.Printf("Name:      %s\n", sheet.Name)
	fmt.Printf("Level:     %d\n", sheet.Level)
	for _, c := range sheet.Classes {
		sc := ""
		if c.SubClass != nil {
			sc = fmt.Sprintf(" (%s)", *c.SubClass)
		}
		fmt.Printf("Class:     %s %s%s\n", c.Name, sc, func() string {
			for _, cs := range req.SubclassChoices {
				if cs.ClassID == c.ID {
					return ""
				}
			}
			return ""
		}())
	}
	fmt.Printf("Species:   %s\n", req.SpeciesID)
	fmt.Printf("AC:        %d\n", sheet.AC)
	fmt.Printf("HP:        %d/%d\n", sheet.HP.Current, sheet.HP.Max)
	fmt.Printf("PB:        +%d\n", sheet.ProficiencyBonus)
	fmt.Printf("Speed:     %d\n", sheet.Speed)
	fmt.Printf("Init:      +%d\n", sheet.InitBonus)
	if len(sheet.SpellcastingStats) > 0 {
		sc := sheet.SpellcastingStats[0]
		fmt.Printf("Spell DC:  %d\n", sc.SaveDC)
		fmt.Printf("Spell ATK: +%d\n", sc.AttackBonus)
	}
	fmt.Printf("Saves:     ")
	for _, ab := range types.AllAbilityScores {
		if v, ok := sheet.SavingThrows[ab]; ok {
			prof := false
			for _, ps := range char.Proficiencies.SavingThrows {
				if ps == ab {
					prof = true
					break
				}
			}
			if prof {
				fmt.Printf("%s%+d* ", ab, v)
			} else {
				fmt.Printf("%s%+d ", ab, v)
			}
		}
	}
	fmt.Println()
	fmt.Printf("Skills:    ")
	for _, sk := range types.AllSkills {
		if sv, ok := sheet.Skills[sk]; ok && sv.Proficiency != types.ProficiencyNone {
			fmt.Printf("%s%+d ", sk, sv.Total)
		}
	}
	fmt.Println()
	fmt.Printf("Feats:     ")
	for _, f := range char.Feats {
		fmt.Printf("%s ", f)
	}
	fmt.Println()
	fmt.Printf("Events:    %d generated\n", len(evts))
}

func parsePrompt(prompt string, content scontent.ResolvedContent) *engine.BuildRequest {
	lower := strings.ToLower(prompt)

	req := &engine.BuildRequest{
		Name:          extractName(prompt),
		AbilityMethod: "standard_array",
	}

	req.SpeciesID = extractSpecies(lower, content)
	req.BackgroundID = extractBackground(lower, content)
	req.Level = extractLevel(lower)
	clsID, subclassID := extractClass(lower, content)
	if clsID != "" {
		req.Classes = []engine.ClassBuildEntry{
			{ID: clsID, Level: req.Level},
		}
	}
	if subclassID != "" {
		req.SubclassChoices = []engine.SubclassChoice{
			{ClassID: clsID, SubclassID: subclassID, Level: subclassLevelForClass(clsID, content)},
		}
		req.Classes[0].SubclassID = &subclassID
	}
	req.AbilityScores = extractAbilityScores(lower)
	if req.AbilityMethod == "standard_array" {
	}

	return req
}

func extractName(prompt string) string {
	return "Character"
}

func extractSpecies(lower string, content scontent.ResolvedContent) types.SpeciesID {
	nameMap := []struct {
		alias string
		id    types.SpeciesID
	}{
		{"kalashtar", "kalashtar"},
		{"changeling", "changeling"},
		{"changelin", "changeling"},
		{"shifter", "shifter"},
		{"warforged", "warforged"},
		{"khoravar", "khoravar"},
		{"goliath", "goliath"},
		{"aarakocra", "aarakocra"},
		{"dragonborn", "dragonborn"},
		{"dwarf", "dwarf"},
		{"elf", "elf"},
		{"gnome", "gnome"},
		{"half-elf", "half-elf"},
		{"half-orc", "half-orc"},
		{"halfling", "halfling"},
		{"human", "human"},
		{"orc", "orc"},
		{"tiefling", "tiefling"},
	}
	for _, na := range nameMap {
		if strings.Contains(lower, na.alias) {
			if _, ok := content.Species[na.id]; ok {
				return na.id
			}
		}
	}
	return ""
}

func extractBackground(lower string, content scontent.ResolvedContent) types.BackgroundID {
	for id := range content.Backgrounds {
		if strings.Contains(lower, strings.ToLower(string(id))) {
			return id
		}
	}
	nameMap := map[string]types.BackgroundID{
		"aberrant heir": "aberrant-heir", "aberrant": "aberrant-heir",
		"acolyte": "acolyte", "sage": "sage", "criminal": "criminal",
		"soldier": "soldier", "noble": "noble", "guild artisan": "guild-artisan",
		"hermit": "hermit", "outlander": "outlander", "urchin": "urchin",
		"entertainer": "entertainer", "charlatan": "charlatan", "folk hero": "folk-hero",
		"archaeologis": "archaeologist", "artisan": "artisan",
	}
	for key, id := range nameMap {
		if strings.Contains(lower, key) {
			return id
		}
	}
	return ""
}

func extractLevel(lower string) int {
	clean := strings.NewReplacer(",", "", ".", "", "!", "", "?", "", ";", "", ":", "").Replace(lower)
	words := strings.Fields(clean)
	for i, w := range words {
		if w == "level" || w == "lvl" || w == "nivel" || w == "nível" {
			if i+1 < len(words) {
				if lvl, err := strconv.Atoi(words[i+1]); err == nil && lvl >= 1 && lvl <= 20 {
					return lvl
				}
			}
		}
		if i > 0 && (w == "level" || w == "lvl") {
			prev := words[i-1]
			numStr := strings.TrimSuffix(prev, "th")
			numStr = strings.TrimSuffix(numStr, "rd")
			numStr = strings.TrimSuffix(numStr, "nd")
			numStr = strings.TrimSuffix(numStr, "st")
			if lvl, err := strconv.Atoi(numStr); err == nil && lvl >= 1 && lvl <= 20 {
				return lvl
			}
		}
	}
	return 1
}

func extractClass(lower string, content scontent.ResolvedContent) (types.ClassID, types.SubClassID) {
	classAliases := map[string]types.ClassID{
		"sorcerer": "sorcerer", "sorcerer aberrante": "sorcerer",
		"wizard": "wizard", "fighter": "fighter", "barbarian": "barbarian",
		"cleric": "cleric", "druid": "druid", "bard": "bard",
		"rogue": "rogue", "monk": "monk", "paladin": "paladin",
		"ranger": "ranger", "warlock": "warlock", "artificer": "artificer",
	}
	subclassAliases := []struct {
		alias string
		id    types.SubClassID
	}{
		{"aberrante", "aberrant-sorcery"},
		{"aberrant mind", "aberrant-sorcery"},
		{"aberrant sorcery", "aberrant-sorcery"},
		{"aberrant", "aberrant-sorcery"},
		{"clockwork", "clockwork-sorcery"},
		{"draconic", "draconic-sorcery"},
		{"wild magic", "wild-magic-sorcery"},
		{"evocation", "evocation"},
		{"abjuration", "abjuration"},
	}

	var clsID types.ClassID
	var subID types.SubClassID

	// Check subclass first (more specific)
	for _, sa := range subclassAliases {
		if strings.Contains(lower, sa.alias) {
			subID = sa.id
			break
		}
	}
	for alias, id := range classAliases {
		if strings.Contains(lower, alias) {
			clsID = id
			break
		}
	}

	if clsID != "" {
		if _, ok := content.Classes[clsID]; !ok {
			clsID = ""
		}
	}

	return clsID, subID
}

func subclassLevelForClass(clsID types.ClassID, content scontent.ResolvedContent) int {
	if cls, ok := content.Classes[clsID]; ok {
		for _, lvl := range cls.Levels {
			for _, f := range lvl.Features {
				if f == types.FeatID("class."+string(clsID)+".subclass") {
					return lvl.Level
				}
			}
		}
	}
	return 3
}

func extractAbilityScores(lower string) types.AbilityScores {
	if strings.Contains(lower, "standard array") || strings.Contains(lower, "standard_array") {
		return types.AbilityScores{STR: 8, DEX: 14, CON: 13, INT: 10, WIS: 12, CHA: 15}
	}
	return types.AbilityScores{STR: 8, DEX: 12, CON: 15, INT: 10, WIS: 14, CHA: 17}
}

func optimizeAbilityScores(req *engine.BuildRequest, content scontent.ResolvedContent) {
	classPriority := map[types.ClassID][]types.AbilityScore{
		"sorcerer": {types.CHA, types.CON, types.DEX, types.INT, types.WIS, types.STR},
		"wizard":   {types.INT, types.CON, types.DEX, types.WIS, types.CHA, types.STR},
		"warlock":  {types.CHA, types.CON, types.DEX, types.INT, types.WIS, types.STR},
		"bard":     {types.CHA, types.DEX, types.CON, types.INT, types.WIS, types.STR},
		"cleric":   {types.WIS, types.CON, types.STR, types.DEX, types.CHA, types.INT},
		"druid":    {types.WIS, types.CON, types.DEX, types.INT, types.CHA, types.STR},
		"fighter":  {types.STR, types.CON, types.DEX, types.WIS, types.CHA, types.INT},
		"paladin":  {types.STR, types.CHA, types.CON, types.DEX, types.WIS, types.INT},
		"ranger":   {types.DEX, types.WIS, types.CON, types.STR, types.CHA, types.INT},
		"monk":     {types.DEX, types.WIS, types.CON, types.STR, types.CHA, types.INT},
		"rogue":    {types.DEX, types.CON, types.INT, types.CHA, types.WIS, types.STR},
		"barbarian": {types.STR, types.CON, types.DEX, types.WIS, types.CHA, types.INT},
		"artificer": {types.INT, types.CON, types.DEX, types.WIS, types.CHA, types.STR},
	}

	var priority []types.AbilityScore
	for _, c := range req.Classes {
		if p, ok := classPriority[c.ID]; ok {
			priority = p
			break
		}
	}
	if len(priority) == 0 {
		priority = []types.AbilityScore{types.STR, types.DEX, types.CON, types.INT, types.WIS, types.CHA}
	}

	scores := []int{15, 14, 13, 12, 10, 8}
	req.AbilityScores = types.AbilityScores{}
	for i, ab := range priority {
		if i < len(scores) {
			switch ab {
			case types.STR:
				req.AbilityScores.STR = scores[i]
			case types.DEX:
				req.AbilityScores.DEX = scores[i]
			case types.CON:
				req.AbilityScores.CON = scores[i]
			case types.INT:
				req.AbilityScores.INT = scores[i]
			case types.WIS:
				req.AbilityScores.WIS = scores[i]
			case types.CHA:
				req.AbilityScores.CHA = scores[i]
			}
		}
	}
}

func fillFeats(req *engine.BuildRequest, content scontent.ResolvedContent) {
	bg, ok := content.Backgrounds[req.BackgroundID]
	if ok && bg.Feat != nil {
		hasFeat := false
		for _, f := range req.Feats {
			if f.FeatID == *bg.Feat {
				hasFeat = true
				break
			}
		}
		if !hasFeat {
			req.Feats = append(req.Feats, engine.FeatChoice{FeatID: *bg.Feat, Level: 1})
		}
	}

	asiLevels := []int{4, 8, 12, 16, 19}
	for _, lvl := range asiLevels {
		if lvl <= req.Level {
			hasASI := false
			for _, f := range req.Feats {
				if f.FeatID == "ability-score-improvement" && f.Level == lvl {
					hasASI = true
					break
				}
			}
			if !hasASI {
				req.Feats = append(req.Feats, engine.FeatChoice{FeatID: "ability-score-improvement", Level: lvl})
			}
		}
	}
}

func findDataDir() string {
	candidates := []string{
		"data",
		"../../data",
		filepath.Join(func() string {
			exe, _ := os.Executable()
			return filepath.Dir(exe)
		}(), "data"),
	}
	for _, d := range candidates {
		info, err := os.Stat(d)
		if err == nil && info.IsDir() {
			return d
		}
	}
	log.Fatal("data directory not found")
	return ""
}
