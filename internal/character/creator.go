package character

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	scontent "github.com/hadnu/arcanum/internal/schemas/content"
	"github.com/hadnu/arcanum/internal/schemas/events"
	"github.com/hadnu/arcanum/internal/types"
)

type Creator struct {
	Content scontent.ResolvedContent
	Result  CreationResult
}

type CreationResult struct {
	Event events.CharacterCreatedEvent
	Sheet CharacterSheetView
}

type CharacterSheetView struct {
	Name      string
	Level     int
	Class     string
	Species   string
	Background string
	HP        string
	AC        int
	InitBonus int
	ProfBonus int
	Scores    types.AbilityScores
	Saves     map[types.AbilityScore]int
	Skills    map[types.Skill]*SkillView
	Feats     []string
	Equipment []string
}

type SkillView struct {
	Total int
	Label string
}

func NewCreator(content scontent.ResolvedContent) *Creator {
	return &Creator{Content: content}
}

func (c *Creator) RunInteractive() {
	scanner := bufio.NewScanner(os.Stdin)

	name := prompt(scanner, "Character name: ")

	// Choose first class
	classes := []scontent.Class{}
	classes = append(classes, c.chooseClass(scanner))

	// Optional multiclass
	if promptYesNo(scanner, "\nAdd a second class? (y/N): ") {
		secondClass := c.chooseClass(scanner)
		if c.validateMulticlassPrereqs(classes[0], secondClass, nil) {
			classes = append(classes, secondClass)
		} else {
			fmt.Println("Prerequisites not met. Continuing with single class.")
		}
	}

	bg := c.chooseBackground(scanner)
	species := c.chooseSpecies(scanner)

	// Combine ability score bonuses from background
	scores := c.chooseAbilityScores(scanner, classes)

	skills := c.chooseSkills(scanner, classes, bg)

	hp := computeHP(classes[0].HitDie, scores.CON, 1)

	// Spell selection for each spellcasting class
	var allSpells []*scontent.Spell
	for _, cls := range classes {
		spells := c.chooseSpells(scanner, cls)
		allSpells = append(allSpells, spells...)
	}

	fmt.Println()
	log.Printf("Creating %s — %s %s %s", name, formatClassNames(classes), bg.Name, species.Name)
	log.Printf("HP: %d, AC: %d, Prof: +%d", hp, 10+((scores.DEX-10)/2), 2)

	feats := resolveFeats(c.Content, bg, classes[0])

	equipment := resolveEquipment(c.Content, classes[0], bg)

	skillLevels := map[types.Skill]types.ProficiencyLevel{}
	for _, s := range bg.Skills {
		skillLevels[s] = types.ProficiencyProficient
	}
	for sk, selected := range skills {
		if selected {
			if _, ok := skillLevels[sk]; !ok {
				skillLevels[sk] = types.ProficiencyProficient
			}
		}
	}

	var classEntries []events.ClassEntry
	for _, cls := range classes {
		classEntries = append(classEntries, events.ClassEntry{ClassID: cls.ID, Level: 1})
	}

	c.Result = CreationResult{
		Event: events.CharacterCreatedEvent{
			CharacterID:   types.NewCharacterID(),
			Name:          name,
			SpeciesID:     species.ID,
			BackgroundID:  bg.ID,
			Classes:       classEntries,
			Level:         1,
			AbilityScores: scores,
			MaxHP:         hp,
			SavingThrows:  classes[0].SavingThrows,
			Skills:        skillLevels,
		},
		Sheet: c.buildSheetView(name, classes, bg, species, scores, skills, hp, feats, equipment),
	}
}

func promptYesNo(scanner *bufio.Scanner, text string) bool {
	for {
		fmt.Print(text)
		if !scanner.Scan() {
			log.Fatal("input error")
		}
		val := strings.ToLower(strings.TrimSpace(scanner.Text()))
		if val == "y" || val == "yes" {
			return true
		}
		if val == "n" || val == "no" || val == "" {
			return false
		}
		fmt.Println("Please enter y or n.")
	}
}

func formatClassNames(classes []scontent.Class) string {
	if len(classes) == 1 {
		return classes[0].Name
	}
	var names []string
	for _, c := range classes {
		names = append(names, fmt.Sprintf("%s 1", c.Name))
	}
	return strings.Join(names, " / ")
}

