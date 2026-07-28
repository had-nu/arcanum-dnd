package engine

import (
	"fmt"
	"sort"

	scontent "github.com/hadnu/arcanum/internal/schemas/content"
	"github.com/hadnu/arcanum/internal/types"
)

type BuildValidator struct {
	content scontent.ResolvedContent
}

func NewBuildValidator(content scontent.ResolvedContent) *BuildValidator {
	return &BuildValidator{content: content}
}

func (v *BuildValidator) Validate(req BuildRequest) error {
	if _, ok := v.content.Species[req.SpeciesID]; !ok {
		return fmt.Errorf("invalid species: %s", req.SpeciesID)
	}
	if _, ok := v.content.Backgrounds[req.BackgroundID]; !ok {
		return fmt.Errorf("invalid background: %s", req.BackgroundID)
	}

	totalLevel := 0
	for _, c := range req.Classes {
		cls, ok := v.content.Classes[c.ID]
		if !ok {
			return fmt.Errorf("invalid class: %s", c.ID)
		}
		if c.Level < 1 || c.Level > 20 {
			return fmt.Errorf("class level must be 1-20")
		}
		if c.SubclassID != nil {
			found := false
			for _, sc := range cls.SubClasses {
				if sc.ID == *c.SubclassID {
					found = true
					break
				}
			}
			if !found {
				return fmt.Errorf("subclass %s not available for %s", *c.SubclassID, c.ID)
			}
			if c.Level < subclassLevel(cls) {
				return fmt.Errorf("subclass %s requires level %d for %s", *c.SubclassID, subclassLevel(cls), c.ID)
			}
		}
		totalLevel += c.Level
	}
	if totalLevel != req.Level {
		return fmt.Errorf("sum of class levels (%d) != total level (%d)", totalLevel, req.Level)
	}
	if req.Level < 1 || req.Level > 20 {
		return fmt.Errorf("level must be 1-20")
	}

	if len(req.Classes) > 1 {
		for i, c := range req.Classes {
			if i == 0 {
				continue
			}
			cls := v.content.Classes[c.ID]
			for _, ab := range cls.PrimaryAbility {
				if scoreOf(req.AbilityScores, ab) < 13 {
					return fmt.Errorf("multiclass into %s requires %s >= 13", c.ID, ab)
				}
			}
		}
	}

	bg := v.content.Backgrounds[req.BackgroundID]
	bgSkills := make(map[types.Skill]bool)
	for _, s := range bg.Skills {
		bgSkills[s] = true
	}
	classSkillPool := make(map[types.Skill]bool)
	for _, c := range req.Classes {
		cls := v.content.Classes[c.ID]
		for _, si := range cls.Proficiencies.Skills {
			for _, sk := range si.From {
				classSkillPool[sk] = true
			}
		}
	}

	for _, sk := range req.Skills {
		switch sk.Source {
		case "background":
			if !bgSkills[sk.Skill] {
				return fmt.Errorf("skill %s not in background %s", sk.Skill, req.BackgroundID)
			}
		case "class":
			if !classSkillPool[sk.Skill] {
				return fmt.Errorf("skill %s not in class skill pool", sk.Skill)
			}
		}
	}

	maxSpellLevel := (req.Level + 1) / 2
	if req.Level >= 17 {
		maxSpellLevel = 9
	}

	for _, sp := range req.Spells {
		spell, ok := v.content.Spells[sp.SpellID]
		if !ok {
			return fmt.Errorf("invalid spell: %s", sp.SpellID)
		}
		if int(spell.Level) > maxSpellLevel {
			return fmt.Errorf("spell %s is level %d, max for level %d is %d", sp.SpellID, spell.Level, req.Level, maxSpellLevel)
		}
		if !v.canLearn(spell, sp, req) {
			return fmt.Errorf("spell %s not available to any class or subclass", sp.SpellID)
		}
	}

	switch req.AbilityMethod {
	case "standard_array":
		scores := []int{req.AbilityScores.STR, req.AbilityScores.DEX, req.AbilityScores.CON,
			req.AbilityScores.INT, req.AbilityScores.WIS, req.AbilityScores.CHA}
		if !isPermutation(scores, []int{15, 14, 13, 12, 10, 8}) {
			return fmt.Errorf("standard array must be permutation of 15,14,13,12,10,8")
		}
	case "point_buy":
		cost := pointBuyCost(req.AbilityScores)
		if cost != 27 {
			return fmt.Errorf("point buy must equal 27 points, got %d", cost)
		}
	}

	return nil
}

func (v *BuildValidator) canLearn(spell *scontent.Spell, choice SpellChoice, req BuildRequest) bool {
	if choice.Source == "feat" || choice.Source == "species" {
		return true
	}
	for _, c := range req.Classes {
		cls, ok := v.content.Classes[c.ID]
		if !ok || cls.Spellcasting == nil {
			continue
		}
		// Check per-level spell list (subset in YAML content)
		for _, lvl := range cls.Levels {
			if lvl.Level > c.Level {
				break
			}
			for _, sid := range lvl.Spells {
				if sid == spell.ID {
					return true
				}
			}
		}
		// If the class has spellcasting, allow any spell the class can cast at this level.
		// The per-level list only contains a subset; known casters choose from the full list.
		maxSpellLevel := (c.Level + 1) / 2
		if c.Level >= 17 {
			maxSpellLevel = 9
		}
		if int(spell.Level) <= maxSpellLevel {
			return true
		}
		if c.SubclassID != nil {
			for _, sc := range cls.SubClasses {
				if sc.ID == *c.SubclassID {
					for _, spellIDs := range sc.AlwaysPreparedSpells {
						for _, sid := range spellIDs {
							if sid == spell.ID {
								return true
							}
						}
					}
				}
			}
		}
	}
	return false
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
		return 0
	}
}

func isPermutation(a, b []int) bool {
	if len(a) != len(b) {
		return false
	}
	sa := append([]int{}, a...)
	sb := append([]int{}, b...)
	sort.Ints(sa)
	sort.Ints(sb)
	for i := range sa {
		if sa[i] != sb[i] {
			return false
		}
	}
	return true
}

func pointBuyCost(s types.AbilityScores) int {
	costs := map[int]int{8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9}
	scores := []int{s.STR, s.DEX, s.CON, s.INT, s.WIS, s.CHA}
	total := 0
	for _, v := range scores {
		if c, ok := costs[v]; ok {
			total += c
		} else if v > 15 {
			return 999
		} else if v < 8 {
			return 999
		}
	}
	return total
}
