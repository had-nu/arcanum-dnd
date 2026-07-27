package engine

import (
	scontent "github.com/hadnu/arcanum/internal/schemas/content"
	"github.com/hadnu/arcanum/internal/schemas/events"
	sruntime "github.com/hadnu/arcanum/internal/schemas/runtime"
	"github.com/hadnu/arcanum/internal/types"
)

type Applier struct {
	content scontent.ResolvedContent
}

func NewApplier(content scontent.ResolvedContent) *Applier {
	return &Applier{content: content}
}

func (a *Applier) Apply(state sruntime.CampaignState, evt events.Event) sruntime.CampaignState {
	switch e := evt.(type) {
	case *events.CharacterCreatedEvent:
		return a.applyCharacterCreated(state, *e)
	case *events.DamageAppliedEvent:
		return a.applyDamageApplied(state, *e)
	case *events.HealedEvent:
		return a.applyHealed(state, *e)
	case *events.TempHPGrantedEvent:
		return a.applyTempHPGranted(state, *e)
	case *events.ConditionAppliedEvent:
		return a.applyConditionApplied(state, *e)
	case *events.ConditionRemovedEvent:
		return a.applyConditionRemoved(state, *e)
	case *events.AttackRolledEvent:
		return a.applyAttackRolled(state, *e)
	case *events.DamageRolledEvent:
		return a.applyDamageRolled(state, *e)
	case *events.ShortRestStartedEvent:
		return a.applyShortRestStarted(state, *e)
	case *events.ShortRestEndedEvent:
		return a.applyShortRestEnded(state, *e)
	case *events.LongRestStartedEvent:
		return a.applyLongRestStarted(state, *e)
	case *events.LongRestEndedEvent:
		return a.applyLongRestEnded(state, *e)
	case *events.ItemAcquiredEvent:
		return a.applyItemAcquired(state, *e)
	case *events.ItemEquippedEvent:
		return a.applyItemEquipped(state, *e)
	case *events.ResourceSpentEvent:
		return a.applyResourceSpent(state, *e)
	case *events.ResourceRestoredEvent:
		return a.applyResourceRestored(state, *e)
	case *events.CharacterLeveledUpEvent:
		return a.applyCharacterLeveledUp(state, *e)
	case *events.FeatTakenEvent:
		return a.applyFeatTaken(state, *e)
	case *events.SubclassChosenEvent:
		return a.applySubclassChosen(state, *e)
	case *events.SpellCastDeclaredEvent:
		return a.applySpellCastDeclared(state, *e)
	case *events.SpellSlotUsedEvent:
		return a.applySpellSlotUsed(state, *e)
	case *events.ConcentrationStartedEvent:
		return a.applyConcentrationStarted(state, *e)
	case *events.ConcentrationBrokenEvent:
		return a.applyConcentrationBroken(state, *e)
	case *events.ExhaustionChangedEvent:
		return a.applyExhaustionChanged(state, *e)
	case *events.DeathSaveRolledEvent:
		return a.applyDeathSaveRolled(state, *e)
	case *events.StabilizedEvent:
		return a.applyStabilized(state, *e)
	case *events.EncounterCreatedEvent:
		return a.applyEncounterCreated(state, *e)
	case *events.EncounterStartedEvent:
		return a.applyEncounterStarted(state, *e)
	case *events.InitiativeRolledEvent:
		return a.applyInitiativeRolled(state, *e)
	case *events.TurnStartedEvent:
		return a.applyTurnStarted(state, *e)
	case *events.TurnEndedEvent:
		return a.applyTurnEnded(state, *e)
	case *events.RoundEndedEvent:
		return a.applyRoundEnded(state, *e)
	case *events.EncounterEndedEvent:
		return a.applyEncounterEnded(state, *e)
	case *events.ChoiceRequiredEvent:
		return a.applyChoiceRequired(state, *e)
	case *events.ChoiceResolvedEvent:
		return a.applyChoiceResolved(state, *e)
	case *events.HitDieSpentEvent:
		return a.applyHitDieSpent(state, *e)
	}
	return state
}