func getPrimaryAbility(class scontent.Class) types.AbilityScore {
	if len(class.PrimaryAbility) > 0 {
		return class.PrimaryAbility[0]
	}
	return types.STR
}

func (c *Creator) validateMulticlassPrereqs(currentClass, newClass scontent.Class, scores *types.AbilityScores) bool {
	currentPrimary := getPrimaryAbility(currentClass)
	newPrimary := getPrimaryAbility(newClass)

	currentScore := scoreOf(nil, currentPrimary)
	newScore := scoreOf(nil, newPrimary)

	if currentScore >= 13 && newScore >= 13 {
		return true
	}
	fmt.Printf("Prerequisites not met: %s requires %s >= 13 (have %d), %s requires %s >= 13 (have %d)\n",
		currentClass.Name, currentPrimary, currentScore, newClass.Name, newPrimary, newScore)
	return false
}
	for {
		fmt.Print(text)
		if !scanner.Scan() {
			log.Fatal("input error")
		}
		val := strings.TrimSpace(scanner.Text())
		if val != "" {
			return val
		}
	}
}

func promptSelect(scanner *bufio.Scanner, text string, max int) int {
	for {
		fmt.Print(text)
		if !scanner.Scan() {
			log.Fatal("input error")
		}
		val, err := strconv.Atoi(strings.TrimSpace(scanner.Text()))
		if err != nil || val < 1 || val > max {
			fmt.Printf("Enter a number between 1 and %d.\n", max)
			continue
		}
		return val
	}
}

func (c *Creator) chooseClass(scanner *bufio.Scanner) scontent.Class {
	classes := sortedClasses(c.Content.Classes)
	fmt.Println("\n── Class ──")
	for i, cl := range classes {
		saves := ""
		for _, s := range cl.SavingThrows {
			saves += " " + string(s)
		}
		fmt.Printf("  %2d. %-12s (HD: %s, Saves:%s)\n", i+1, cl.Name, cl.HitDie, saves)
	}
	idx := promptSelect(scanner, "Choose class (1-12): ", len(classes))
	return classes[idx-1]
}

func (c *Creator) chooseBackground(scanner *bufio.Scanner) scontent.Background {
	bgs := sortedBackgrounds(c.Content.Backgrounds)
	fmt.Println("\n── Background ──")
	for i, bg := range bgs {
		feat := ""
		if bg.Feat != nil {
			if f, ok := c.Content.Feats[*bg.Feat]; ok {
				feat = ", Feat: " + f.Name
			}
		}
		skills := ""
		for _, s := range bg.Skills {
			skills += " " + string(s)
		}
		fmt.Printf("  %2d. %-14s (Skills:%s%s)\n", i+1, bg.Name, skills, feat)
	}
	idx := promptSelect(scanner, "Choose background (1-16): ", len(bgs))
	return bgs[idx-1]
}

func (c *Creator) chooseSpecies(scanner *bufio.Scanner) scontent.Species {
	species := sortedSpecies(c.Content.Species)
	fmt.Println("\n── Species ──")
	for i, sp := range species {
		fmt.Printf("  %2d. %-12s (%s, %dft)\n", i+1, sp.Name, string(sp.Size), sp.Speed.Walk)
	}
	idx := promptSelect(scanner, "Choose species (1-10): ", len(species))
	return species[idx-1]
}

