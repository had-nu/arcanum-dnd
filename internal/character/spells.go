package character

import (
	"bufio"
	"fmt"
	"os"
	"sort"
	"strings"

	scontent "github.com/hadnu/arcanum/internal/schemas/content"
	"github.com/hadnu/arcanum/internal/types"
)

type SpellBrowser struct {
	Content scontent.ResolvedContent
	Spells  []*scontent.Spell
}

func NewSpellBrowser(content scontent.ResolvedContent) *SpellBrowser {
	spells := make([]*scontent.Spell, 0, len(content.Spells))
	for _, s := range content.Spells {
		spells = append(spells, s)
	}
	sort.Slice(spells, func(i, j int) bool {
		if spells[i].Level != spells[j].Level {
			return spells[i].Level < spells[j].Level
		}
		return spells[i].Name < spells[j].Name
	})
	return &SpellBrowser{Content: content, Spells: spells}
}

func (sb *SpellBrowser) RunInteractive(scanner *bufio.Scanner) {
	for {
		fmt.Println("\n═══════════════════════════════════════════════════════════")
		fmt.Println("                     SPELLS BOOK")
		fmt.Println("═══════════════════════════════════════════════════════════")
		fmt.Println("  1. Cantrips (Level 0)")
		fmt.Println("  2. Level 1 Spells")
		fmt.Println("  3. Level 2 Spells")
		fmt.Println("  4. Level 3 Spells")
		fmt.Println("  5. Level 4 Spells")
		fmt.Println("  6. Level 5 Spells")
		fmt.Println("  7. Level 6 Spells")
		fmt.Println("  8. Level 7 Spells")
		fmt.Println("  9. Level 8 Spells")
		fmt.Println(" 10. Level 9 Spells")
		fmt.Println(" 11. All Spells")
		fmt.Println(" 12. Search by Name")
		fmt.Println("  0. Back")
		fmt.Println("═══════════════════════════════════════════════════════════")

		fmt.Print("Choose: ")
		if !scanner.Scan() {
			return
		}
		choice := strings.TrimSpace(scanner.Text())

		switch choice {
		case "0":
			return
		case "1":
			sb.browseByLevel(scanner, 0, "Cantrips")
		case "2":
			sb.browseByLevel(scanner, 1, "Level 1")
		case "3":
			sb.browseByLevel(scanner, 2, "Level 2")
		case "4":
			sb.browseByLevel(scanner, 3, "Level 3")
		case "5":
			sb.browseByLevel(scanner, 4, "Level 4")
		case "6":
			sb.browseByLevel(scanner, 5, "Level 5")
		case "7":
			sb.browseByLevel(scanner, 6, "Level 6")
		case "8":
			sb.browseByLevel(scanner, 7, "Level 7")
		case "9":
			sb.browseByLevel(scanner, 8, "Level 8")
		case "10":
			sb.browseByLevel(scanner, 9, "Level 9")
		case "11":
			sb.browseAll(scanner)
		case "12":
			sb.searchByName(scanner)
		default:
			fmt.Println("Invalid choice")
		}
	}
}

func (sb *SpellBrowser) browseByLevel(scanner *bufio.Scanner, level int, title string) {
	levelSpells := sb.getSpellsByLevel(level)
	if len(levelSpells) == 0 {
		fmt.Printf("\nNo %s spells found.\n", title)
		return
	}

	for {
		fmt.Printf("\n── %s Spells (%d) ──\n", title, len(levelSpells))
		for i, s := range levelSpells {
			fmt.Printf("  %2d. %-25s [%s]\n", i+1, s.Name, s.School)
		}
		fmt.Println("  0. Back")
		fmt.Print("View spell details (1-0): ")

		if !scanner.Scan() {
			return
		}
		choice := strings.TrimSpace(scanner.Text())
		if choice == "0" {
			return
		}

		var idx int
		if _, err := fmt.Sscanf(choice, "%d", &idx); err != nil || idx < 1 || idx > len(levelSpells) {
			fmt.Println("Invalid choice")
			continue
		}

		sb.showSpellDetails(levelSpells[idx-1])
	}
}

