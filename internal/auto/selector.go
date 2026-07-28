package auto

import (
	"strings"

	"github.com/hadnu/arcanum/internal/engine"
	scontent "github.com/hadnu/arcanum/internal/schemas/content"
	"github.com/hadnu/arcanum/internal/types"
)

type AutoSelector struct {
	content scontent.ResolvedContent
}

func NewAutoSelector(content scontent.ResolvedContent) *AutoSelector {
	return &AutoSelector{content: content}
}

func (a *AutoSelector) FillDefaults(req *engine.BuildRequest, prompt string) {
	if len(req.Spells) == 0 {
		a.SelectSpells(req, prompt)
	} else {
		a.FillRemainingSpells(req, prompt)
	}
	if len(req.Skills) == 0 {
		a.SelectSkills(req)
	}
	if len(req.Equipment) == 0 {
		a.SelectEquipment(req)
	}
}

func (a *AutoSelector) SelectSpells(req *engine.BuildRequest, prompt string) {
	themes := detectThemes(prompt + " " + req.Name)

	for _, c := range req.Classes {
		cls, ok := a.content.Classes[c.ID]
		if !ok || cls.Spellcasting == nil {
			continue
		}

		cantripCount := 0
		spellsKnown := 0
		for _, lvl := range cls.Levels {
			if lvl.Level == c.Level {
				cantripCount = lvl.CantripsKnown
				spellsKnown = lvl.SpellsKnown
				break
			}
		}
		if cantripCount == 0 {
			cantripCount = 4
		}

		cantrips := a.pickCantrips(cls, themes, cantripCount)
		for _, sp := range cantrips {
			req.Spells = append(req.Spells, engine.SpellChoice{
				SpellID: sp, Source: "class", Level: 0,
			})
		}

		leveledMax := spellsKnown - cantripCount
		if leveledMax <= 0 {
			leveledMax = c.Level
		}
		known := a.pickKnownSpells(cls, themes, c.Level, leveledMax)
		for _, sp := range known {
			spell := a.content.Spells[sp]
			if spell != nil {
				req.Spells = append(req.Spells, engine.SpellChoice{
					SpellID: sp, Source: "class", Level: int(spell.Level),
				})
			}
		}
	}
}

func (a *AutoSelector) FillRemainingSpells(req *engine.BuildRequest, prompt string) {
	if len(req.Classes) == 0 {
		return
	}
	c := req.Classes[0]
	cls, ok := a.content.Classes[c.ID]
	if !ok || cls.Spellcasting == nil {
		return
	}
	cantripCount := 0
	spellsKnown := 0
	for _, lvl := range cls.Levels {
		if lvl.Level == c.Level {
			cantripCount = lvl.CantripsKnown
			spellsKnown = lvl.SpellsKnown
			break
		}
	}
	if cantripCount == 0 {
		cantripCount = 4
	}
	leveledMax := spellsKnown - cantripCount
	if leveledMax <= 0 {
		leveledMax = c.Level
	}

	userCantrips := 0
	userSpells := 0
	for _, s := range req.Spells {
		if s.Level == 0 {
			userCantrips++
		} else {
			userSpells++
		}
	}

	themes := detectThemes(prompt + " " + req.Name)

	if userCantrips < cantripCount {
		fill := a.pickCantrips(cls, themes, cantripCount)
		for _, sp := range fill {
			if hasSpell(req.Spells, sp) {
				continue
			}
			if userCantrips >= cantripCount {
				break
			}
			req.Spells = append(req.Spells, engine.SpellChoice{SpellID: sp, Source: "class", Level: 0})
			userCantrips++
		}
	}
	if userSpells < leveledMax {
		fill := a.pickKnownSpells(cls, themes, c.Level, leveledMax)
		for _, sp := range fill {
			if hasSpell(req.Spells, sp) {
				continue
			}
			if userSpells >= leveledMax {
				break
			}
			spell := a.content.Spells[sp]
			if spell != nil {
				req.Spells = append(req.Spells, engine.SpellChoice{SpellID: sp, Source: "class", Level: int(spell.Level)})
				userSpells++
			}
		}
	}
}

func (a *AutoSelector) SelectSkills(req *engine.BuildRequest) {
	bg, ok := a.content.Backgrounds[req.BackgroundID]
	if ok {
		for _, sk := range bg.Skills {
			if !hasSkill(req.Skills, sk) {
				req.Skills = append(req.Skills, engine.SkillChoice{
					Skill: sk, Source: "background",
				})
			}
		}
	}

	for _, c := range req.Classes {
		cls, ok := a.content.Classes[c.ID]
		if !ok {
			continue
		}
		priority := classSkillPriority(c.ID)
		for _, si := range cls.Proficiencies.Skills {
			selected := 0
			for _, sk := range si.From {
				if selected >= si.Choose {
					break
				}
				if hasSkill(req.Skills, sk) {
					continue
				}
				if isPrioritySkill(sk, priority) {
					req.Skills = append(req.Skills, engine.SkillChoice{
						Skill: sk, Source: "class",
					})
					selected++
				}
			}
			for _, sk := range si.From {
				if selected >= si.Choose {
					break
				}
				if hasSkill(req.Skills, sk) {
					continue
				}
				req.Skills = append(req.Skills, engine.SkillChoice{
					Skill: sk, Source: "class",
				})
				selected++
			}
		}
	}
}

