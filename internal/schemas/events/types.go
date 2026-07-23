package events

import "github.com/hadnu/arcanum/internal/types"

type EventType string

const (
	EventCharacterCreated       EventType = "CharacterCreated"
	EventDamageApplied          EventType = "DamageApplied"
	EventHealed                 EventType = "Healed"
	EventTempHPGranted          EventType = "TempHPGranted"
	EventConditionApplied       EventType = "ConditionApplied"
	EventConditionRemoved       EventType = "ConditionRemoved"
	EventAttackRolled           EventType = "AttackRolled"
	EventDamageRolled           EventType = "DamageRolled"
	EventSaveRolled             EventType = "SaveRolled"
	EventAbilityCheckRolled     EventType = "AbilityCheckRolled"
	EventShortRestStarted       EventType = "ShortRestStarted"
	EventShortRestEnded         EventType = "ShortRestEnded"
	EventLongRestStarted        EventType = "LongRestStarted"
	EventLongRestEnded          EventType = "LongRestEnded"
	EventLevelUpResolved        EventType = "LevelUpResolved"
	EventItemAcquired           EventType = "ItemAcquired"
	EventItemEquipped           EventType = "ItemEquipped"
	EventItemUnequipped         EventType = "ItemUnequipped"
	EventResourceSpent          EventType = "ResourceSpent"
	EventResourceRestored       EventType = "ResourceRestored"
	EventHitDieSpent            EventType = "HitDieSpent"
	EventEncounterCreated       EventType = "EncounterCreated"
	EventEncounterStarted       EventType = "EncounterStarted"
	EventInitiativeRolled       EventType = "InitiativeRolled"
	EventTurnStarted            EventType = "TurnStarted"
	EventTurnEnded              EventType = "TurnEnded"
	EventRoundEnded             EventType = "RoundEnded"
	EventEncounterEnded         EventType = "EncounterEnded"
	EventChoiceRequired         EventType = "ChoiceRequired"
	EventChoiceResolved         EventType = "ChoiceResolved"
	EventSpellCastDeclared      EventType = "SpellCastDeclared"
	EventConcentrationStarted   EventType = "ConcentrationStarted"
	EventConcentrationBroken    EventType = "ConcentrationBroken"
	EventExhaustionChanged      EventType = "ExhaustionChanged"
	EventDeathSaveRolled        EventType = "DeathSaveRolled"
	EventStabilized             EventType = "Stabilized"
	EventWorldClockAdvanced     EventType = "WorldClockAdvanced"
	EventNPCActionResolved      EventType = "NPCActionResolved"
	EventCustom                 EventType = "Custom"
)

