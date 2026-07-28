package database

import (
	"database/sql"
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
	"unicode"
)

// ImportSpellsCSV reads all-Spells.csv and imports spells + class associations into the DB.
// It deduplicates by spell name (PHB'24 > PHB'14 > other sources).
func ImportSpellsCSV(db *sql.DB, csvPath string) error {
	log.Printf("Importing spells from %s...", csvPath)
	f, err := os.Open(csvPath)
	if err != nil {
		return fmt.Errorf("open csv: %w", err)
	}
	defer f.Close()

	reader := csv.NewReader(f)
	allRows, err := reader.ReadAll()
	if err != nil {
		return fmt.Errorf("read csv: %w", err)
	}
	if len(allRows) < 2 {
		return fmt.Errorf("csv has no data rows")
	}

	header := allRows[0]
	colIdx := make(map[string]int)
	for i, h := range header {
		colIdx[strings.TrimSpace(h)] = i
	}

	required := []string{"Name", "Level", "School", "Casting Time", "Duration", "Range", "Components", "Classes", "Source"}
	for _, r := range required {
		if _, ok := colIdx[r]; !ok {
			return fmt.Errorf("missing required column: %s", r)
		}
	}

	// Phase 1: deduplicate by name, preferring PHB'24 > PHB'14 > other
	type csvSpell struct {
		row         []string
		sourceRank  int
	}
	type classEntry struct {
		classID      string
		spellLevel   int
	}
	dedup := make(map[string]*csvSpell)     // name -> best row
	classMap := make(map[string][]classEntry) // name -> classes

	for i := 1; i < len(allRows); i++ {
		row := allRows[i]
		if len(row) < len(header) {
			continue
		}
		name := normalizeSpellName(row[colIdx["Name"]])
		source := row[colIdx["Source"]]
		rank := sourceRank(source)

		existing, exists := dedup[name]
		if !exists || rank < existing.sourceRank {
			dedup[name] = &csvSpell{row: row, sourceRank: rank}
		} else if exists && rank == existing.sourceRank && source == "PHB'24" {
			// Prefer PHB'24 for same rank
			if existing.row[colIdx["Source"]] != "PHB'24" {
				dedup[name] = &csvSpell{row: row, sourceRank: rank}
			}
		}

		// Collect class associations from all versions
		classes := parseClasses(row[colIdx["Classes"]])
		optClasses := parseClasses(getCSVCol(row, colIdx, "Optional/Variant Classes"))
		allClasses := append(classes, optClasses...)
		if len(allClasses) > 0 {
			spellLvl := parseSpellLevel(row[colIdx["Level"]])
			for _, cid := range allClasses {
				classMap[name] = append(classMap[name], classEntry{classID: cid, spellLevel: spellLvl})
			}
		}
	}

	log.Printf("Deduplicated to %d unique spells", len(dedup))

	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()

	insertSpell, err := tx.Prepare(`
		INSERT OR REPLACE INTO spells
			(id, name, level, school, casting_time, range,
			 verbal, somatic, material, material_desc, material_cost,
			 duration, concentration, ritual, description, source)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return fmt.Errorf("prepare insert spell: %w", err)
	}
	defer insertSpell.Close()

	insertClassSpell, err := tx.Prepare(`
		INSERT OR REPLACE INTO class_level_spells (class_id, level, spell_id)
		VALUES (?, ?, ?)
	`)
	if err != nil {
		return fmt.Errorf("prepare insert class_spell: %w", err)
	}
	defer insertClassSpell.Close()

	inserted := 0
	classAssoc := 0

	for name, entry := range dedup {
		row := entry.row
		spellID := makeSpellID(name)
		spellName := row[colIdx["Name"]]

		level := parseSpellLevel(row[colIdx["Level"]])
		school := row[colIdx["School"]]
		castingTime := row[colIdx["Casting Time"]]
		rng := row[colIdx["Range"]]
		duration := row[colIdx["Duration"]]
		components := row[colIdx["Components"]]
		source := row[colIdx["Source"]]

		verbal, somatic, material, matDesc, matCost := parseComponents(components)
		concentration := parseConcentration(duration)
		ritual := parseRitual(row, colIdx)

		text := row[colIdx["Text"]]
		higherLvls := getCSVCol(row, colIdx, "At Higher Levels")
		description := text
		if higherLvls != "" {
			description = text + "\n\n" + higherLvls
		}

		_, err := insertSpell.Exec(
			spellID, spellName, level, school, castingTime, rng,
			verbal, somatic, material, matDesc, matCost,
			duration, concentration, ritual, description, source,
		)
		if err != nil {
			return fmt.Errorf("insert spell %s: %w", spellID, err)
		}
		inserted++

		// Deduplicate class associations for this spell
		seenClass := make(map[string]bool)
		for _, ce := range classMap[name] {
			key := ce.classID + "@" + strconv.Itoa(ce.spellLevel)
			if seenClass[key] {
				continue
			}
			seenClass[key] = true
			classLvl := minClassLevelForSpellLevel(ce.classID, ce.spellLevel)
			if classLvl > 0 {
				_, err := insertClassSpell.Exec(ce.classID, classLvl, spellID)
				if err != nil {
					return fmt.Errorf("insert class_spell %s/%s/%d: %w", ce.classID, spellID, classLvl, err)
				}
				classAssoc++
			}
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit: %w", err)
	}

	log.Printf("Imported %d spells with %d class associations", inserted, classAssoc)
	return nil
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func getCSVCol(row []string, colIdx map[string]int, name string) string {
	if idx, ok := colIdx[name]; ok && idx < len(row) {
		return row[idx]
	}
	return ""
}

func normalizeSpellName(name string) string {
	return strings.TrimSpace(name)
}

func makeSpellID(name string) string {
	lower := strings.ToLower(name)
	// Replace common accented characters
	accented := map[rune]string{
		'à': "a", 'á': "a", 'â': "a", 'ã': "a", 'ä': "a", 'å': "a",
		'è': "e", 'é': "e", 'ê': "e", 'ë': "e",
		'ì': "i", 'í': "i", 'î': "i", 'ï': "i",
		'ò': "o", 'ó': "o", 'ô': "o", 'õ': "o", 'ö': "o",
		'ù': "u", 'ú': "u", 'û': "u", 'ü': "u",
		'ý': "y", 'ÿ': "y", 'ñ': "n", 'ç': "c",
	}
	var b strings.Builder
	for _, r := range lower {
		if replacement, ok := accented[r]; ok {
			b.WriteString(replacement)
		} else if r == '\'' || r == '’' || r == '`' || r == '(' || r == ')' || r == ',' || r == '.' {
			// skip
		} else if r == '/' || r == '&' {
			b.WriteRune('-')
		} else if r == ' ' || r == '-' || r == '_' {
			b.WriteRune('-')
		} else if unicode.IsLetter(r) || unicode.IsNumber(r) {
			b.WriteRune(r)
		}
	}
	id := strings.Trim(b.String(), "-")
	for strings.Contains(id, "--") {
		id = strings.ReplaceAll(id, "--", "-")
	}
	return id
}



