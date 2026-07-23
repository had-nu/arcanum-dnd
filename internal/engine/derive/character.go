package derive

import (
	"math"

	scontent "github.com/hadnu/arcanum/internal/schemas/content"
	"github.com/hadnu/arcanum/internal/schemas/runtime"
	"github.com/hadnu/arcanum/internal/types"
)

type CharacterSheet struct {
	ID               types.CharacterID         `json:"id"`
	Name             string                    `json:"name"`
	Level            int                       `json:"level"`
	Classes          []ClassView               `json:"classes"`
	AC               int                       `json:"ac"`
	HP               HPView                    `json:"hp"`
	Speed            int                       `json:"speed"`
	InitBonus        int                       `json:"initBonus"`
	AbilityScores    types.AbilityScores       `json:"abilityScores"`
	SavingThrows     map[types.AbilityScore]int `json:"savingThrows"`
	Skills           map[types.Skill]*SkillView `json:"skills"`
	ProficiencyBonus int                       `json:"proficiencyBonus"`
	Attacks          []AttackView              `json:"attacks,omitempty"`
	SpellSlots       map[int]SpellSlotView     `json:"spellSlots,omitempty"`
	SpellSlotsWarlock map[int]SpellSlotView    `json:"spellSlotsWarlock,omitempty"`
	SpellcastingStats []SpellcastingStatsView  `json:"spellcastingStats,omitempty"`
	Languages        []string                  `json:"languages,omitempty"`
}

type ClassView struct {
	ID       types.ClassID    `json:"id"`
	SubClass *types.SubClassID `json:"subClass,omitempty"`
	Name     string           `json:"name,omitempty"`
	Level    int              `json:"level"`
}

type HPView struct {
	Current int `json:"current"`
	Max     int `json:"max"`
	Temp    int `json:"temp,omitempty"`
}

type SkillView struct {
	Total       int                    `json:"total"`
	Proficiency types.ProficiencyLevel `json:"proficiency"`
	Bonus       int                    `json:"bonus"`
}

type AttackView struct {
	Name   string `json:"name"`
	Bonus  int    `json:"bonus"`
	Damage string `json:"damage"`
	Type   string `json:"type"`
}

type SpellSlotView struct {
	Total     int `json:"total"`
	Remaining int `json:"remaining"`
}

type SpellcastingStatsView struct {
	ClassID      types.ClassID      `json:"classId"`
	ClassName    string             `json:"className"`
	Ability      types.AbilityScore `json:"ability"`
	SaveDC       int                `json:"saveDc"`
	AttackBonus  int                `json:"attackBonus"`
	PreparedMax  int                `json:"preparedMax,omitempty"`
	CantripsMax  int                `json:"cantripsMax,omitempty"`
}

func BuildCharacterSheet(char runtime.Character, content scontent.ResolvedContent) CharacterSheet {
	pb := proficiencyBonus(char.Level)

	// Combine base ability scores + background ASI
	finalScores := char.AbilityScores
	if char.BackgroundASI != nil {
		finalScores.STR += char.BackgroundASI[types.STR]
		finalScores.DEX += char.BackgroundASI[types.DEX]
		finalScores.CON += char.BackgroundASI[types.CON]
		finalScores.INT += char.BackgroundASI[types.INT]
		finalScores.WIS += char.BackgroundASI[types.WIS]
		finalScores.CHA += char.BackgroundASI[types.CHA]
	}

	speed := 30
	if sp, ok := content.Species[char.Species]; ok {
		if sp.Speed.Walk > 0 {
			speed = sp.Speed.Walk
		}
	}

	sheet := CharacterSheet{
		ID:               char.ID,
		Name:             char.Name,
		Level:            char.Level,
		AC:               computeAC(char, finalScores),
		HP:               HPView{Current: char.HP.Current, Max: char.HP.Max, Temp: char.TempHP},
		Speed:            speed,
		InitBonus:        abilityModifier(finalScores.DEX),
		AbilityScores:    finalScores,
		ProficiencyBonus: pb,
	}

	// Saving Throws
	saves := make(map[types.AbilityScore]int)
	profSaves := make(map[types.AbilityScore]bool)
	for _, s := range char.Proficiencies.SavingThrows {
		profSaves[s] = true
	}
	for _, ab := range types.AllAbilityScores {
		bonus := abilityModifier(getScore(finalScores, ab))
		if profSaves[ab] {
			bonus += pb
		}
		saves[ab] = bonus
	}
	sheet.SavingThrows = saves

	// Skills
	skills := make(map[types.Skill]*SkillView)
	for _, skill := range types.AllSkills {
		ability := types.SkillAbility[skill]
		bonus := abilityModifier(getScore(finalScores, ability))
		prof := char.Proficiencies.Skills[skill]
		total := bonus + int(math.Floor(types.ProficiencyMultiplier(prof)*float64(pb)))
		skills[skill] = &SkillView{
			Total:       total,
			Proficiency: prof,
			Bonus:       bonus,
		}
	}
	sheet.Skills = skills

	for _, c := range char.Classes {
		className := string(c.ClassID)
		if cls, ok := content.Classes[c.ClassID]; ok {
			className = cls.Name
		}
		sheet.Classes = append(sheet.Classes, ClassView{
			ID:       c.ClassID,
			SubClass: c.SubClassID,
			Name:     className,
			Level:    c.Level,
		})
	}

	// Spellcasting Stats (DC and Attack Bonus per class)
	sheet.SpellcastingStats = calculateSpellcastingStats(char, finalScores, pb, content)

	// Spell slots - use class table for single-class, multiclass table for multiclass
	sheet.SpellSlots = calculateSpellSlots(char, content)

	// Subtract used slots
	if char.SpellSlotsUsed != nil {
		for lvl, slot := range sheet.SpellSlots {
			used := char.SpellSlotsUsed[lvl]
			rem := slot.Total - used
			if rem < 0 {
				rem = 0
			}
			slot.Remaining = rem
			sheet.SpellSlots[lvl] = slot
		}
	}

	// Warlock Pact Magic slots
	sheet.SpellSlotsWarlock = calculateWarlockSpellSlots(char, content)
	if char.WarlockSlotsUsed > 0 {
		for lvl, slot := range sheet.SpellSlotsWarlock {
			rem := slot.Total - char.WarlockSlotsUsed
			if rem < 0 {
				rem = 0
			}
			slot.Remaining = rem
			sheet.SpellSlotsWarlock[lvl] = slot
		}
	}

	return sheet
}