func (a *Applier) applyCharacterCreated(state sruntime.CampaignState, evt events.CharacterCreatedEvent) sruntime.CampaignState {
	classes := make([]sruntime.ClassEnrollment, len(evt.Classes))
	level := 0
	for i, c := range evt.Classes {
		classes[i] = sruntime.ClassEnrollment{ClassID: c.ClassID, Level: c.Level, SubClassID: c.SubclassID}
		level += c.Level
	}
	if evt.Level > level {
		level = evt.Level
	}
	char := &sruntime.Character{
		ID:            evt.CharacterID,
		Name:          evt.Name,
		Species:       evt.SpeciesID,
		Background:    evt.BackgroundID,
		Classes:       classes,
		Level:         level,
		AbilityScores: evt.AbilityScores,
		HP:            sruntime.HP{Current: evt.MaxHP, Max: evt.MaxHP},
		Feats:         evt.Feats,
	}
	char.Proficiencies.SavingThrows = evt.SavingThrows
	if evt.Skills != nil {
		char.Proficiencies.Skills = evt.Skills
	} else {
		char.Proficiencies.Skills = make(map[types.Skill]types.ProficiencyLevel)
	}
	state.Characters[evt.CharacterID] = char
	return state
}

func (a *Applier) applyDamageApplied(state sruntime.CampaignState, evt events.DamageAppliedEvent) sruntime.CampaignState {
	char, ok := state.Characters[evt.TargetID]
	if !ok {
		return state
	}
	remaining := evt.Total
	if char.TempHP > 0 {
		if char.TempHP >= remaining {
			char.TempHP -= remaining
			return state
		}
		remaining -= char.TempHP
		char.TempHP = 0
	}
	char.HP.Current -= remaining
	if char.HP.Current < 0 {
		char.HP.Current = 0
	}
	return state
}

func (a *Applier) applyHealed(state sruntime.CampaignState, evt events.HealedEvent) sruntime.CampaignState {
	char, ok := state.Characters[evt.TargetID]
	if !ok {
		return state
	}
	char.HP.Current += evt.Amount
	if char.HP.Current > char.HP.Max {
		char.HP.Current = char.HP.Max
	}
	return state
}

func (a *Applier) applyTempHPGranted(state sruntime.CampaignState, evt events.TempHPGrantedEvent) sruntime.CampaignState {
	char, ok := state.Characters[evt.TargetID]
	if !ok {
		return state
	}
	if evt.Amount > char.TempHP {
		char.TempHP = evt.Amount
	}
	return state
}

func (a *Applier) applyConditionApplied(state sruntime.CampaignState, evt events.ConditionAppliedEvent) sruntime.CampaignState {
	char, ok := state.Characters[evt.TargetID]
	if !ok {
		return state
	}
	char.Conditions = append(char.Conditions, sruntime.AppliedCondition{
		ConditionID: evt.ConditionID,
		DC:          evt.DC,
		Duration:    evt.Duration,
	})
	return state
}

func (a *Applier) applyConditionRemoved(state sruntime.CampaignState, evt events.ConditionRemovedEvent) sruntime.CampaignState {
	char, ok := state.Characters[evt.TargetID]
	if !ok {
		return state
	}
	filtered := make([]sruntime.AppliedCondition, 0, len(char.Conditions))
	for _, c := range char.Conditions {
		if c.ConditionID != evt.ConditionID {
			filtered = append(filtered, c)
		}
	}
	char.Conditions = filtered
	return state
}

func (a *Applier) applyAttackRolled(state sruntime.CampaignState, evt events.AttackRolledEvent) sruntime.CampaignState {
	return state
}

func (a *Applier) applyDamageRolled(state sruntime.CampaignState, evt events.DamageRolledEvent) sruntime.CampaignState {
	return state
}

func (a *Applier) applyShortRestStarted(state sruntime.CampaignState, evt events.ShortRestStartedEvent) sruntime.CampaignState {
	return state
}

func (a *Applier) applyShortRestEnded(state sruntime.CampaignState, evt events.ShortRestEndedEvent) sruntime.CampaignState {
	return state
}

func (a *Applier) applyLongRestStarted(state sruntime.CampaignState, evt events.LongRestStartedEvent) sruntime.CampaignState {
	return state
}

func (a *Applier) applyLongRestEnded(state sruntime.CampaignState, evt events.LongRestEndedEvent) sruntime.CampaignState {
	return state
}

