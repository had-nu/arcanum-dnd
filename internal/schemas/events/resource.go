package events

import (
	"errors"

	"github.com/hadnu/arcanum/internal/types"
)

// ResourceSpentEvent represents a resource being spent.
type ResourceSpentEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	ResourceID  string            `json:"resourceId" validate:"required"`
	Amount      int               `json:"amount" validate:"min=1"`
}

func (e ResourceSpentEvent) EventType() EventType { return EventResourceSpent }
func (e ResourceSpentEvent) SchemaVersion() int   { return 1 }
func (e ResourceSpentEvent) Validate() error {
	if e.ResourceID == "" { return errors.New("resourceId required") }
	if e.Amount < 1 { return errors.New("amount must be >= 1") }
	return nil
}

// ResourceRestoredEvent represents a resource being restored.
type ResourceRestoredEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	ResourceID  string            `json:"resourceId" validate:"required"`
	Amount      int               `json:"amount" validate:"min=1"`
}

func (e ResourceRestoredEvent) EventType() EventType { return EventResourceRestored }
func (e ResourceRestoredEvent) SchemaVersion() int   { return 1 }
func (e ResourceRestoredEvent) Validate() error {
	if e.ResourceID == "" { return errors.New("resourceId required") }
	if e.Amount < 1 { return errors.New("amount must be >= 1") }
	return nil
}

// HitDieSpentEvent represents a hit die being spent.
type HitDieSpentEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	Die         types.HitDie      `json:"die" validate:"required"`
	Rolled      int               `json:"rolled" validate:"min=1"`
}

func (e HitDieSpentEvent) EventType() EventType { return EventHitDieSpent }
func (e HitDieSpentEvent) SchemaVersion() int   { return 1 }
func (e HitDieSpentEvent) Validate() error {
	if e.Rolled < 1 { return errors.New("rolled must be >= 1") }
	return nil
}

func init() {
	RegisterEvent(EventResourceSpent, 1, func() Event { return &ResourceSpentEvent{} })
	RegisterEvent(EventResourceRestored, 1, func() Event { return &ResourceRestoredEvent{} })
	RegisterEvent(EventHitDieSpent, 1, func() Event { return &HitDieSpentEvent{} })
}