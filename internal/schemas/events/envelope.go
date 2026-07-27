package events

import (
	"encoding/json"
	"time"

	"github.com/hadnu/arcanum/internal/types"
)

// AggregateType represents the type of aggregate that owns the event.
type AggregateType string

const (
	AggregateCampaign  AggregateType = "campaign"
	AggregateCharacter AggregateType = "character"
	AggregateEncounter AggregateType = "encounter"
)

// EventType is a discriminated union tag for event payloads.
type EventType string

const (
	// Character events
	EventCharacterCreated   EventType = "CharacterCreated"
	EventCharacterLeveledUp EventType = "CharacterLeveledUp"
	EventFeatTaken          EventType = "FeatTaken"
	EventSubclassChosen     EventType = "SubclassChosen"

	// Combat events
	EventDamageApplied    EventType = "DamageApplied"
	EventHealed           EventType = "Healed"
	EventTempHPGranted    EventType = "TempHPGranted"
	EventConditionApplied EventType = "ConditionApplied"
	EventConditionRemoved EventType = "ConditionRemoved"
	EventAttackRolled     EventType = "AttackRolled"
	EventDamageRolled     EventType = "DamageRolled"
	EventSaveRolled       EventType = "SaveRolled"
	EventAbilityCheckRolled EventType = "AbilityCheckRolled"
	EventDeathSaveRolled  EventType = "DeathSaveRolled"
	EventStabilized       EventType = "Stabilized"
	EventExhaustionChanged EventType = "ExhaustionChanged"

	// Spell events
	EventSpellCastDeclared    EventType = "SpellCastDeclared"
	EventSpellSlotUsed        EventType = "SpellSlotUsed"
	EventConcentrationStarted EventType = "ConcentrationStarted"
	EventConcentrationBroken  EventType = "ConcentrationBroken"

	// Rest events
	EventShortRestStarted EventType = "ShortRestStarted"
	EventShortRestEnded   EventType = "ShortRestEnded"
	EventLongRestStarted  EventType = "LongRestStarted"
	EventLongRestEnded    EventType = "LongRestEnded"
	EventHitDieSpent      EventType = "HitDieSpent"

	// Encounter events
	EventEncounterCreated EventType = "EncounterCreated"
	EventEncounterStarted EventType = "EncounterStarted"
	EventInitiativeRolled EventType = "InitiativeRolled"
	EventTurnStarted      EventType = "TurnStarted"
	EventTurnEnded        EventType = "TurnEnded"
	EventRoundEnded       EventType = "RoundEnded"
	EventEncounterEnded   EventType = "EncounterEnded"

	// Choice events
	EventChoiceRequired EventType = "ChoiceRequired"
	EventChoiceResolved EventType = "ChoiceResolved"

	// Resource events
	EventResourceSpent   EventType = "ResourceSpent"
	EventResourceRestored EventType = "ResourceRestored"

	// Item events
	EventItemAcquired  EventType = "ItemAcquired"
	EventItemEquipped  EventType = "ItemEquipped"
	EventItemUnequipped EventType = "ItemUnequipped"

	// World events
	EventWorldClockAdvanced EventType = "WorldClockAdvanced"
	EventNPCActionResolved  EventType = "NPCActionResolved"
	EventCustom             EventType = "Custom"
)

// Event is the interface that all event payloads must implement.
type Event interface {
	EventType() EventType
	SchemaVersion() int
	Validate() error
}

// EventEnvelope is the universal wrapper for all events in the event store.
type EventEnvelope struct {
	ID              types.EventID `json:"id" validate:"required"`
	Type            EventType     `json:"type" validate:"required"`
	SchemaVersion   int           `json:"schemaVersion" validate:"required"`
	AggregateID     string        `json:"aggregateId" validate:"required"`
	AggregateType   AggregateType `json:"aggregateType" validate:"required"`
	Version         int           `json:"version" validate:"required,min=1"`
	OccurredAt      time.Time     `json:"occurredAt" validate:"required"`

	// Causality
	SessionID       *types.EventID `json:"sessionId,omitempty"`
	CausedByEventID *types.EventID `json:"causedByEventId,omitempty"`
	ActorID         *string        `json:"actorId,omitempty"`

	// Metadata
	Metadata Metadata `json:"metadata,omitempty"`

	// Serialized payload
	Payload json.RawMessage `json:"payload" validate:"required"`
}

// Metadata holds optional additional data for the event.
type Metadata map[string]any