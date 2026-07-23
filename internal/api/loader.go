package api

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	scontent "github.com/hadnu/arcanum/internal/schemas/content"
	"github.com/hadnu/arcanum/internal/types"
)

func LoadAllFromAPI(client *Client) (scontent.ResolvedContent, error) {
	cachePath := cacheFilePath()
	if data, err := os.ReadFile(cachePath); err == nil {
		var cached scontent.ResolvedContent
		if err := json.Unmarshal(data, &cached); err == nil {
			log.Printf("Loaded SRD data from cache (%d items)", len(cached.Spells)+len(cached.Classes))
			return cached, nil
		}
	}
	resolved := scontent.NewResolvedContent()

	if err := loadClasses(client, &resolved); err != nil {
		return resolved, fmt.Errorf("classes: %w", err)
	}
	if err := loadSpecies(client, &resolved); err != nil {
		return resolved, fmt.Errorf("species: %w", err)
	}
	if err := loadBackgrounds(client, &resolved); err != nil {
		return resolved, fmt.Errorf("backgrounds: %w", err)
	}
	if err := loadFeats(client, &resolved); err != nil {
		return resolved, fmt.Errorf("feats: %w", err)
	}
	if err := loadSpells(client, &resolved); err != nil {
		return resolved, fmt.Errorf("spells: %w", err)
	}
	if err := loadItems(client, &resolved); err != nil {
		return resolved, fmt.Errorf("items: %w", err)
	}
	if err := loadMonsters(client, &resolved); err != nil {
		return resolved, fmt.Errorf("monsters: %w", err)
	}

	writeCache(resolved, cachePath)
	return resolved, nil
}

func loadClasses(client *Client, resolved *scontent.ResolvedContent) error {
	items, err := client.ListClasses()
	if err != nil {
		return err
	}
	log.Printf("Loading %d classes from SRD 5.2 API...", len(items))
	for _, item := range items {
		data, err := client.GetClass(item.Slug)
		if err != nil {
			log.Printf("  WARN: failed to load class %s: %v", item.Slug, err)
			continue
		}
		class := convertClass(data)
		resolved.Classes[class.ID] = &class
	}
	return nil
}

func convertClass(data *ClassData) scontent.Class {
	props := data.Properties

	saves := parseSavingThrows(props.CoreTraits["Saving Throw Proficiencies"])

	class := scontent.Class{
		ID:   types.ClassID(data.Slug),
		Name: data.Name,
	}

	if hd, ok := props.CoreTraits["Hit Point Die"]; ok {
		switch {
		case strings.Contains(hd, "D6") || strings.Contains(hd, "d6"):
			class.HitDie = types.HitDieD6
		case strings.Contains(hd, "D8") || strings.Contains(hd, "d8"):
			class.HitDie = types.HitDieD8
		case strings.Contains(hd, "D10") || strings.Contains(hd, "d10"):
			class.HitDie = types.HitDieD10
		case strings.Contains(hd, "D12") || strings.Contains(hd, "d12"):
			class.HitDie = types.HitDieD12
		}
	}

	for _, f := range props.FeaturesByLevel {
		level := 0
		fmt.Sscanf(f.Level, "%d", &level)
		pb := 0
		fmt.Sscanf(f.ProficiencyBonus, "%d", &pb)

		entry := scontent.LevelEntry{
			Level:     level,
			ProfBonus: pb,
		}
		class.Levels = append(class.Levels, entry)
	}

	class.SavingThrows = saves
	if primary, ok := props.CoreTraits["Primary Ability"]; ok {
		class.PrimaryAbility = parsePrimaryAbility(primary)
	}

	return class
}

func parseSavingThrows(s string) []types.AbilityScore {
	if s == "" {
		return nil
	}
	var result []types.AbilityScore
	parts := strings.Split(s, " and ")
	for _, p := range parts {
		p = strings.TrimSpace(p)
		switch p {
		case "Strength":
			result = append(result, types.STR)
		case "Dexterity":
			result = append(result, types.DEX)
		case "Constitution":
			result = append(result, types.CON)
		case "Intelligence":
			result = append(result, types.INT)
		case "Wisdom":
			result = append(result, types.WIS)
		case "Charisma":
			result = append(result, types.CHA)
		}
	}
	return result
}

func parsePrimaryAbility(s string) []types.AbilityScore {
	parts := strings.Split(s, " or ")
	var result []types.AbilityScore
	for _, p := range parts {
		p = strings.TrimSpace(p)
		switch p {
		case "Strength":
			result = append(result, types.STR)
		case "Dexterity":
			result = append(result, types.DEX)
		case "Constitution":
			result = append(result, types.CON)
		case "Intelligence":
			result = append(result, types.INT)
		case "Wisdom":
			result = append(result, types.WIS)
		case "Charisma":
			result = append(result, types.CHA)
		}
	}
	return result
}