func (a *Applier) applyItemAcquired(state sruntime.CampaignState, evt events.ItemAcquiredEvent) sruntime.CampaignState {
	char, ok := state.Characters[evt.CharacterID]
	if !ok {
		return state
	}
	char.Items = append(char.Items, sruntime.ItemInstance{
		InstanceID:   evt.InstanceID,
		DefinitionID: evt.ItemID,
		Quantity:     evt.Quantity,
	})
	return state
}

func (a *Applier) applyItemEquipped(state sruntime.CampaignState, evt events.ItemEquippedEvent) sruntime.CampaignState {
	return state
}

func (a *Applier) applyResourceSpent(state sruntime.CampaignState, evt events.ResourceSpentEvent) sruntime.CampaignState {
	char, ok := state.Characters[evt.CharacterID]
	if !ok {
		return state
	}
	for i, res := range char.Resources {
		if res.ResourceID == evt.ResourceID {
			char.Resources[i].Current -= evt.Amount
			if char.Resources[i].Current < 0 {
				char.Resources[i].Current = 0
			}
			break
		}
	}
	return state
}

func (a *Applier) applyResourceRestored(state sruntime.CampaignState, evt events.ResourceRestoredEvent) sruntime.CampaignState {
	char, ok := state.Characters[evt.CharacterID]
	if !ok {
		return state
	}
	for i, res := range char.Resources {
		if res.ResourceID == evt.ResourceID {
			char.Resources[i].Current += evt.Amount
			if char.Resources[i].Current > char.Resources[i].Max {
				char.Resources[i].Current = char.Resources[i].Max
			}
			break
		}
	}
	return state
}

func (a *Applier) applyCharacterLeveledUp(state sruntime.CampaignState, evt events.CharacterLeveledUpEvent) sruntime.CampaignState {
	char, ok := state.Characters[evt.CharacterID]
	if !ok {
		return state
	}
	char.Level = evt.NewLevel
	char.HP.Max += evt.HPGained
	char.HP.Current += evt.HPGained
	for i, c := range char.Classes {
		if c.ClassID == evt.ClassID {
			char.Classes[i].Level++
			break
		}
	}
	if evt.FeatChoice != nil {
		char.Feats = append(char.Feats, *evt.FeatChoice)
	}
	if evt.SubclassChoice != nil {
		for i, c := range char.Classes {
			if c.ClassID == evt.ClassID {
				char.Classes[i].SubClassID = evt.SubclassChoice
				break
			}
		}
	}
	return state
}

func (a *Applier) applyEncounterCreated(state sruntime.CampaignState, evt events.EncounterCreatedEvent) sruntime.CampaignState {
	state.Encounters[evt.EncounterID] = &sruntime.Encounter{
		ID:     evt.EncounterID,
		Name:   evt.Name,
		Status: "pending",
	}
	return state
}

func (a *Applier) applyEncounterStarted(state sruntime.CampaignState, evt events.EncounterStartedEvent) sruntime.CampaignState {
	enc, ok := state.Encounters[evt.EncounterID]
	if ok {
		enc.Status = "active"
		enc.Round = 1
	}
	return state
}

func (a *Applier) applyInitiativeRolled(state sruntime.CampaignState, evt events.InitiativeRolledEvent) sruntime.CampaignState {
	return state
}

func (a *Applier) applyTurnStarted(state sruntime.CampaignState, evt events.TurnStartedEvent) sruntime.CampaignState {
	enc, ok := state.Encounters[evt.EncounterID]
	if ok {
		enc.CurrentTurn = evt.CombatantID.String()
	}
	return state
}

func (a *Applier) applyTurnEnded(state sruntime.CampaignState, evt events.TurnEndedEvent) sruntime.CampaignState {
	return state
}

func (a *Applier) applyRoundEnded(state sruntime.CampaignState, evt events.RoundEndedEvent) sruntime.CampaignState {
	enc, ok := state.Encounters[evt.EncounterID]
	if ok {
		enc.Round++
	}
	return state
}

func (a *Applier) applyEncounterEnded(state sruntime.CampaignState, evt events.EncounterEndedEvent) sruntime.CampaignState {
	enc, ok := state.Encounters[evt.EncounterID]
	if ok {
		enc.Status = "ended"
	}
	return state
}

