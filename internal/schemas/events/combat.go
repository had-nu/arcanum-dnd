package events

import (
	"errors"

	"github.com/hadnu/arcanum/internal/types"
)

// DamageComponent represents a single damage type and amount.
type DamageComponent struct {
	Type   types.DamageType `json:"type" validate:"required"`
	Dice   string           `json:"dice,omitempty"`
	Amount int              `json:"amount" validate:"required"`
}

// DamageAppliedEvent represents damage being applied to a target.
type DamageAppliedEvent struct {
	TargetID   types.CharacterID  `json:"targetId" validate:"required"`
	SourceID   string             `json:"sourceId,omitempty"`
	Components []DamageComponent  `json:"components" validate:"required,min=1"`
	Total      int                `json:"total" validate:"required"`
	IsCritical bool               `json:"isCritical,omitempty"`
}

func (e DamageAppliedEvent) EventType() EventType   { return EventDamageApplied }
func (e DamageAppliedEvent) SchemaVersion() int     { return 1 }
func (e DamageAppliedEvent) Validate() error {
	if len(e.Components) == 0 { return errors.New("components required") }
	if e.Total < 1 { return errors.New("total must be >= 1") }
	return nil
}

// HealedEvent represents healing applied to a target.
type HealedEvent struct {
	TargetID types.CharacterID `json:"targetId" validate:"required"`
	Amount   int               `json:"amount" validate:"min=1"`
	SourceID string            `json:"sourceId,omitempty"`
}

func (e HealedEvent) EventType() EventType   { return EventHealed }
func (e HealedEvent) SchemaVersion() int     { return 1 }
func (e HealedEvent) Validate() error {
	if e.Amount < 1 { return errors.New("amount must be >= 1") }
	return nil
}

// TempHPGrantedEvent represents temporary HP being granted.
type TempHPGrantedEvent struct {
	TargetID types.CharacterID `json:"targetId" validate:"required"`
	Amount   int               `json:"amount" validate:"min=1"`
	SourceID string            `json:"sourceId,omitempty"`
}

func (e TempHPGrantedEvent) EventType() EventType { return EventTempHPGranted }
func (e TempHPGrantedEvent) SchemaVersion() int   { return 1 }
func (e TempHPGrantedEvent) Validate() error {
	if e.Amount < 1 { return errors.New("amount must be >= 1") }
	return nil
}

// ConditionAppliedEvent represents a condition being applied.
type ConditionAppliedEvent struct {
	TargetID    types.CharacterID `json:"targetId" validate:"required"`
	ConditionID types.ConditionID `json:"conditionId" validate:"required"`
	Duration    *string           `json:"duration,omitempty"`
	DC          *int              `json:"dc,omitempty"`
	SourceID    string            `json:"sourceId,omitempty"`
}

func (e ConditionAppliedEvent) EventType() EventType { return EventConditionApplied }
func (e ConditionAppliedEvent) SchemaVersion() int   { return 1 }
func (e ConditionAppliedEvent) Validate() error { return nil }

// ConditionRemovedEvent represents a condition being removed.
type ConditionRemovedEvent struct {
	TargetID    types.CharacterID `json:"targetId" validate:"required"`
	ConditionID types.ConditionID `json:"conditionId" validate:"required"`
	Reason      string            `json:"reason,omitempty"`
}

func (e ConditionRemovedEvent) EventType() EventType { return EventConditionRemoved }
func (e ConditionRemovedEvent) SchemaVersion() int   { return 1 }
func (e ConditionRemovedEvent) Validate() error { return nil }

// AttackRolledEvent represents an attack roll.
type AttackRolledEvent struct {
	AttackerID types.CharacterID `json:"attackerId" validate:"required"`
	TargetID   types.CharacterID `json:"targetId" validate:"required"`
	WeaponID   string            `json:"weaponId,omitempty"`
	AttackBonus int              `json:"attackBonus"`
	Roll       int               `json:"roll" validate:"min=1,max=20"`
	Total      int               `json:"total"`
	IsCrit     bool              `json:"isCrit,omitempty"`
	IsFumble   bool              `json:"isFumble,omitempty"`
	Hit        bool              `json:"hit"`
}

func (e AttackRolledEvent) EventType() EventType { return EventAttackRolled }
func (e AttackRolledEvent) SchemaVersion() int   { return 1 }
func (e AttackRolledEvent) Validate() error {
	if e.Roll < 1 || e.Roll > 20 { return errors.New("roll must be 1-20") }
	return nil
}

// DamageRolledEvent represents damage dice being rolled.
type DamageRolledEvent struct {
	AttackerID types.CharacterID `json:"attackerId" validate:"required"`
	TargetID   types.CharacterID `json:"targetId" validate:"required"`
	Components []DamageComponent `json:"components" validate:"required,min=1"`
}

func (e DamageRolledEvent) EventType() EventType { return EventDamageRolled }
func (e DamageRolledEvent) SchemaVersion() int   { return 1 }
func (e DamageRolledEvent) Validate() error {
	if len(e.Components) == 0 { return errors.New("components required") }
	return nil
}