func loadSpecies(client *Client, resolved *scontent.ResolvedContent) error {
	items, err := client.ListSpecies()
	if err != nil {
		return err
	}
	log.Printf("Loading %d species from SRD 5.2 API...", len(items))
	for _, item := range items {
		data, err := client.GetSpecies(item.Slug)
		if err != nil {
			log.Printf("  WARN: failed to load species %s: %v", item.Slug, err)
			continue
		}
		species := convertSpecies(data)
		resolved.Species[species.ID] = &species
	}
	return nil
}

func convertSpecies(data *SpeciesData) scontent.Species {
	props := data.Properties
	size := types.SizeMedium
	if strings.HasPrefix(strings.ToLower(props.Size), "small") {
		size = types.SizeSmall
	}

	speed := types.Speed{Walk: 30}
	fmt.Sscanf(props.Speed, "%d feet", &speed.Walk)

	var languages []string
	ct := types.CreatureHumanoid
	switch strings.ToLower(props.CreatureType) {
	case "humanoid":
		ct = types.CreatureHumanoid
	case "fey":
		ct = types.CreatureFey
	}

	return scontent.Species{
		ID:           types.SpeciesID(data.Slug),
		Name:         data.Name,
		Size:         size,
		Speed:        speed,
		Languages:    languages,
		CreatureType: ct,
	}
}

func loadBackgrounds(client *Client, resolved *scontent.ResolvedContent) error {
	items, err := client.ListBackgrounds()
	if err != nil {
		return err
	}
	log.Printf("Loading %d backgrounds from SRD 5.2 API...", len(items))
	for _, item := range items {
		data, err := client.GetBackground(item.Slug)
		if err != nil {
			log.Printf("  WARN: failed to load background %s: %v", item.Slug, err)
			continue
		}
		bg := convertBackground(data)
		resolved.Backgrounds[bg.ID] = &bg
	}
	return nil
}

func convertBackground(data *BackgroundData) scontent.Background {
	props := data.Properties
	var skills []types.Skill
	for _, s := range props.SkillProficiencies {
		skill := types.Skill(strings.ToLower(strings.ReplaceAll(s, " ", "-")))
		skills = append(skills, skill)
	}

	var featID *types.FeatID
	if props.Feat != "" {
		f := types.FeatID(strings.ToLower(strings.ReplaceAll(props.Feat, " ", "-")))
		featID = &f
	}

	return scontent.Background{
		ID:     types.BackgroundID(data.Slug),
		Name:   data.Name,
		Skills: skills,
		Feat:   featID,
	}
}

func loadFeats(client *Client, resolved *scontent.ResolvedContent) error {
	items, err := client.ListFeats()
	if err != nil {
		return err
	}
	log.Printf("Loading %d feats from SRD 5.2 API...", len(items))
	for _, item := range items {
		data, err := client.GetFeat(item.Slug)
		if err != nil {
			log.Printf("  WARN: failed to load feat %s: %v", item.Slug, err)
			continue
		}
		feat := convertFeat(data)
		resolved.Feats[feat.ID] = &feat
	}
	return nil
}

func convertFeat(data *FeatData) scontent.Feat {
	return scontent.Feat{
		ID:   types.FeatID(data.Slug),
		Name: data.Name,
	}
}

func loadSpells(client *Client, resolved *scontent.ResolvedContent) error {
	items, err := client.ListSpells()
	if err != nil {
		return err
	}
	log.Printf("Loading %d spells from SRD 5.2 API...", len(items))
	for _, item := range items {
		data, err := client.GetSpell(item.Slug)
		if err != nil {
			log.Printf("  WARN: failed to load spell %s: %v", item.Slug, err)
			continue
		}
		spell := convertSpell(data)
		resolved.Spells[spell.ID] = &spell
	}
	return nil
}

func convertSpell(data *SpellData) scontent.Spell {
	props := data.Properties

	school := types.SpellSchool(props.School)

	var save *types.AbilityScore
	if strings.Contains(props.Description, "saving throw") {
		lower := strings.ToLower(props.Description)
		switch {
		case strings.Contains(lower, "strength saving throw"):
			save = ptr(types.STR)
		case strings.Contains(lower, "dexterity saving throw"):
			save = ptr(types.DEX)
		case strings.Contains(lower, "constitution saving throw"):
			save = ptr(types.CON)
		case strings.Contains(lower, "intelligence saving throw"):
			save = ptr(types.INT)
		case strings.Contains(lower, "wisdom saving throw"):
			save = ptr(types.WIS)
		case strings.Contains(lower, "charisma saving throw"):
			save = ptr(types.CHA)
		}
	}

	hasAttackRoll := strings.Contains(strings.ToLower(props.Description), "attack roll")

	return scontent.Spell{
		ID:            types.SpellID(data.Slug),
		Name:          props.Name,
		Level:         props.Level,
		School:        school,
		Range:         props.Range,
		Duration:      props.Duration,
		Concentration: props.Concentration,
		Save:          save,
		Attack:        hasAttackRoll,
	}
}