func parseSpellLevel(s string) int {
	s = strings.TrimSpace(s)
	if strings.EqualFold(s, "Cantrip") {
		return 0
	}
	// "1st", "2nd", "3rd", "4th", ...
	parts := strings.Fields(s)
	if len(parts) == 0 {
		return 0
	}
	// strip ordinal suffix
	numStr := strings.TrimRight(parts[0], "stndrh")
	lvl, err := strconv.Atoi(numStr)
	if err != nil {
		return 0
	}
	if lvl < 0 || lvl > 9 {
		return 0
	}
	return lvl
}

func parseComponents(comp string) (verbal, somatic, material bool, matDesc string, cost int) {
	comp = strings.TrimSpace(comp)
	if strings.Contains(comp, "V") {
		verbal = true
	}
	if strings.Contains(comp, "S") {
		somatic = true
	}
	if strings.Contains(comp, "M") {
		material = true
		// Extract material description: "M (a bit of sponge)" or "M (500 gp diamond)"
		if idx := strings.Index(comp, "("); idx >= 0 {
			end := strings.LastIndex(comp, ")")
			if end > idx {
				matDesc = strings.TrimSpace(comp[idx+1 : end])
			}
		}
	}
	// Check for material cost in description
	if matDesc != "" {
		parts := strings.Fields(matDesc)
		for i, p := range parts {
			if p == "gp" && i > 0 {
				if c, err := strconv.Atoi(parts[i-1]); err == nil {
					cost = c
				}
			}
		}
	}
	return
}

