package engine

import (
	"github.com/hadnu/arcanum/internal/schemas/events"
	sruntime "github.com/hadnu/arcanum/internal/schemas/runtime"
	"github.com/hadnu/arcanum/internal/types"
)

func (a *Applier) Apply(state sruntime.CampaignState, evt events.Event) sruntime.CampaignState {
	switch evt.Type {
	case events.EventCharacterCreated:
		return a.applyCharacterCreated(state, *evt.CharacterCreated)
	case events.EventDamageApplied:
		return a.applyDamageApplied(state, *evt.DamageApplied)
	case events.EventHealed:
		return a.applyHealed(state, *evt.Healed)
	case events.EventTempHPGranted:
		return a.applyTempHPGranted(state, *evt.TempHPGranted)
	case events.EventConditionApplied:
		return a.applyConditionApplied(state, *evt.ConditionApplied)
	case events.EventConditionRemoved:
		return a.applyConditionRemoved(state, *evt.ConditionRemoved)
	case events.EventAttackRolled:
		return a.applyAttackRolled(state, *evt.AttackRolled)
	case events.EventDamageRolled:
		return a.applyDamageRolled(state, *evt.DamageRolled)
	case events.EventShortRestStarted:
		return a.applyShortRestStarted(state, *evt.ShortRestStarted)
	case events.EventShortRestEnded:
		return a.applyShortRestEnded(state, *evt.ShortRestEnded)
	case events.EventLongRestStarted:
		return a.applyLongRestStarted(state, *evt.LongRestStarted)
	case events.EventLongRestEnded:
		return a.applyLongRestEnded(state, *evt.LongRestEnded)
	case events.EventItemAcquired:
		return a.applyItemAcquired(state, *evt.ItemAcquired)
	case events.EventItemEquipped:
		return a.applyItemEquipped(state, *evt.ItemEquipped)
	case events.EventResourceSpent:
		return a.applyResourceSpent(state, *evt.ResourceSpent)
	case events.EventResourceRestored:
		return a.applyResourceRestored(state, *evt.ResourceRestored)
	case events.EventLevelUpResolved:
		return a.applyLevelUpResolved(state, *evt.LevelUpResolved)
	case events.EventWorldClockAdvanced:
		return a.applyWorldClockAdvanced(state, *evt.WorldClockAdvanced)
	case events.EventEncounterCreated:
		return a.applyEncounterCreated(state, *evt.EncounterCreated)
	case events.EventEncounterStarted:
		return a.applyEncounterStarted(state, *evt.EncounterStarted)
	case events.EventInitiativeRolled:
		return a.applyInitiativeRolled(state, *evt.InitiativeRolled)
	case events.EventTurnStarted:
		return a.applyTurnStarted(state, *evt.TurnStarted)
	case events.EventTurnEnded:
		return a.applyTurnEnded(state, *evt.TurnEnded)
	case events.EventEncounterEnded:
		return a.applyEncounterEnded(state, *evt.EncounterEnded)
	case events.EventChoiceRequired:
		return a.applyChoiceRequired(state, *evt.ChoiceRequired)
	case events.EventChoiceResolved:
		return a.applyChoiceResolved(state, *evt.ChoiceResolved)
	case events.EventNPCActionResolved:
		return a.applyNPCActionResolved(state, *evt.NPCActionResolved)
	}
	return state
}

func (a *Applier) applyCharacterCreated(state sruntime.CampaignState, evt events.CharacterCreatedEvent) sruntime.CampaignState {
	classes := make([]sruntime.ClassEnrollment, len(evt.Classes))
	level := 0
	for i, c := range evt.Classes {
		classes[i] = sruntime.ClassEnrollment{ClassID: c.ClassID, Level: c.Level}
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

func (a *Applier) applyLevelUpResolved(state sruntime.CampaignState, evt events.LevelUpResolvedEvent) sruntime.CampaignState {
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
	return state
}

func (a *Applier) applyWorldClockAdvanced(state sruntime.CampaignState, evt events.WorldClockAdvancedEvent) sruntime.CampaignState {
	state.World.CurrentTime = evt.To
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

func (a *Applier) applyNPCActionResolved(state sruntime.CampaignState, evt events.NPCActionResolvedEvent) sruntime.CampaignState {
	return state
}