func loadItems(client *Client, resolved *scontent.ResolvedContent) error {
	items, err := client.ListItems()
	if err != nil {
		return err
	}
	log.Printf("Loading %d items from SRD 5.2 API...", len(items))
	for _, item := range items {
		data, err := client.GetItem(item.Slug)
		if err != nil {
			log.Printf("  WARN: failed to load item %s: %v", item.Slug, err)
			continue
		}
		converted := convertItem(data)
		resolved.Items[converted.ID] = &converted
	}
	return nil
}

func convertItem(data *ItemData) scontent.ItemDef {
	props := data.Properties
	return scontent.ItemDef{
		ID:     types.ItemDefinitionID(data.Slug),
		Name:   props.Name,
		Type:   props.Type,
		Rarity: props.Rarity,
	}
}

func loadMonsters(client *Client, resolved *scontent.ResolvedContent) error {
	items, err := client.ListMonsters()
	if err != nil {
		return err
	}
	log.Printf("Loading %d monsters from SRD 5.2 API...", len(items))
	for _, item := range items {
		data, err := client.GetMonster(item.Slug)
		if err != nil {
			log.Printf("  WARN: failed to load monster %s: %v", item.Slug, err)
			continue
		}
		monster := convertMonster(data)
		resolved.Monsters[monster.ID] = &monster
	}
	return nil
}

func convertMonster(data *MonsterData) scontent.Monster {
	props := data.Properties

	size := types.SizeMedium
	switch strings.ToLower(props.Size) {
	case "tiny":
		size = types.SizeTiny
	case "small":
		size = types.SizeSmall
	case "large":
		size = types.SizeLarge
	case "huge":
		size = types.SizeHuge
	case "gargantuan":
		size = types.SizeGargantuan
	}

	ct := types.CreatureHumanoid
	switch props.CreatureType {
	case "aberration":
		ct = types.CreatureAberration
	case "beast":
		ct = types.CreatureBeast
	case "celestial":
		ct = types.CreatureCelestial
	case "construct":
		ct = types.CreatureConstruct
	case "dragon":
		ct = types.CreatureDragon
	case "elemental":
		ct = types.CreatureElemental
	case "fey":
		ct = types.CreatureFey
	case "fiend":
		ct = types.CreatureFiend
	case "giant":
		ct = types.CreatureGiant
	case "humanoid":
		ct = types.CreatureHumanoid
	case "monstrosity":
		ct = types.CreatureMonstrosity
	case "ooze":
		ct = types.CreatureOoze
	case "plant":
		ct = types.CreaturePlant
	case "undead":
		ct = types.CreatureUndead
	}

	return scontent.Monster{
		ID:   types.MonsterStatblockID(data.Slug),
		Name: data.Name,
		Size: size,
		Type: ct,
		AC:   props.AC,
		HP:   props.HitDice,
		Speed: types.Speed{
			Walk:  props.Speed.Walk,
			Fly:   props.Speed.Fly,
			Swim:  props.Speed.Swim,
			Climb: props.Speed.Climb,
			Burrow: props.Speed.Burrow,
		},
		AbilityScores: types.AbilityScores{
			STR: props.Stats.STR,
			DEX: props.Stats.DEX,
			CON: props.Stats.CON,
			INT: props.Stats.INT,
			WIS: props.Stats.WIS,
			CHA: props.Stats.CHA,
		},
		CR: props.CR,
	}
}

func ptr[T any](v T) *T {
	return &v
}

func cacheFilePath() string {
	cacheDir, err := os.UserCacheDir()
	if err != nil {
		cacheDir = "/tmp"
	}
	return filepath.Join(cacheDir, "arcanum-srd-cache.json")
}

func writeCache(resolved scontent.ResolvedContent, path string) {
	data, err := json.Marshal(resolved)
	if err != nil {
		log.Printf("WARN: failed to marshal cache: %v", err)
		return
	}
	if err := os.WriteFile(path, data, 0644); err != nil {
		log.Printf("WARN: failed to write cache: %v", err)
	}
}
