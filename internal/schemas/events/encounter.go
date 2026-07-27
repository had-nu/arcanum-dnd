package events

import (
	"errors"

	"github.com/hadnu/arcanum/internal/types"
)

// EncounterCreatedEvent represents an encounter being created.
type EncounterCreatedEvent struct {
	EncounterID types.EncounterID `json:"encounterId" validate:"required"`
	Name        string            `json:"name" validate:"required"`
}

func (e EncounterCreatedEvent) EventType() EventType { return EventEncounterCreated }
func (e EncounterCreatedEvent) SchemaVersion() int   { return 1 }
func (e EncounterCreatedEvent) Validate() error {
	if e.Name == "" { return errors.New("name is required") }
	return nil
}

// EncounterStartedEvent represents an encounter starting.
type EncounterStartedEvent struct {
	EncounterID types.EncounterID `json:"encounterId" validate:"required"`
}

func (e EncounterStartedEvent) EventType() EventType { return EventEncounterStarted }
func (e EncounterStartedEvent) SchemaVersion() int   { return 1 }
func (e EncounterStartedEvent) Validate() error { return nil }

// InitiativeRolledEvent represents initiative being rolled.
type InitiativeRolledEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	Roll        int               `json:"roll" validate:"min=1,max=20"`
	DexBonus    int               `json:"dexBonus"`
	Total       int               `json:"total"`
}

func (e InitiativeRolledEvent) EventType() EventType { return EventInitiativeRolled }
func (e InitiativeRolledEvent) SchemaVersion() int   { return 1 }
func (e InitiativeRolledEvent) Validate() error {
	if e.Roll < 1 || e.Roll > 20 { return errors.New("roll must be 1-20") }
	return nil
}

// TurnStartedEvent represents a turn starting.
type TurnStartedEvent struct {
	EncounterID types.EncounterID `json:"encounterId" validate:"required"`
	CombatantID types.CharacterID `json:"combatantId" validate:"required"`
}

func (e TurnStartedEvent) EventType() EventType { return EventTurnStarted }
func (e TurnStartedEvent) SchemaVersion() int   { return 1 }
func (e TurnStartedEvent) Validate() error { return nil }

// TurnEndedEvent represents a turn ending.
type TurnEndedEvent struct {
	EncounterID types.EncounterID `json:"encounterId" validate:"required"`
	CombatantID types.CharacterID `json:"combatantId" validate:"required"`
}

func (e TurnEndedEvent) EventType() EventType { return EventTurnEnded }
func (e TurnEndedEvent) SchemaVersion() int   { return 1 }
func (e TurnEndedEvent) Validate() error { return nil }

// RoundEndedEvent represents a round ending.
type RoundEndedEvent struct {
	EncounterID types.EncounterID `json:"encounterId" validate:"required"`
	Round       int               `json:"round" validate:"min=1"`
}

func (e RoundEndedEvent) EventType() EventType { return EventRoundEnded }
func (e RoundEndedEvent) SchemaVersion() int   { return 1 }
func (e RoundEndedEvent) Validate() error {
	if e.Round < 1 { return errors.New("round must be >= 1") }
	return nil
}

// EncounterEndedEvent represents an encounter ending.
type EncounterEndedEvent struct {
	EncounterID types.EncounterID `json:"encounterId" validate:"required"`
}

func (e EncounterEndedEvent) EventType() EventType { return EventEncounterEnded }
func (e EncounterEndedEvent) SchemaVersion() int   { return 1 }
func (e EncounterEndedEvent) Validate() error { return nil }

func init() {
	RegisterEvent(EventEncounterCreated, 1, func() Event { return &EncounterCreatedEvent{} })
	RegisterEvent(EventEncounterStarted, 1, func() Event { return &EncounterStartedEvent{} })
	RegisterEvent(EventInitiativeRolled, 1, func() Event { return &InitiativeRolledEvent{} })
	RegisterEvent(EventTurnStarted, 1, func() Event { return &TurnStartedEvent{} })
	RegisterEvent(EventTurnEnded, 1, func() Event { return &TurnEndedEvent{} })
	RegisterEvent(EventRoundEnded, 1, func() Event { return &RoundEndedEvent{} })
	RegisterEvent(EventEncounterEnded, 1, func() Event { return &EncounterEndedEvent{} })
}