func (sb *SpellBrowser) browseAll(scanner *bufio.Scanner) {
	for {
		fmt.Printf("\n── All Spells (%d) ──\n", len(sb.Spells))
		for i, s := range sb.Spells {
			levelStr := "Cantrip"
			if s.Level > 0 {
				levelStr = fmt.Sprintf("Level %d", s.Level)
			}
			fmt.Printf("  %3d. %-25s [%s] %s\n", i+1, s.Name, s.School, levelStr)
		}
		fmt.Println("   0. Back")
		fmt.Print("View spell details (0): ")

		if !scanner.Scan() {
			return
		}
		choice := strings.TrimSpace(scanner.Text())
		if choice == "0" {
			return
		}

		var idx int
		if _, err := fmt.Sscanf(choice, "%d", &idx); err != nil || idx < 1 || idx > len(sb.Spells) {
			fmt.Println("Invalid choice")
			continue
		}

		sb.showSpellDetails(sb.Spells[idx-1])
	}
}

func (sb *SpellBrowser) searchByName(scanner *bufio.Scanner) {
	fmt.Print("Search spells by name: ")
	if !scanner.Scan() {
		return
	}
	query := strings.ToLower(strings.TrimSpace(scanner.Text()))
	if query == "" {
		return
	}

	results := make([]*scontent.Spell, 0)
	for _, s := range sb.Spells {
		if strings.Contains(strings.ToLower(s.Name), query) {
			results = append(results, s)
		}
	}

	if len(results) == 0 {
		fmt.Println("No spells found")
		return
	}

	for {
		fmt.Printf("\n── Search Results (%d) ──\n", len(results))
		for i, s := range results {
			levelStr := "Cantrip"
			if s.Level > 0 {
				levelStr = fmt.Sprintf("Level %d", s.Level)
			}
			fmt.Printf("  %2d. %-25s [%s] %s\n", i+1, s.Name, s.School, levelStr)
		}
		fmt.Println("  0. Back")
		fmt.Print("View spell details: ")

		if !scanner.Scan() {
			return
		}
		choice := strings.TrimSpace(scanner.Text())
		if choice == "0" {
			return
		}

		var idx int
		if _, err := fmt.Sscanf(choice, "%d", &idx); err != nil || idx < 1 || idx > len(results) {
			fmt.Println("Invalid choice")
			continue
		}

		sb.showSpellDetails(results[idx-1])
	}
}

func (sb *SpellBrowser) showSpellDetails(spell *scontent.Spell) {
	levelStr := "Cantrip"
	if spell.Level > 0 {
		levelStr = fmt.Sprintf("Level %d", spell.Level)
	}

	components := []string{}
	if spell.Components.Verbal {
		components = append(components, "V")
	}
	if spell.Components.Somatic {
		components = append(components, "S")
	}
	if spell.Components.Material {
		mat := "M"
		if spell.Components.MaterialDesc != "" {
			mat = "M (" + spell.Components.MaterialDesc + ")"
		}
		components = append(components, mat)
	}

	classes := []string{}
	for _, c := range spell.Classes {
		classes = append(classes, string(c))
	}

	fmt.Println("\n┌─────────────────────────────────────────────────────────┐")
	fmt.Printf("│ %-55s │\n", strings.ToUpper(spell.Name))
	fmt.Println("├─────────────────────────────────────────────────────────┤")
	fmt.Printf("│ %-14s %-40s │\n", levelStr, spell.School)
	fmt.Printf("│ %-14s %-40s │\n", "Casting Time:", spell.CastingTime)
	fmt.Printf("│ %-14s %-40s │\n", "Range:", spell.Range)
	fmt.Printf("│ %-14s %-40s │\n", "Components:", strings.Join(components, ", "))
	fmt.Printf("│ %-14s %-40s │\n", "Duration:", spell.Duration)
	if spell.Concentration {
		fmt.Printf("│ %-14s %-40s │\n", "", "(Concentration)")
	}
	if spell.Ritual {
		fmt.Printf("│ %-14s %-40s │\n", "", "(Ritual)")
	}
	if spell.Damage != nil {
		dmg := spell.Damage.Dice + " " + string(spell.Damage.Type)
		if spell.Damage.PerSlot != "" {
			dmg += " (+" + spell.Damage.PerSlot + " per slot)"
		}
		fmt.Printf("│ %-14s %-40s │\n", "Damage:", dmg)
	}
	if spell.Healing != nil {
		fmt.Printf("│ %-14s %-40s │\n", "Healing:", *spell.Healing)
	}
	if spell.Save != nil {
		fmt.Printf("│ %-14s %-40s │\n", "Save:", string(*spell.Save))
	}
	if spell.Attack {
		fmt.Printf("│ %-14s %-40s │\n", "Attack:", "Spell Attack")
	}
	if len(classes) > 0 {
		fmt.Printf("│ %-14s %-40s │\n", "Classes:", strings.Join(classes, ", "))
	}
	fmt.Println("└─────────────────────────────────────────────────────────┘")
	fmt.Print("Press Enter to continue...")
	scanner := bufio.NewScanner(os.Stdin)
	scanner.Scan()
}