func (a *Applier) applyChoiceRequired(state sruntime.CampaignState, evt events.ChoiceRequiredEvent) sruntime.CampaignState {
	char, ok := state.Characters[evt.CharacterID]
	if !ok {
		return state
	}
	opts := make([]types.ChoiceOption, len(evt.Choices))
	for i, c := range evt.Choices {
		opts[i] = types.ChoiceOption{ID: c.ID, Label: c.Label, Description: c.Description}
	}
	char.PendingChoices = append(char.PendingChoices, sruntime.PendingChoice{
		CharacterID: evt.CharacterID,
		Options:     opts,
	})
	return state
}

func (a *Applier) applyChoiceResolved(state sruntime.CampaignState, evt events.ChoiceResolvedEvent) sruntime.CampaignState {
	char, ok := state.Characters[evt.CharacterID]
	if !ok {
		return state
	}
	filtered := make([]sruntime.PendingChoice, 0, len(char.PendingChoices))
	for _, pc := range char.PendingChoices {
		if pc.ChoiceID != evt.ChoiceID {
			filtered = append(filtered, pc)
		}
	}
	char.PendingChoices = filtered
	return state
}

func (a *Applier) applySpellCastDeclared(state sruntime.CampaignState, evt events.SpellCastDeclaredEvent) sruntime.CampaignState {
	return state
}

func (a *Applier) applySpellSlotUsed(state sruntime.CampaignState, evt events.SpellSlotUsedEvent) sruntime.CampaignState {
	char, ok := state.Characters[evt.CharacterID]
	if !ok {
		return state
	}
	for i := range char.SpellSlotsUsed {
		if i == evt.SlotLevel && char.SpellSlotsUsed[i] > 0 {
			char.SpellSlotsUsed[i]--
			break
		}
	}
	return state
}

func (a *Applier) applyConcentrationStarted(state sruntime.CampaignState, evt events.ConcentrationStartedEvent) sruntime.CampaignState {
	char, ok := state.Characters[evt.CharacterID]
	if !ok {
		return state
	}
	char.ActiveConcentration = &sruntime.ActiveConcentration{
		SpellID: evt.SpellID,
	}
	return state
}

func (a *Applier) applyConcentrationBroken(state sruntime.CampaignState, evt events.ConcentrationBrokenEvent) sruntime.CampaignState {
	char, ok := state.Characters[evt.CharacterID]
	if !ok {
		return state
	}
	char.ActiveConcentration = nil
	return state
}

func (a *Applier) applyExhaustionChanged(state sruntime.CampaignState, evt events.ExhaustionChangedEvent) sruntime.CampaignState {
	char, ok := state.Characters[evt.CharacterID]
	if !ok {
		return state
	}
	char.ExhaustionLevel = evt.NewLevel
	return state
}

func (a *Applier) applyDeathSaveRolled(state sruntime.CampaignState, evt events.DeathSaveRolledEvent) sruntime.CampaignState {
	char, ok := state.Characters[evt.CharacterID]
	if !ok {
		return state
	}
	char.DeathSaves.Successes = evt.Successes
	char.DeathSaves.Failures = evt.Failures
	return state
}

func (a *Applier) applyStabilized(state sruntime.CampaignState, evt events.StabilizedEvent) sruntime.CampaignState {
	char, ok := state.Characters[evt.CharacterID]
	if !ok {
		return state
	}
	char.DeathSaves.Successes = 3
	char.DeathSaves.Failures = 0
	return state
}

func (a *Applier) applyFeatTaken(state sruntime.CampaignState, evt events.FeatTakenEvent) sruntime.CampaignState {
	char, ok := state.Characters[evt.CharacterID]
	if !ok {
		return state
	}
	char.Feats = append(char.Feats, evt.FeatID)
	return state
}

func (a *Applier) applySubclassChosen(state sruntime.CampaignState, evt events.SubclassChosenEvent) sruntime.CampaignState {
	char, ok := state.Characters[evt.CharacterID]
	if !ok {
		return state
	}
	for i, c := range char.Classes {
		if c.ClassID == evt.ClassID {
			char.Classes[i].SubClassID = &evt.SubclassID
			break
		}
	}
	return state
}

func (a *Applier) applyHitDieSpent(state sruntime.CampaignState, evt events.HitDieSpentEvent) sruntime.CampaignState {
	char, ok := state.Characters[evt.CharacterID]
	if !ok {
		return state
	}
	if char.HitDiceUsed == nil {
		char.HitDiceUsed = make(map[types.HitDie]int)
	}
	char.HitDiceUsed[evt.Die] += evt.Rolled
	return state
}