func parseConcentration(duration string) bool {
	return strings.Contains(strings.ToLower(duration), "concentration")
}

func parseRitual(row []string, colIdx map[string]int) bool {
	// Check "Ritual" text in Components or Tags column
	if comp := getCSVCol(row, colIdx, "Components"); strings.Contains(comp, "R") {
		return true
	}
	// Some entries have "Ritual" in a separate Tags column
	if tags := getCSVCol(row, colIdx, "Tags"); strings.Contains(strings.ToLower(tags), "ritual") {
		return true
	}
	return false
}

// parseClasses extracts internal class IDs from the CSV class format.
// Input: "Artificer (TCE), Sorcerer (PHB'14), Wizard (PHB'24)"
// Output: ["artificer", "sorcerer", "wizard"]
func parseClasses(s string) []string {
	if s == "" {
		return nil
	}
	seen := make(map[string]bool)
	var result []string
	for _, part := range strings.Split(s, ",") {
		cid := classIDFromCSV(strings.TrimSpace(part))
		if cid != "" && !seen[cid] {
			seen[cid] = true
			result = append(result, cid)
		}
	}
	return result
}

func classIDFromCSV(csvClass string) string {
	csvClass = strings.TrimSpace(csvClass)
	// Strip source suffix: "Sorcerer (PHB'24)" → "Sorcerer"
	if idx := strings.Index(csvClass, "("); idx >= 0 {
		csvClass = strings.TrimSpace(csvClass[:idx])
	}
	switch strings.ToLower(csvClass) {
	case "artificer":
		return "artificer"
	case "bard":
		return "bard"
	case "cleric":
		return "cleric"
	case "druid":
		return "druid"
	case "monk":
		return "monk"
	case "paladin":
		return "paladin"
	case "ranger":
		return "ranger"
	case "sorcerer":
		return "sorcerer"
	case "warlock":
		return "warlock"
	case "wizard":
		return "wizard"
	}
	return ""
}

// minClassLevelForSpellLevel returns the minimum class level at which
// a class has spell slots of the given spell level.
// For cantrips (level 0), returns 1.
func minClassLevelForSpellLevel(classID string, spellLevel int) int {
	if spellLevel == 0 {
		return 1
	}
	// General formula for full casters (bard, cleric, druid, sorcerer, wizard):
	//   spell level 1 → class level 1
	//   spell level 2 → class level 3
	//   spell level 3 → class level 5
	//   spell level 4 → class level 7
	//   spell level 5 → class level 9
	//   spell level 6 → class level 11
	//   spell level 7 → class level 13
	//   spell level 8 → class level 15
	//   spell level 9 → class level 17
	//
	// Half casters (artificer, paladin, ranger):
	//   spell level 1 → class level 1
	//   spell level 2 → class level 5
	//   spell level 3 → class level 9
	//   spell level 4 → class level 13
	//   spell level 5 → class level 17
	//
	// Warlock (pact magic): full caster progression for spells known
	// For simplicity, use full caster formula for all classes.

	halfCasters := map[string]bool{"artificer": true, "paladin": true, "ranger": true}
	if halfCasters[classID] {
		lvl := (spellLevel * 4) - 3
		if lvl < 1 {
			lvl = 1
		}
		if lvl > 20 {
			lvl = 20
		}
		return lvl
	}
	// Full caster / pact
	lvl := (spellLevel * 2) - 1
	if lvl < 1 {
		lvl = 1
	}
	if lvl > 20 {
		lvl = 20
	}
	return lvl
}

// sourceRank prioritizes sources: lower = better.
func sourceRank(source string) int {
	switch source {
	case "PHB'24":
		return 0
	case "PHB'14":
		return 1
	case "XGE":
		return 2
	case "TCE":
		return 3
	case "SCAG":
		return 4
	case "GGTR":
		return 5
	case "IDRF":
		return 5
	case "MOT":
		return 5
	case "SCC":
		return 5
	case "FTD":
		return 5
	default:
		if strings.HasPrefix(source, "UA") {
			return 20
		}
		return 10
	}
}
