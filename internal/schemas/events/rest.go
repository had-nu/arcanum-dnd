package events

import (
	"github.com/hadnu/arcanum/internal/types"
)

// ShortRestStartedEvent represents a short rest starting.
type ShortRestStartedEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
}

func (e ShortRestStartedEvent) EventType() EventType { return EventShortRestStarted }
func (e ShortRestStartedEvent) SchemaVersion() int   { return 1 }
func (e ShortRestStartedEvent) Validate() error { return nil }

// ShortRestEndedEvent represents a short rest ending.
type ShortRestEndedEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	HitDiceUsed int               `json:"hitDiceUsed"`
	HPGained    int               `json:"hpGained"`
}

func (e ShortRestEndedEvent) EventType() EventType { return EventShortRestEnded }
func (e ShortRestEndedEvent) SchemaVersion() int   { return 1 }
func (e ShortRestEndedEvent) Validate() error { return nil }

// LongRestStartedEvent represents a long rest starting.
type LongRestStartedEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
}

func (e LongRestStartedEvent) EventType() EventType { return EventLongRestStarted }
func (e LongRestStartedEvent) SchemaVersion() int   { return 1 }
func (e LongRestStartedEvent) Validate() error { return nil }

// LongRestEndedEvent represents a long rest ending.
type LongRestEndedEvent struct {
	CharacterID        types.CharacterID `json:"characterId" validate:"required"`
	HPGained           int               `json:"hpGained"`
	ResourcesRestored  bool              `json:"resourcesRestored"`
}

func (e LongRestEndedEvent) EventType() EventType { return EventLongRestEnded }
func (e LongRestEndedEvent) SchemaVersion() int   { return 1 }
func (e LongRestEndedEvent) Validate() error { return nil }

func init() {
	RegisterEvent(EventShortRestStarted, 1, func() Event { return &ShortRestStartedEvent{} })
	RegisterEvent(EventShortRestEnded, 1, func() Event { return &ShortRestEndedEvent{} })
	RegisterEvent(EventLongRestStarted, 1, func() Event { return &LongRestStartedEvent{} })
	RegisterEvent(EventLongRestEnded, 1, func() Event { return &LongRestEndedEvent{} })
}