func calculateSpellcastingStats(char runtime.Character, scores types.AbilityScores, pb int, content scontent.ResolvedContent) []SpellcastingStatsView {
	var stats []SpellcastingStatsView
	for _, c := range char.Classes {
		profile := getSpellcastingProfile(c, content)
		if profile == nil {
			continue
		}
		className := string(c.ClassID)
		if cls, ok := content.Classes[c.ClassID]; ok {
			className = cls.Name
			// Get prepared max and cantrips from class level data
			preparedMax := 0
			cantripsMax := 0
			for _, lvl := range cls.Levels {
				if lvl.Level == c.Level {
					preparedMax = lvl.PreparedSpells
					cantripsMax = lvl.CantripsKnown
					break
				}
			}
			abilityMod := abilityModifier(getScore(scores, profile.Ability))
			stats = append(stats, SpellcastingStatsView{
				ClassID:      c.ClassID,
				ClassName:    className,
				Ability:      profile.Ability,
				SaveDC:       8 + pb + abilityMod,
				AttackBonus:  pb + abilityMod,
				PreparedMax:  preparedMax,
				CantripsMax:  cantripsMax,
			})
		}
	}
	return stats
}

func getSpellcastingProfile(c runtime.ClassEnrollment, content scontent.ResolvedContent) *scontent.SpellcastingProfile {
	cls, ok := content.Classes[c.ClassID]
	if !ok {
		return nil
	}
	// Check subclass override first (e.g. Eldritch Knight / Arcane Trickster)
	if c.SubClassID != nil {
		for _, sc := range cls.SubClasses {
			if sc.ID == *c.SubClassID && sc.SpellcastingOverride != nil {
				return sc.SpellcastingOverride
			}
		}
	}
	return cls.Spellcasting
}

func calculateSpellSlots(char runtime.Character, content scontent.ResolvedContent) map[int]SpellSlotView {
	spellcastingClasses := []runtime.ClassEnrollment{}
	for _, c := range char.Classes {
		prof := getSpellcastingProfile(c, content)
		if prof != nil && prof.Type != scontent.CasterTypePact {
			spellcastingClasses = append(spellcastingClasses, c)
		}
	}

	// Single-class caster: use class's own spell slot table
	if len(spellcastingClasses) == 1 {
		return calculateSingleClassSpellSlots(spellcastingClasses[0], content)
	}

	// Multiclass: use multiclass spellcaster table
	if len(spellcastingClasses) > 1 {
		return calculateMulticlassSpellSlots(char, content)
	}

	return nil
}

func calculateSingleClassSpellSlots(c runtime.ClassEnrollment, content scontent.ResolvedContent) map[int]SpellSlotView {
	cls, ok := content.Classes[c.ClassID]
	if !ok {
		return nil
	}
	for _, lvl := range cls.Levels {
		if lvl.Level == c.Level {
			if lvl.SpellSlots != nil {
				result := make(map[int]SpellSlotView)
				for level, total := range lvl.SpellSlots {
					if total > 0 {
						result[level] = SpellSlotView{Total: total, Remaining: total}
					}
				}
				return result
			}
		}
	}
	return nil
}

