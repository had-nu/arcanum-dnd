package plan

import (
	"github.com/hadnu/arcanum/internal/rng"
	"github.com/hadnu/arcanum/internal/schemas/events"
	"github.com/hadnu/arcanum/internal/schemas/runtime"
	"github.com/hadnu/arcanum/internal/types"
)

type AttackIntent struct {
	AttackerID  types.CharacterID   `json:"attackerId"`
	TargetID    types.CharacterID   `json:"targetId"`
	WeaponID    string              `json:"weaponId,omitempty"`
	SpellID     string              `json:"spellId,omitempty"`
	AttackBonus int                 `json:"attackBonus"`
	DamageDice  string              `json:"damageDice"`
	DamageType  types.DamageType    `json:"damageType"`
	DamageBonus int                 `json:"damageBonus"`
}

func PlanAttack(state runtime.CampaignState, r *rng.DefaultRNG, intent AttackIntent) events.Event {
	roll := rng.RollD20(r)
	total := roll + intent.AttackBonus
	isCrit := roll == 20
	isFumble := roll == 1

	var targetAC int
	char, ok := state.Characters[intent.TargetID]
	if ok {
		targetAC = deriveTargetAC(*char)
	}

	hit := isCrit || (!isFumble && total >= targetAC)

	return &events.AttackRolledEvent{
		AttackerID:  intent.AttackerID,
		TargetID:    intent.TargetID,
		WeaponID:    intent.WeaponID,
		AttackBonus: intent.AttackBonus,
		Roll:        roll,
		Total:       total,
		IsCrit:      isCrit,
		IsFumble:    isFumble,
		Hit:         hit,
	}
}

func planDamage(r rng.RNG, intent AttackIntent, isCrit bool) *events.DamageRolledEvent {
	count := 1
	if isCrit {
		count = 2
	}
	damageDice := rng.RollDice(r, count, 8, intent.DamageBonus)

	return &events.DamageRolledEvent{
		AttackerID: intent.AttackerID,
		TargetID:   intent.TargetID,
		Components: []events.DamageComponent{
			{
				Type:   intent.DamageType,
				Dice:   intent.DamageDice,
				Amount: damageDice.Total,
			},
		},
	}
}

func deriveTargetAC(char runtime.Character) int {
	baseAC := 10 + abilityModifier(char.AbilityScores.DEX)
	for _, item := range char.Items {
		_ = item
	}
	return baseAC
}

func abilityModifier(score int) int {
	return (score - 10) / 2
}