func (c *Creator) chooseAbilityScores(scanner *bufio.Scanner, classes []scontent.Class) types.AbilityScores {
	fmt.Println("\n── Ability Scores ──")
	fmt.Println("  Standard Array: 15, 14, 13, 12, 10, 8")
	fmt.Printf("  Primary: %v\n", getPrimaryAbilities(classes))

	array := []int{15, 14, 13, 12, 10, 8}
	abilities := []types.AbilityScore{types.STR, types.DEX, types.CON, types.INT, types.WIS, types.CHA}
	result := types.AbilityScores{}
	used := make([]bool, 6)

	assign := func(ab types.AbilityScore) int {
		fmt.Printf("\n  %s (available:", string(ab))
		for j, v := range array {
			if !used[j] {
				fmt.Printf(" %d", v)
			}
		}
		fmt.Print("): ")
		if !scanner.Scan() {
			log.Fatal("input error")
		}
		val, err := strconv.Atoi(strings.TrimSpace(scanner.Text()))
		if err != nil {
			for j, v := range array {
				if !used[j] {
					used[j] = true
					return v
				}
			}
		}
		for j, v := range array {
			if !used[j] && v == val {
				used[j] = true
				return val
			}
		}
		for j, v := range array {
			if !used[j] {
				used[j] = true
				return v
			}
		}
		return 8
	}

	// Assign primary abilities first for all classes
	primaryAbilities := getPrimaryAbilities(classes)
	for _, ab := range primaryAbilities {
		switch ab {
		case types.STR:
			result.STR = assign(ab)
		case types.DEX:
			result.DEX = assign(ab)
		case types.CON:
			result.CON = assign(ab)
		case types.INT:
			result.INT = assign(ab)
		case types.WIS:
			result.WIS = assign(ab)
		case types.CHA:
			result.CHA = assign(ab)
		}
	}

	// Fill remaining abilities
	for _, ab := range abilities {
		if scoreOf(result, ab) != 0 {
			continue
		}
		switch ab {
		case types.STR:
			result.STR = assign(ab)
		case types.DEX:
			result.DEX = assign(ab)
		case types.CON:
			result.CON = assign(ab)
		case types.INT:
			result.INT = assign(ab)
		case types.WIS:
			result.WIS = assign(ab)
		case types.CHA:
			result.CHA = assign(ab)
		}
	}
	return result
}

func getPrimaryAbilities(classes []scontent.Class) []types.AbilityScore {
	var primary []types.AbilityScore
	seen := make(map[types.AbilityScore]bool)
	for _, cls := range classes {
		for _, ab := range cls.PrimaryAbility {
			if !seen[ab] {
				primary = append(primary, ab)
				seen[ab] = true
			}
		}
	}
	return primary
}

func (c *Creator) chooseSkills(scanner *bufio.Scanner, classes []scontent.Class, bg scontent.Background) map[types.Skill]bool {
	skills := map[types.Skill]bool{}

	for _, s := range bg.Skills {
		skills[s] = true
	}

	chosen := len(skills)

	fmt.Println("\n── Skills ──")
	fmt.Printf("  Auto from background: %v\n", bg.Skills)

	// Combine skill choices from all classes
	var allChoices []struct {
		Skill  types.Skill
		Choose int
		From   []types.Skill
	}
	for _, cls := range classes {
		for _, si := range cls.Proficiencies.Skills {
			allChoices = append(allChoices, si)
		}
	}

	for _, choice := range allChoices {
		need := choice.Choose
		for need > 0 {
			fmt.Printf("\n  Choose %d more skill(s) from %s:\n", need, cls.Name)
			available := listClassSkills(cls)
			for i, sk := range available {
				taken := ""
				if skills[sk] {
					taken = " [taken]"
				}
				fmt.Printf("    %2d. %s%s\n", i+1, string(sk), taken)
			}
			fmt.Print("  Pick: ")
			if !scanner.Scan() {
				log.Fatal("input error")
			}
			val, err := strconv.Atoi(strings.TrimSpace(scanner.Text()))
			if err != nil || val < 1 || val > len(available) {
				fmt.Println("  Invalid. Skip.")
				break
			}
			pick := available[val-1]
			if skills[pick] {
				fmt.Println("  Already taken.")
				continue
			}
			skills[pick] = true
			need--
		}
	}
	return skills
}

func (c *Creator) buildSheetView(
	name string,
	classes []scontent.Class,
	bg scontent.Background,
	species scontent.Species,
	scores types.AbilityScores,
	skillChoices map[types.Skill]bool,
	hp int,
	feats []string,
	equipment []string,
) CharacterSheetView {
	pb := 2
	initBonus := abilityMod(scores.DEX)
	ac := 10 + abilityMod(scores.DEX)

	saves := map[types.AbilityScore]int{}
	for _, ab := range types.AllAbilityScores {
		bonus := abilityMod(scoreOf(scores, ab))
		saves[ab] = bonus
	}
	// Add proficiency from all classes' saving throws
	for _, cls := range classes {
		for _, ab := range cls.SavingThrows {
			saves[ab] = saves[ab] + pb
		}
	}

	skills := map[types.Skill]*SkillView{}
	for _, skill := range types.AllSkills {
		ability := types.SkillAbility[skill]
		bonus := abilityMod(scoreOf(scores, ability))
		label := fmt.Sprintf("%+d", bonus)
		if skillChoices[skill] {
			bonus += pb
			label = fmt.Sprintf("%+d (prof)", bonus)
		}
		skills[skill] = &SkillView{
			Total: bonus,
			Label: label,
		}
	}

	// Format class names for display
	var classNames []string
	for _, cls := range classes {
		classNames = append(classNames, fmt.Sprintf("%s 1", cls.Name))
	}

	return CharacterSheetView{
		Name:       name,
		Level:      1,
		Class:      strings.Join(classNames, " / "),
		Species:    species.Name,
		Background: bg.Name,
		HP:         fmt.Sprintf("%d/%d", hp, hp),
		AC:         ac,
		InitBonus:  initBonus,
		ProfBonus:  pb,
		Scores:     scores,
		Saves:      saves,
		Skills:     skills,
		Feats:      feats,
		Equipment:  equipment,
	}
}