func calculateMulticlassSpellSlots(char runtime.Character, content scontent.ResolvedContent) map[int]SpellSlotView {
	casterLevel := 0
	for _, c := range char.Classes {
		prof := getSpellcastingProfile(c, content)
		if prof == nil || prof.Type == scontent.CasterTypePact {
			continue // Warlock uses Pact Magic, not multiclass slots
		}

		switch prof.Type {
		case scontent.CasterTypeFull:
			casterLevel += c.Level
		case scontent.CasterTypeHalf:
			// PHB 2024: Half your levels (round up) in Paladin and Ranger
			casterLevel += int(math.Ceil(float64(c.Level) / 2.0))
		case scontent.CasterTypeThird:
			// PHB 2024: One third of your Fighter/Rogue levels (round down)
			casterLevel += c.Level / 3
		}
	}

	if casterLevel == 0 {
		return nil
	}

	// Multiclass spell slot table (PHB 2024)
	// Index = caster level (capped at 20), values = [1st, 2nd, 3rd, 4th, 5th, 6th, 7th, 8th, 9th]
	if casterLevel > 20 {
		casterLevel = 20
	}

	slotTable := map[int][]int{
		1:  {2},
		2:  {3},
		3:  {4, 2},
		4:  {4, 3},
		5:  {4, 3, 2},
		6:  {4, 3, 3},
		7:  {4, 3, 3, 1},
		8:  {4, 3, 3, 2},
		9:  {4, 3, 3, 3, 1},
		10: {4, 3, 3, 3, 2},
		11: {4, 3, 3, 3, 2, 1},
		12: {4, 3, 3, 3, 2, 1},
		13: {4, 3, 3, 3, 2, 1, 1},
		14: {4, 3, 3, 3, 2, 1, 1},
		15: {4, 3, 3, 3, 2, 1, 1, 1},
		16: {4, 3, 3, 3, 2, 1, 1, 1},
		17: {4, 3, 3, 3, 2, 1, 1, 1, 1},
		18: {4, 3, 3, 3, 3, 1, 1, 1, 1},
		19: {4, 3, 3, 3, 3, 2, 1, 1, 1},
		20: {4, 3, 3, 3, 3, 2, 2, 1, 1},
	}

	slots := slotTable[casterLevel]
	if slots == nil {
		return nil
	}

	result := make(map[int]SpellSlotView)
	for i, total := range slots {
		if total > 0 {
			result[i+1] = SpellSlotView{Total: total, Remaining: total}
		}
	}
	return result
}

func calculateWarlockSpellSlots(char runtime.Character, content scontent.ResolvedContent) map[int]SpellSlotView {
	for _, c := range char.Classes {
		prof := getSpellcastingProfile(c, content)
		if prof != nil && prof.Type == scontent.CasterTypePact {
			// Get slots from class levels table if available, or fall back to standard warlock calculation
			if cls, ok := content.Classes[c.ClassID]; ok {
				for _, lvl := range cls.Levels {
					if lvl.Level == c.Level && lvl.SpellSlots != nil {
						result := make(map[int]SpellSlotView)
						for level, total := range lvl.SpellSlots {
							if total > 0 {
								result[level] = SpellSlotView{Total: total, Remaining: total}
							}
						}
						return result
					}
				}
			}
			// Fallback standard Warlock table
			slotLevel := 1
			if c.Level >= 9 {
				slotLevel = 5
			} else if c.Level >= 7 {
				slotLevel = 4
			} else if c.Level >= 5 {
				slotLevel = 3
			} else if c.Level >= 3 {
				slotLevel = 2
			}
			slotCount := 1
			if c.Level >= 11 {
				slotCount = 3
			} else if c.Level >= 2 {
				slotCount = 2
			}
			return map[int]SpellSlotView{
				slotLevel: {Total: slotCount, Remaining: slotCount},
			}
		}
	}
	return nil
}

func computeAC(char runtime.Character, scores types.AbilityScores) int {
	return 10 + abilityModifier(scores.DEX)
}

func proficiencyBonus(level int) int {
	return (level-1)/4 + 2
}

func abilityModifier(score int) int {
	return (score - 10) / 2
}

func getScore(scores types.AbilityScores, ab types.AbilityScore) int {
	switch ab {
	case types.STR:
		return scores.STR
	case types.DEX:
		return scores.DEX
	case types.CON:
		return scores.CON
	case types.INT:
		return scores.INT
	case types.WIS:
		return scores.WIS
	case types.CHA:
		return scores.CHA
	default:
		return 10
	}
}
