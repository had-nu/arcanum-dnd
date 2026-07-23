package schemas

import "github.com/hadnu/arcanum/internal/types"

type EffectKind string

const (
	EffectSetBaseAC        EffectKind = "SetBaseAC"
	EffectAddAC            EffectKind = "AddAC"
	EffectAddAttack        EffectKind = "AddAttack"
	EffectAddDamage        EffectKind = "AddDamage"
	EffectAddDamageToAttacker EffectKind = "AddDamageToAttacker"
	EffectAddSpellAttack   EffectKind = "AddSpellAttack"
	EffectAddSpellSaveDC   EffectKind = "AddSpellSaveDC"
	EffectSetSpeed         EffectKind = "SetSpeed"
	EffectAddSpeed         EffectKind = "AddSpeed"
	EffectResistance       EffectKind = "Resistance"
	EffectImmunity         EffectKind = "Immunity"
	EffectVulnerability    EffectKind = "Vulnerability"
	EffectConditionImmunity EffectKind = "ConditionImmunity"
	EffectGrantLanguage    EffectKind = "GrantLanguage"
	EffectGrantSense       EffectKind = "GrantSense"
	EffectGrantProficiency EffectKind = "GrantProficiency"
	EffectRollAdvantage    EffectKind = "RollAdvantage"
	EffectRollDisadvantage EffectKind = "RollDisadvantage"
	EffectHealOnTurnStart  EffectKind = "HealOnTurnStart"
	EffectTempHPOnTurnStart EffectKind = "TempHPOnTurnStart"
	EffectAddDamageDice    EffectKind = "AddDamageDice"
	EffectCustom           EffectKind = "Custom"
)

type ModifierTarget interface {
	isModifierTarget()
}

type ModifierTargetAC struct{ ModifierTarget }

func (ModifierTargetAC) isModifierTarget() {}

type ModifierTargetAttack struct{ ModifierTarget }

func (ModifierTargetAttack) isModifierTarget() {}

type ModifierTargetDamage struct{ ModifierTarget }

func (ModifierTargetDamage) isModifierTarget() {}

type ModifierTargetSave struct {
	Ability types.AbilityScore `yaml:"ability,omitempty"`
}

func (ModifierTargetSave) isModifierTarget() {}

type ModifierTargetCheck struct {
	Ability types.AbilityScore `yaml:"ability,omitempty"`
}

func (ModifierTargetCheck) isModifierTarget() {}

type ModifierTargetSkill struct {
	Skill types.Skill `yaml:"skill"`
}

func (ModifierTargetSkill) isModifierTarget() {}

type RollTarget interface {
	isRollTarget()
}

type RollTargetAttack struct{ RollTarget }

func (RollTargetAttack) isRollTarget() {}

type RollTargetSave struct {
	Ability types.AbilityScore `yaml:"ability,omitempty"`
}

func (RollTargetSave) isRollTarget() {}

type RollTargetCheck struct {
	Ability types.AbilityScore `yaml:"ability,omitempty"`
}

func (RollTargetCheck) isRollTarget() {}

type RollTargetSkill struct {
	Skill types.Skill `yaml:"skill"`
}

func (RollTargetSkill) isRollTarget() {}

type Effect struct {
	Kind    EffectKind `yaml:"kind" validate:"required"`
	Value   float64    `yaml:"value,omitempty"`
	Formula string     `yaml:"formula,omitempty"`

	TargetAC     bool                `yaml:"targetAC,omitempty"`
	TargetAttack bool                `yaml:"targetAttack,omitempty"`
	TargetDamage bool                `yaml:"targetDamage,omitempty"`
	TargetSave   *types.AbilityScore `yaml:"targetSave,omitempty"`
	TargetCheck  *types.AbilityScore `yaml:"targetCheck,omitempty"`
	TargetSkill  *types.Skill        `yaml:"targetSkill,omitempty"`

	DamageType      *types.DamageType `yaml:"damageType,omitempty"`
	DamageDice      string            `yaml:"damageDice,omitempty"`
	ConditionID     *types.ConditionID `yaml:"conditionId,omitempty"`
	MovementMode    *types.MovementMode `yaml:"movementMode,omitempty"`
	Language        *string            `yaml:"language,omitempty"`
	Proficiency     *types.ProficiencyLevel `yaml:"proficiency,omitempty"`
	ProficiencySkill *types.Skill      `yaml:"proficiencySkill,omitempty"`

	SubEffects []Effect `yaml:"subEffects,omitempty"`
	HandlerID  string   `yaml:"handlerId,omitempty"`
	Params     any      `yaml:"params,omitempty"`

	Duration       *string `yaml:"duration,omitempty"`
	RequiresConcentration bool `yaml:"requiresConcentration,omitempty"`
}

func (e Effect) ToModifierTarget() ModifierTarget {
	switch {
	case e.TargetAC:
		return ModifierTargetAC{}
	case e.TargetAttack:
		return ModifierTargetAttack{}
	case e.TargetDamage:
		return ModifierTargetDamage{}
	case e.TargetSave != nil:
		return ModifierTargetSave{Ability: *e.TargetSave}
	case e.TargetCheck != nil:
		return ModifierTargetCheck{Ability: *e.TargetCheck}
	case e.TargetSkill != nil:
		return ModifierTargetSkill{Skill: *e.TargetSkill}
	default:
		return nil
	}
}

type EffectStack struct {
	Effects []EffectInstance `json:"effects"`
}

type EffectInstance struct {
	ID          types.EffectInstanceID `json:"id" validate:"required"`
	Effect      Effect                 `json:"effect" validate:"required"`
	SourceID    string                 `json:"sourceId"`
	SourceType  string                 `json:"sourceType"`
	Remaining   *int                   `json:"remaining,omitempty"`
	Concentration bool                 `json:"concentration,omitempty"`
}