func resolveFeats(content scontent.ResolvedContent, bg scontent.Background, class scontent.Class) []string {
	var feats []string
	if bg.Feat != nil {
		if f, ok := content.Feats[*bg.Feat]; ok {
			feats = append(feats, f.Name)
		}
	}
	if class.Levels[0].Feat != nil {
		if f, ok := content.Feats[*class.Levels[0].Feat]; ok {
			feats = append(feats, f.Name)
		}
	}
	return feats
}

func resolveEquipment(content scontent.ResolvedContent, class scontent.Class, bg scontent.Background) []string {
	var items []string
	for _, eq := range class.Proficiencies.Armor {
		items = append(items, eq)
	}
	for _, eq := range bg.Skills {
		items = append(items, string(eq))
	}
	return items
}

func computeHP(hitDie types.HitDie, con int, level int) int {
	hd := hitDieMax(hitDie)
	return hd + abilityMod(con) + (level-1)*((hd/2)+1+abilityMod(con))
}

func hitDieMax(hd types.HitDie) int {
	switch hd {
	case types.HitDieD6:
		return 6
	case types.HitDieD8:
		return 8
	case types.HitDieD10:
		return 10
	case types.HitDieD12:
		return 12
	default:
		return 8
	}
}

func abilityMod(score int) int {
	return (score - 10) / 2
}

func scoreOf(s types.AbilityScores, ab types.AbilityScore) int {
	switch ab {
	case types.STR:
		return s.STR
	case types.DEX:
		return s.DEX
	case types.CON:
		return s.CON
	case types.INT:
		return s.INT
	case types.WIS:
		return s.WIS
	case types.CHA:
		return s.CHA
	default:
		return 10
	}
}

func (c *Creator) chooseSpells(scanner *bufio.Scanner, cls scontent.Class) []*scontent.Spell {
	// Check if class is a spellcaster by looking at spellcasting in levels
	isSpellcaster := false
	var spellcastingProfile *scontent.SpellcastingProfile
	for _, level := range cls.Levels {
		if level.SpellSlots != nil && len(level.SpellSlots) > 0 {
			isSpellcaster = true
			break
		}
	}
	// Get spellcasting profile from class or subclass
	if cls.Spellcasting != nil {
		spellcastingProfile = cls.Spellcasting
	}

	if !isSpellcaster {
		return nil
	}

	browser := NewSpellBrowser(c.Content)

	fmt.Println("\n── Spell Selection ──")
	fmt.Println("  1. Browse all spells (for reference)")
	fmt.Println("  2. Select spells for this character")
	fmt.Print("Choose: ")

	if !scanner.Scan() {
		return nil
	}
	choice := strings.TrimSpace(scanner.Text())

	switch choice {
	case "1":
		browser.RunInteractive(scanner)
	case "2":
		// Get spellcasting limits from class data
		var maxSpells, cantrips int
		for _, level := range cls.Levels {
			if level.Level == 1 {
				if level.CantripsKnown > 0 {
					cantrips = level.CantripsKnown
				}
				if level.PreparedSpells > 0 {
					maxSpells = level.PreparedSpells
				} else if level.SpellSlots != nil {
					// For known casters, use max spells known at level 1
					// Default to 2 for most classes
					if maxSpells == 0 {
						maxSpells = 4
					}
				}
				break
			}
		}
		// Fallback defaults
		if maxSpells == 0 {
			maxSpells = 4
		}
		if cantrips == 0 {
			cantrips = 2
		}

		return browser.SelectSpellsForCharacter(scanner, cls.ID, maxSpells, cantrips)
	}

	return nil
}