// SaveRolledEvent represents a saving throw roll.
type SaveRolledEvent struct {
	CharacterID types.CharacterID   `json:"characterId" validate:"required"`
	Ability     types.AbilityScore  `json:"ability" validate:"required"`
	Roll        int                 `json:"roll" validate:"min=1,max=20"`
	Bonus       int                 `json:"bonus"`
	Total       int                 `json:"total"`
	DC          int                 `json:"dc"`
	Success     bool                `json:"success"`
}

func (e SaveRolledEvent) EventType() EventType { return EventSaveRolled }
func (e SaveRolledEvent) SchemaVersion() int   { return 1 }
func (e SaveRolledEvent) Validate() error {
	if e.Roll < 1 || e.Roll > 20 { return errors.New("roll must be 1-20") }
	return nil
}

// AbilityCheckRolledEvent represents an ability check roll.
type AbilityCheckRolledEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	Skill       types.Skill       `json:"skill,omitempty"`
	Ability     types.AbilityScore `json:"ability,omitempty"`
	Roll        int               `json:"roll" validate:"min=1,max=20"`
	Bonus       int               `json:"bonus"`
	Total       int               `json:"total"`
	DC          int               `json:"dc"`
	Success     bool              `json:"success"`
}

func (e AbilityCheckRolledEvent) EventType() EventType { return EventAbilityCheckRolled }
func (e AbilityCheckRolledEvent) SchemaVersion() int   { return 1 }
func (e AbilityCheckRolledEvent) Validate() error {
	if e.Roll < 1 || e.Roll > 20 { return errors.New("roll must be 1-20") }
	if e.Skill == "" && e.Ability == "" { return errors.New("skill or ability required") }
	return nil
}

// DeathSaveRolledEvent represents a death saving throw.
type DeathSaveRolledEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	Roll        int               `json:"roll" validate:"min=1,max=20"`
	Successes   int               `json:"successes" validate:"min=0,max=3"`
	Failures    int               `json:"failures" validate:"min=0,max=3"`
}

func (e DeathSaveRolledEvent) EventType() EventType { return EventDeathSaveRolled }
func (e DeathSaveRolledEvent) SchemaVersion() int   { return 1 }
func (e DeathSaveRolledEvent) Validate() error {
	if e.Roll < 1 || e.Roll > 20 { return errors.New("roll must be 1-20") }
	if e.Successes < 0 || e.Successes > 3 { return errors.New("successes must be 0-3") }
	if e.Failures < 0 || e.Failures > 3 { return errors.New("failures must be 0-3") }
	return nil
}

// StabilizedEvent represents a character stabilizing.
type StabilizedEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
}

func (e StabilizedEvent) EventType() EventType { return EventStabilized }
func (e StabilizedEvent) SchemaVersion() int   { return 1 }
func (e StabilizedEvent) Validate() error { return nil }

// ExhaustionChangedEvent represents exhaustion level change.
type ExhaustionChangedEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	OldLevel    int               `json:"oldLevel" validate:"min=0,max=6"`
	NewLevel    int               `json:"newLevel" validate:"min=0,max=6"`
}

func (e ExhaustionChangedEvent) EventType() EventType { return EventExhaustionChanged }
func (e ExhaustionChangedEvent) SchemaVersion() int   { return 1 }
func (e ExhaustionChangedEvent) Validate() error {
	if e.OldLevel < 0 || e.OldLevel > 6 { return errors.New("oldLevel must be 0-6") }
	if e.NewLevel < 0 || e.NewLevel > 6 { return errors.New("newLevel must be 0-6") }
	return nil
}

func init() {
	RegisterEvent(EventDamageApplied, 1, func() Event { return &DamageAppliedEvent{} })
	RegisterEvent(EventHealed, 1, func() Event { return &HealedEvent{} })
	RegisterEvent(EventTempHPGranted, 1, func() Event { return &TempHPGrantedEvent{} })
	RegisterEvent(EventConditionApplied, 1, func() Event { return &ConditionAppliedEvent{} })
	RegisterEvent(EventConditionRemoved, 1, func() Event { return &ConditionRemovedEvent{} })
	RegisterEvent(EventAttackRolled, 1, func() Event { return &AttackRolledEvent{} })
	RegisterEvent(EventDamageRolled, 1, func() Event { return &DamageRolledEvent{} })
	RegisterEvent(EventSaveRolled, 1, func() Event { return &SaveRolledEvent{} })
	RegisterEvent(EventAbilityCheckRolled, 1, func() Event { return &AbilityCheckRolledEvent{} })
	RegisterEvent(EventDeathSaveRolled, 1, func() Event { return &DeathSaveRolledEvent{} })
	RegisterEvent(EventStabilized, 1, func() Event { return &StabilizedEvent{} })
	RegisterEvent(EventExhaustionChanged, 1, func() Event { return &ExhaustionChangedEvent{} })
}