func (a *AutoSelector) SelectEquipment(req *engine.BuildRequest) {
	for _, c := range req.Classes {
		switch c.ID {
		case "sorcerer":
			req.Equipment = append(req.Equipment,
				engine.EquipmentChoice{ItemID: "light-crossbow", Quantity: 1, Equipped: true},
				engine.EquipmentChoice{ItemID: "component-pouch", Quantity: 1, Equipped: false},
				engine.EquipmentChoice{ItemID: "dagger", Quantity: 2, Equipped: true},
				engine.EquipmentChoice{ItemID: "dungeoneers-pack", Quantity: 1, Equipped: false},
			)
		case "wizard":
			req.Equipment = append(req.Equipment,
				engine.EquipmentChoice{ItemID: "quarterstaff", Quantity: 1, Equipped: true},
				engine.EquipmentChoice{ItemID: "component-pouch", Quantity: 1, Equipped: false},
				engine.EquipmentChoice{ItemID: "spellbook", Quantity: 1, Equipped: false},
				engine.EquipmentChoice{ItemID: "scholars-pack", Quantity: 1, Equipped: false},
			)
		case "fighter":
			req.Equipment = append(req.Equipment,
				engine.EquipmentChoice{ItemID: "chain-mail", Quantity: 1, Equipped: true},
				engine.EquipmentChoice{ItemID: "longsword", Quantity: 1, Equipped: true},
				engine.EquipmentChoice{ItemID: "shield", Quantity: 1, Equipped: true},
				engine.EquipmentChoice{ItemID: "explorers-pack", Quantity: 1, Equipped: false},
			)
		default:
			req.Equipment = append(req.Equipment,
				engine.EquipmentChoice{ItemID: "dagger", Quantity: 2, Equipped: true},
				engine.EquipmentChoice{ItemID: "backpack", Quantity: 1, Equipped: false},
			)
		}
	}
}

func detectThemes(text string) []string {
	lower := strings.ToLower(text)
	var themes []string
	if strings.Contains(lower, "aberrant") || strings.Contains(lower, "aberra") || strings.Contains(lower, "mind") || strings.Contains(lower, "psychic") || strings.Contains(lower, "alien") {
		themes = append(themes, "aberration")
	}
	if strings.Contains(lower, "fire") || strings.Contains(lower, "flame") || strings.Contains(lower, "burn") {
		themes = append(themes, "fire")
	}
	if strings.Contains(lower, "heal") || strings.Contains(lower, "cleric") || strings.Contains(lower, "life") {
		themes = append(themes, "healing")
	}
	if strings.Contains(lower, "stealth") || strings.Contains(lower, "rogue") || strings.Contains(lower, "shadow") {
		themes = append(themes, "stealth")
	}
	if strings.Contains(lower, "ice") || strings.Contains(lower, "cold") || strings.Contains(lower, "frost") {
		themes = append(themes, "cold")
	}
	return themes
}

func (a *AutoSelector) pickCantrips(cls *scontent.Class, themes []string, maxCantrips int) []types.SpellID {
	themedCantrips := themedCantrips(themes)

	var picked []types.SpellID
	for _, sp := range themedCantrips {
		if len(picked) >= maxCantrips {
			break
		}
		if a.content.Spells[sp] != nil {
			picked = append(picked, sp)
		}
	}

	// Fill remaining from class list
	classPool := a.classCantripPool(cls)
	for _, sp := range classPool {
		if len(picked) >= maxCantrips {
			break
		}
		if !contains(picked, sp) {
			picked = append(picked, sp)
		}
	}

	return picked
}

func (a *AutoSelector) pickKnownSpells(cls *scontent.Class, themes []string, level int, maxKnown int) []types.SpellID {
	themedSpells := themedSpells(themes)
	utilitySpells := []types.SpellID{"shield", "mage-armor", "misty-step", "counterspell", "invisibility", "absorb-elements"}

	var picked []types.SpellID
	for _, sp := range themedSpells {
		if len(picked) >= maxKnown {
			break
		}
		if a.content.Spells[sp] == nil {
			continue
		}
		spellDef := a.content.Spells[sp]
		maxLevel := (level + 1) / 2
		if level >= 17 {
			maxLevel = 9
		}
		if int(spellDef.Level) > maxLevel || spellDef.Level == 0 {
			continue
		}
		if !contains(picked, sp) {
			picked = append(picked, sp)
		}
	}
	for _, sp := range utilitySpells {
		if len(picked) >= maxKnown {
			break
		}
		if a.content.Spells[sp] == nil {
			continue
		}
		if !contains(picked, sp) {
			picked = append(picked, sp)
		}
	}

	return picked
}