func (sb *SpellBrowser) getSpellsByLevel(level int) []*scontent.Spell {
	result := make([]*scontent.Spell, 0)
	for _, s := range sb.Spells {
		if s.Level == level {
			result = append(result, s)
		}
	}
	return result
}

func (sb *SpellBrowser) GetAvailableSpells(classID types.ClassID, level int) []*scontent.Spell {
	result := make([]*scontent.Spell, 0)
	for _, s := range sb.Spells {
		if s.Level <= level {
			for _, c := range s.Classes {
				if c == classID {
					result = append(result, s)
					break
				}
			}
		}
	}
	return result
}

func (sb *SpellBrowser) SelectSpellsForCharacter(scanner *bufio.Scanner, classID types.ClassID, maxSpellLevel int, maxSpells int, cantrips int) []*scontent.Spell {
	available := sb.GetAvailableSpells(classID, maxSpellLevel)
	if len(available) == 0 {
		fmt.Println("No spells available for this class")
		return nil
	}

	// Split into cantrips and leveled spells
	cantripSpells := make([]*scontent.Spell, 0)
	leveledSpells := make([]*scontent.Spell, 0)
	for _, s := range available {
		if s.Level == 0 {
			cantripSpells = append(cantripSpells, s)
		} else {
			leveledSpells = append(leveledSpells, s)
		}
	}

	selected := make([]*scontent.Spell, 0)

	// Select cantrips
	if cantrips > 0 && len(cantripSpells) > 0 {
		fmt.Printf("\n── Select %d Cantrip(s) ──\n", cantrips)
		for i, s := range cantripSpells {
			fmt.Printf("  %2d. %-25s [%s]\n", i+1, s.Name, s.School)
		}
		for len(selected) < cantrips {
			fmt.Printf("Choose cantrip %d/%d (0 to finish): ", len(selected)+1, cantrips)
			if !scanner.Scan() {
				break
			}
			choice := strings.TrimSpace(scanner.Text())
			if choice == "0" {
				break
			}
			var idx int
			if _, err := fmt.Sscanf(choice, "%d", &idx); err != nil || idx < 1 || idx > len(cantripSpells) {
				fmt.Println("Invalid choice")
				continue
			}
			spell := cantripSpells[idx-1]
			alreadySelected := false
			for _, s := range selected {
				if s.ID == spell.ID {
					alreadySelected = true
					break
				}
			}
			if alreadySelected {
				fmt.Println("Already selected")
				continue
			}
			selected = append(selected, spell)
		}
	}

	// Select leveled spells
	if maxSpells > 0 && len(leveledSpells) > 0 {
		fmt.Printf("\n── Select %d Spell(s) ──\n", maxSpells)
		for i, s := range leveledSpells {
			fmt.Printf("  %2d. %-25s [Level %d, %s]\n", i+1, s.Name, s.Level, s.School)
		}
		leveledSelected := 0
		for leveledSelected < maxSpells {
			fmt.Printf("Choose spell %d/%d (0 to finish): ", leveledSelected+1, maxSpells)
			if !scanner.Scan() {
				break
			}
			choice := strings.TrimSpace(scanner.Text())
			if choice == "0" {
				break
			}
			var idx int
			if _, err := fmt.Sscanf(choice, "%d", &idx); err != nil || idx < 1 || idx > len(leveledSpells) {
				fmt.Println("Invalid choice")
				continue
			}
			spell := leveledSpells[idx-1]
			alreadySelected := false
			for _, s := range selected {
				if s.ID == spell.ID {
					alreadySelected = true
					break
				}
			}
			if alreadySelected {
				fmt.Println("Already selected")
				continue
			}
			selected = append(selected, spell)
			leveledSelected++
		}
	}

	return selected
}