type Event struct {
	EventEnvelope

	Type EventType `json:"type" validate:"required"`

	CharacterCreated       *CharacterCreatedEvent       `json:"characterCreated,omitempty"`
	DamageApplied          *DamageAppliedEvent          `json:"damageApplied,omitempty"`
	Healed                 *HealedEvent                 `json:"healed,omitempty"`
	TempHPGranted          *TempHPGrantedEvent          `json:"tempHPGranted,omitempty"`
	ConditionApplied       *ConditionAppliedEvent       `json:"conditionApplied,omitempty"`
	ConditionRemoved       *ConditionRemovedEvent       `json:"conditionRemoved,omitempty"`
	AttackRolled           *AttackRolledEvent           `json:"attackRolled,omitempty"`
	DamageRolled           *DamageRolledEvent           `json:"damageRolled,omitempty"`
	SaveRolled             *SaveRolledEvent             `json:"saveRolled,omitempty"`
	AbilityCheckRolled     *AbilityCheckRolledEvent     `json:"abilityCheckRolled,omitempty"`
	LevelUpResolved        *LevelUpResolvedEvent        `json:"levelUpResolved,omitempty"`
	ItemAcquired           *ItemAcquiredEvent           `json:"itemAcquired,omitempty"`
	ItemEquipped           *ItemEquippedEvent           `json:"itemEquipped,omitempty"`
	ItemUnequipped         *ItemUnequippedEvent         `json:"itemUnequipped,omitempty"`
	ResourceSpent          *ResourceSpentEvent          `json:"resourceSpent,omitempty"`
	ResourceRestored       *ResourceRestoredEvent       `json:"resourceRestored,omitempty"`
	HitDieSpent            *HitDieSpentEvent            `json:"hitDieSpent,omitempty"`
	EncounterCreated       *EncounterCreatedEvent       `json:"encounterCreated,omitempty"`
	EncounterStarted       *EncounterStartedEvent       `json:"encounterStarted,omitempty"`
	InitiativeRolled       *InitiativeRolledEvent       `json:"initiativeRolled,omitempty"`
	TurnStarted            *TurnStartedEvent            `json:"turnStarted,omitempty"`
	TurnEnded              *TurnEndedEvent              `json:"turnEnded,omitempty"`
	RoundEnded             *RoundEndedEvent             `json:"roundEnded,omitempty"`
	EncounterEnded         *EncounterEndedEvent         `json:"encounterEnded,omitempty"`
	ChoiceRequired         *ChoiceRequiredEvent         `json:"choiceRequired,omitempty"`
	ChoiceResolved         *ChoiceResolvedEvent         `json:"choiceResolved,omitempty"`
	SpellCastDeclared      *SpellCastDeclaredEvent      `json:"spellCastDeclared,omitempty"`
	ConcentrationStarted   *ConcentrationStartedEvent   `json:"concentrationStarted,omitempty"`
	ConcentrationBroken    *ConcentrationBrokenEvent    `json:"concentrationBroken,omitempty"`
	ExhaustionChanged      *ExhaustionChangedEvent      `json:"exhaustionChanged,omitempty"`
	DeathSaveRolled        *DeathSaveRolledEvent        `json:"deathSaveRolled,omitempty"`
	Stabilized             *StabilizedEvent             `json:"stabilized,omitempty"`
	ShortRestStarted       *ShortRestStartedEvent       `json:"shortRestStarted,omitempty"`
	ShortRestEnded         *ShortRestEndedEvent         `json:"shortRestEnded,omitempty"`
	LongRestStarted        *LongRestStartedEvent        `json:"longRestStarted,omitempty"`
	LongRestEnded          *LongRestEndedEvent          `json:"longRestEnded,omitempty"`
	WorldClockAdvanced     *WorldClockAdvancedEvent     `json:"worldClockAdvanced,omitempty"`
	NPCActionResolved      *NPCActionResolvedEvent      `json:"npcActionResolved,omitempty"`
}

type DamageComponent struct {
	Type   types.DamageType `json:"type" validate:"required"`
	Dice   string           `json:"dice,omitempty"`
	Amount int              `json:"amount" validate:"required"`
}

type ClassEntry struct {
	ClassID types.ClassID `json:"classId" validate:"required"`
	Level   int           `json:"level" validate:"min=1,max=20"`
}

type CharacterCreatedEvent struct {
	CharacterID    types.CharacterID              `json:"characterId" validate:"required"`
	Name           string                         `json:"name" validate:"required"`
	SpeciesID      types.SpeciesID                `json:"speciesId" validate:"required"`
	SpeciesVariant string                         `json:"speciesVariant,omitempty"`
	BackgroundID   types.BackgroundID             `json:"backgroundId,omitempty"`
	Classes        []ClassEntry                   `json:"classes" validate:"required,min=1,dive"`
	Level          int                            `json:"level" validate:"min=1,max=20"`
	AbilityScores  types.AbilityScores            `json:"abilityScores" validate:"required"`
	MaxHP          int                            `json:"maxHP" validate:"min=1"`
	SavingThrows   []types.AbilityScore           `json:"savingThrows,omitempty"`
	Skills         map[types.Skill]types.ProficiencyLevel `json:"skills,omitempty"`
	Spells         []types.SpellID                `json:"spells,omitempty"`
	Feats          []types.FeatID                 `json:"feats,omitempty"`
	AbilityMethod  string                         `json:"abilityMethod,omitempty"`
}

type DamageAppliedEvent struct {
	TargetID       types.CharacterID  `json:"targetId" validate:"required"`
	SourceID       string             `json:"sourceId,omitempty"`
	Components     []DamageComponent  `json:"components" validate:"required,min=1"`
	Total          int                `json:"total" validate:"required"`
	IsCritical     bool               `json:"isCritical,omitempty"`
}

type HealedEvent struct {
	TargetID types.CharacterID `json:"targetId" validate:"required"`
	Amount   int               `json:"amount" validate:"min=1"`
}