func themedCantrips(themes []string) []types.SpellID {
	for _, t := range themes {
		switch t {
		case "aberration", "psychic":
			return []types.SpellID{"mind-sliver", "mage-hand", "minor-illusion", "message"}
		case "fire":
			return []types.SpellID{"fire-bolt", "produce-flame", "create-bonfire", "control-flames"}
		case "healing":
			return []types.SpellID{"spare-the-dying", "guidance", "resistance", "light"}
		case "stealth":
			return []types.SpellID{"minor-illusion", "message", "mage-hand", "prestidigitation"}
		}
	}
	return []types.SpellID{"mage-hand", "minor-illusion", "message", "prestidigitation"}
}

func themedSpells(themes []string) []types.SpellID {
	themesMap := map[string][]types.SpellID{
		"aberration": {
			"arms-of-hadar", "detect-thoughts", "tasha-mind-whip",
			"hunger-of-hadar", "sending", "telekinesis",
		},
		"psychic": {
			"dissonant-whispers", "detect-thoughts", "tasha-mind-whip",
			"sending", "telekinesis", "dominate-person",
		},
		"fire": {
			"burning-hands", "scorching-ray", "fireball",
			"wall-of-fire", "immolation", "fire-storm",
		},
		"healing": {
			"healing-word", "prayer-of-healing", "mass-healing-word",
			"revivify", "greater-restoration", "heal",
		},
		"stealth": {
			"disguise-self", "invisibility", "silence",
			"nondetection", "greater-invisibility", "mislead",
		},
		"cold": {
			"ice-knife", "snowball-storm", "sleet-storm",
			"cone-of-cold", "ice-storm", "otilukes-freezing-sphere",
		},
	}
	for _, t := range themes {
		if spells, ok := themesMap[t]; ok {
			return spells
		}
	}
	return []types.SpellID{}
}

func (a *AutoSelector) classCantripPool(cls *scontent.Class) []types.SpellID {
	var pool []types.SpellID
	seen := make(map[types.SpellID]bool)
	for _, lvl := range cls.Levels {
		for _, sp := range lvl.Spells {
			spell, ok := a.content.Spells[sp]
			if !ok || spell.Level != 0 {
				continue
			}
			if !seen[sp] {
				seen[sp] = true
				pool = append(pool, sp)
			}
		}
	}
	return pool
}

func (a *AutoSelector) classSpellPool(cls *scontent.Class) []types.SpellID {
	var pool []types.SpellID
	seen := make(map[types.SpellID]bool)
	for _, lvl := range cls.Levels {
		for _, sp := range lvl.Spells {
			if !seen[sp] {
				seen[sp] = true
				pool = append(pool, sp)
			}
		}
	}
	return pool
}

func hasSkill(skills []engine.SkillChoice, skill types.Skill) bool {
	for _, s := range skills {
		if s.Skill == skill {
			return true
		}
	}
	return false
}

func hasSpell(choices []engine.SpellChoice, id types.SpellID) bool {
	for _, s := range choices {
		if s.SpellID == id {
			return true
		}
	}
	return false
}

func contains(list []types.SpellID, item types.SpellID) bool {
	for _, x := range list {
		if x == item {
			return true
		}
	}
	return false
}

func isPrioritySkill(skill types.Skill, priority []types.Skill) bool {
	for _, p := range priority {
		if skill == p {
			return true
		}
	}
	return false
}

func classSkillPriority(classID types.ClassID) []types.Skill {
	switch classID {
	case "sorcerer":
		return []types.Skill{types.SkillArcana, types.SkillPersuasion, types.SkillDeception, types.SkillInsight}
	case "wizard":
		return []types.Skill{types.SkillArcana, types.SkillHistory, types.SkillInvestigation, types.SkillInsight}
	case "rogue":
		return []types.Skill{types.SkillStealth, types.SkillSleightOfHand, types.SkillAcrobatics, types.SkillPerception}
	case "fighter":
		return []types.Skill{types.SkillAthletics, types.SkillAcrobatics, types.SkillPerception, types.SkillIntimidation}
	case "cleric":
		return []types.Skill{types.SkillInsight, types.SkillMedicine, types.SkillPersuasion, types.SkillReligion}
	case "barbarian":
		return []types.Skill{types.SkillAthletics, types.SkillIntimidation, types.SkillPerception, types.SkillSurvival}
	case "bard":
		return []types.Skill{types.SkillPersuasion, types.SkillDeception, types.SkillPerformance, types.SkillInsight}
	case "druid":
		return []types.Skill{types.SkillNature, types.SkillAnimalHandling, types.SkillPerception, types.SkillSurvival}
	case "monk":
		return []types.Skill{types.SkillAcrobatics, types.SkillStealth, types.SkillAthletics, types.SkillInsight}
	case "paladin":
		return []types.Skill{types.SkillPersuasion, types.SkillAthletics, types.SkillInsight, types.SkillReligion}
	case "ranger":
		return []types.Skill{types.SkillPerception, types.SkillStealth, types.SkillSurvival, types.SkillNature}
	case "warlock":
		return []types.Skill{types.SkillArcana, types.SkillDeception, types.SkillIntimidation, types.SkillInvestigation}
	default:
		return nil
	}
}
