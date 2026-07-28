package engine

import (
	"github.com/hadnu/arcanum/internal/schemas/events"
	scontent "github.com/hadnu/arcanum/internal/schemas/content"
	"github.com/hadnu/arcanum/internal/types"
)

type EventGenerator struct {
	content scontent.ResolvedContent
}

func NewEventGenerator(content scontent.ResolvedContent) *EventGenerator {
	return &EventGenerator{content: content}
}

func (g *EventGenerator) BuildCharacterEvents(req BuildRequest) ([]events.Event, error) {
	var evts []events.Event

	primaryClass := req.Classes[0]
	hp := computeHP(primaryClass.ID, req.AbilityScores.CON, 1, g.content)

	skills := make(map[types.Skill]types.ProficiencyLevel)
	for _, sk := range req.Skills {
		skills[sk.Skill] = types.ProficiencyProficient
	}
	spellIDs := make([]types.SpellID, len(req.Spells))
	for i, sp := range req.Spells {
		spellIDs[i] = sp.SpellID
	}
	featIDs := make([]types.FeatID, 0)
	for _, f := range req.Feats {
		if f.Level == 1 {
			featIDs = append(featIDs, f.FeatID)
		}
	}

	savingThrows := []types.AbilityScore{}
	if cls, ok := g.content.Classes[primaryClass.ID]; ok {
		savingThrows = cls.SavingThrows
	}

	created := events.CharacterCreatedEvent{
		CharacterID:   types.NewCharacterID(),
		Name:          req.Name,
		SpeciesID:     req.SpeciesID,
		BackgroundID:  req.BackgroundID,
		Classes:       []events.ClassEntry{{ClassID: primaryClass.ID, Level: 1}},
		Level:         1,
		AbilityScores: req.AbilityScores,
		MaxHP:         hp,
		SavingThrows:  savingThrows,
		Skills:        skills,
		Spells:        spellIDs,
		Feats:         featIDs,
		AbilityMethod: req.AbilityMethod,
	}
	evts = append(evts, &created)

	classProgress := map[types.ClassID]int{primaryClass.ID: 1}

	for currentLevel := 2; currentLevel <= req.Level; currentLevel++ {
		var leveledClass types.ClassID
		if len(req.Classes) == 1 {
			leveledClass = req.Classes[0].ID
		} else {
			leveledClass = determineNextClassLevel(req.Classes, classProgress)
		}
		classProgress[leveledClass]++

		hpGain := computeHPGain(leveledClass, req.AbilityScores.CON, g.content)

		lvlEvt := events.CharacterLeveledUpEvent{
			CharacterID: created.CharacterID,
			ClassID:     leveledClass,
			NewLevel:    classProgress[leveledClass],
			HPGained:    hpGain,
		}

		cls := g.content.Classes[leveledClass]
		if classProgress[leveledClass] == subclassLevel(cls) {
			for _, sc := range req.SubclassChoices {
				if sc.ClassID == leveledClass {
					lvlEvt.SubclassChoice = &sc.SubclassID
					evts = append(evts, &events.SubclassChosenEvent{
						CharacterID: created.CharacterID,
						ClassID:     leveledClass,
						SubclassID:  sc.SubclassID,
						Level:       currentLevel,
					})
				}
			}
		}

		if isASILevel(cls, classProgress[leveledClass]) {
			for _, f := range req.Feats {
				if f.Level == currentLevel {
					lvlEvt.FeatChoice = &f.FeatID
				}
			}
		}

		evts = append(evts, &lvlEvt)
	}

	for _, eq := range req.Equipment {
		evts = append(evts, &events.ItemAcquiredEvent{
			CharacterID: created.CharacterID,
			InstanceID:  types.NewItemInstanceID(),
			ItemID:      eq.ItemID,
			Quantity:    eq.Quantity,
		})
		if eq.Equipped {
			evts = append(evts, &events.ItemEquippedEvent{
				CharacterID: created.CharacterID,
				InstanceID:  types.NewItemInstanceID(),
				Slot:        "inventory",
			})
		}
	}

	return evts, nil
}

type subclassLvler interface {
	SubclassLevel() int
}

func subclassLevel(cls *scontent.Class) int {
	for _, lvl := range cls.Levels {
		for _, f := range lvl.Features {
			if f == types.FeatID("class."+string(cls.ID)+".subclass") {
				return lvl.Level
			}
		}
	}
	return 3
}

func computeHP(classID types.ClassID, con int, level int, content scontent.ResolvedContent) int {
	hitDie := 6
	if cls, ok := content.Classes[classID]; ok {
		switch cls.HitDie {
		case types.HitDieD6:
			hitDie = 6
		case types.HitDieD8:
			hitDie = 8
		case types.HitDieD10:
			hitDie = 10
		case types.HitDieD12:
			hitDie = 12
		}
	}
	conMod := (con - 10) / 2
	if conMod < 0 {
		conMod = 0
	}
	avgDie := hitDie/2 + 1
	return hitDie + conMod + (level-1)*(avgDie+conMod)
}

func computeHPGain(classID types.ClassID, con int, content scontent.ResolvedContent) int {
	hitDie := 6
	if cls, ok := content.Classes[classID]; ok {
		switch cls.HitDie {
		case types.HitDieD6:
			hitDie = 6
		case types.HitDieD8:
			hitDie = 8
		case types.HitDieD10:
			hitDie = 10
		case types.HitDieD12:
			hitDie = 12
		}
	}
	conMod := (con - 10) / 2
	if conMod < 0 {
		conMod = 0
	}
	return hitDie/2 + 1 + conMod
}

func determineNextClassLevel(classes []ClassBuildEntry, progress map[types.ClassID]int) types.ClassID {
	var best types.ClassID
	lowestRatio := 999.0
	for _, c := range classes {
		ratio := float64(progress[c.ID]) / float64(c.Level)
		if ratio < lowestRatio {
			lowestRatio = ratio
			best = c.ID
		}
	}
	return best
}

func isASILevel(cls *scontent.Class, classLevel int) bool {
	asiLevels := []int{4, 8, 12, 16, 19}
	for _, l := range asiLevels {
		if classLevel == l {
			return true
		}
	}
	return false
}