type TempHPGrantedEvent struct {
	TargetID types.CharacterID `json:"targetId" validate:"required"`
	Amount   int               `json:"amount" validate:"min=1"`
}

type ConditionAppliedEvent struct {
	TargetID    types.CharacterID `json:"targetId" validate:"required"`
	ConditionID types.ConditionID `json:"conditionId" validate:"required"`
	Duration    *string           `json:"duration,omitempty"`
	DC          *int              `json:"dc,omitempty"`
}

type ConditionRemovedEvent struct {
	TargetID    types.CharacterID          `json:"targetId" validate:"required"`
	ConditionID types.ConditionID          `json:"conditionId" validate:"required"`
	Reason      string                     `json:"reason,omitempty"`
}

type AttackRolledEvent struct {
	AttackerID    types.CharacterID `json:"attackerId" validate:"required"`
	TargetID      types.CharacterID `json:"targetId" validate:"required"`
	WeaponID      string            `json:"weaponId,omitempty"`
	AttackBonus   int               `json:"attackBonus"`
	Roll          int               `json:"roll" validate:"min=1,max=20"`
	Total         int               `json:"total"`
	IsCrit        bool              `json:"isCrit,omitempty"`
	IsFumble      bool              `json:"isFumble,omitempty"`
	Hit           bool              `json:"hit"`
}

type DamageRolledEvent struct {
	AttackerID types.CharacterID  `json:"attackerId" validate:"required"`
	TargetID   types.CharacterID  `json:"targetId" validate:"required"`
	Components []DamageComponent  `json:"components" validate:"required,min=1"`
}

type SaveRolledEvent struct {
	CharacterID types.CharacterID    `json:"characterId" validate:"required"`
	Ability     types.AbilityScore   `json:"ability" validate:"required"`
	Roll        int                  `json:"roll" validate:"min=1,max=20"`
	Bonus       int                  `json:"bonus"`
	Total       int                  `json:"total"`
	DC          int                  `json:"dc"`
	Success     bool                 `json:"success"`
}

type AbilityCheckRolledEvent struct {
	CharacterID types.CharacterID  `json:"characterId" validate:"required"`
	Skill       types.Skill        `json:"skill,omitempty"`
	Ability     types.AbilityScore `json:"ability,omitempty"`
	Roll        int                `json:"roll" validate:"min=1,max=20"`
	Bonus       int                `json:"bonus"`
	Total       int                `json:"total"`
	DC          int                `json:"dc"`
	Success     bool               `json:"success"`
}

type LevelUpResolvedEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	ClassID     types.ClassID      `json:"classId" validate:"required"`
	NewLevel    int                `json:"newLevel" validate:"min=1,max=20"`
	HPGained    int                `json:"hpGained" validate:"min=1"`
	FeatChoice  *types.FeatID     `json:"featChoice,omitempty"`
}

type ItemAcquiredEvent struct {
	CharacterID  types.CharacterID    `json:"characterId" validate:"required"`
	ItemID       types.ItemDefinitionID `json:"itemId" validate:"required"`
	InstanceID   types.ItemInstanceID   `json:"instanceId"`
	Quantity     int                    `json:"quantity" validate:"min=1"`
}

type ItemEquippedEvent struct {
	CharacterID types.CharacterID  `json:"characterId" validate:"required"`
	InstanceID  types.ItemInstanceID `json:"instanceId" validate:"required"`
	Slot        string             `json:"slot" validate:"required"`
}

type ItemUnequippedEvent struct {
	CharacterID types.CharacterID  `json:"characterId" validate:"required"`
	InstanceID  types.ItemInstanceID `json:"instanceId" validate:"required"`
}

type ResourceSpentEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	ResourceID  string            `json:"resourceId" validate:"required"`
	Amount      int               `json:"amount" validate:"min=1"`
}

type ResourceRestoredEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	ResourceID  string            `json:"resourceId" validate:"required"`
	Amount      int               `json:"amount" validate:"min=1"`
}

type HitDieSpentEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	Die         types.HitDie       `json:"die" validate:"required"`
	Rolled      int                `json:"rolled" validate:"min=1"`
}

type EncounterCreatedEvent struct {
	EncounterID types.EncounterID `json:"encounterId" validate:"required"`
	Name        string            `json:"name" validate:"required"`
}

type EncounterStartedEvent struct {
	EncounterID types.EncounterID `json:"encounterId" validate:"required"`
}

type InitiativeRolledEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	Roll        int               `json:"roll" validate:"min=1,max=20"`
	DexBonus    int               `json:"dexBonus"`
	Total       int               `json:"total"`
}

type TurnStartedEvent struct {
	EncounterID types.EncounterID `json:"encounterId" validate:"required"`
	CombatantID types.CharacterID `json:"combatantId" validate:"required"`
}

type TurnEndedEvent struct {
	EncounterID types.EncounterID `json:"encounterId" validate:"required"`
	CombatantID types.CharacterID `json:"combatantId" validate:"required"`
}

type RoundEndedEvent struct {
	EncounterID types.EncounterID `json:"encounterId" validate:"required"`
	Round       int               `json:"round" validate:"min=1"`
}

type EncounterEndedEvent struct {
	EncounterID types.EncounterID `json:"encounterId" validate:"required"`
}

type ChoiceRequiredEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	Choices     []ChoiceOption    `json:"choices" validate:"required,min=1"`
}

type ChoiceOption struct {
	ID          string `json:"id" validate:"required"`
	Label       string `json:"label" validate:"required"`
	Description string `json:"description,omitempty"`
}

type ChoiceResolvedEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	ChoiceID    string            `json:"choiceId" validate:"required"`
	SelectedID  string            `json:"selectedId" validate:"required"`
}

type SpellCastDeclaredEvent struct {
	CasterID    types.CharacterID  `json:"casterId" validate:"required"`
	SpellID     types.SpellID      `json:"spellId" validate:"required"`
	SlotLevel   int                `json:"slotLevel" validate:"min=1,max=9"`
	TargetIDs   []types.CharacterID `json:"targetIds,omitempty"`
}

type ConcentrationStartedEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	SpellID     types.SpellID     `json:"spellId" validate:"required"`
}

type ConcentrationBrokenEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	SpellID     types.SpellID     `json:"spellId" validate:"required"`
	Reason      string            `json:"reason,omitempty"`
}

type ExhaustionChangedEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	OldLevel    int               `json:"oldLevel" validate:"min=0,max=6"`
	NewLevel    int               `json:"newLevel" validate:"min=0,max=6"`
}

type DeathSaveRolledEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	Roll        int               `json:"roll" validate:"min=1,max=20"`
	Successes   int               `json:"successes" validate:"min=0,max=3"`
	Failures    int               `json:"failures" validate:"min=0,max=3"`
}

type StabilizedEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
}

type ShortRestStartedEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
}

type ShortRestEndedEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	HitDiceUsed int               `json:"hitDiceUsed"`
	HPGained    int               `json:"hpGained"`
}

type LongRestStartedEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
}

type LongRestEndedEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	HPGained    int               `json:"hpGained"`
	ResourcesRestored bool        `json:"resourcesRestored"`
}

type WorldClockAdvancedEvent struct {
	From string `json:"from" validate:"required"`
	To   string `json:"to" validate:"required"`
}

type NPCActionResolvedEvent struct {
	NPCID    string `json:"npcId" validate:"required"`
	GoalID   string `json:"goalId" validate:"required"`
	Outcome  string `json:"outcome" validate:"required"`
}

var AllEventTypes = []EventType{
	EventCharacterCreated,
	EventDamageApplied,
	EventHealed,
	EventTempHPGranted,
	EventConditionApplied,
	EventConditionRemoved,
	EventAttackRolled,
	EventDamageRolled,
	EventSaveRolled,
	EventAbilityCheckRolled,
	EventShortRestStarted,
	EventShortRestEnded,
	EventLongRestStarted,
	EventLongRestEnded,
	EventLevelUpResolved,
	EventItemAcquired,
	EventItemEquipped,
	EventItemUnequipped,
	EventResourceSpent,
	EventResourceRestored,
	EventHitDieSpent,
	EventEncounterCreated,
	EventEncounterStarted,
	EventInitiativeRolled,
	EventTurnStarted,
	EventTurnEnded,
	EventRoundEnded,
	EventEncounterEnded,
	EventChoiceRequired,
	EventChoiceResolved,
	EventSpellCastDeclared,
	EventConcentrationStarted,
	EventConcentrationBroken,
	EventExhaustionChanged,
	EventDeathSaveRolled,
	EventStabilized,
	EventWorldClockAdvanced,
	EventNPCActionResolved,
	EventCustom,
}
