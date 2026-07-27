package events

import (
	"errors"

	"github.com/hadnu/arcanum/internal/types"
)

// ItemAcquiredEvent represents an item being acquired.
type ItemAcquiredEvent struct {
	CharacterID  types.CharacterID      `json:"characterId" validate:"required"`
	ItemID       types.ItemDefinitionID `json:"itemId" validate:"required"`
	InstanceID   types.ItemInstanceID   `json:"instanceId"`
	Quantity     int                    `json:"quantity" validate:"min=1"`
}

func (e ItemAcquiredEvent) EventType() EventType { return EventItemAcquired }
func (e ItemAcquiredEvent) SchemaVersion() int   { return 1 }
func (e ItemAcquiredEvent) Validate() error {
	if e.Quantity < 1 { return errors.New("quantity must be >= 1") }
	return nil
}

// ItemEquippedEvent represents an item being equipped.
type ItemEquippedEvent struct {
	CharacterID types.CharacterID  `json:"characterId" validate:"required"`
	InstanceID  types.ItemInstanceID `json:"instanceId" validate:"required"`
	Slot        string             `json:"slot" validate:"required"`
}

func (e ItemEquippedEvent) EventType() EventType { return EventItemEquipped }
func (e ItemEquippedEvent) SchemaVersion() int   { return 1 }
func (e ItemEquippedEvent) Validate() error {
	if e.Slot == "" { return errors.New("slot required") }
	return nil
}

// ItemUnequippedEvent represents an item being unequipped.
type ItemUnequippedEvent struct {
	CharacterID types.CharacterID  `json:"characterId" validate:"required"`
	InstanceID  types.ItemInstanceID `json:"instanceId" validate:"required"`
}

func (e ItemUnequippedEvent) EventType() EventType { return EventItemUnequipped }
func (e ItemUnequippedEvent) SchemaVersion() int   { return 1 }
func (e ItemUnequippedEvent) Validate() error { return nil }

func init() {
	RegisterEvent(EventItemAcquired, 1, func() Event { return &ItemAcquiredEvent{} })
	RegisterEvent(EventItemEquipped, 1, func() Event { return &ItemEquippedEvent{} })
	RegisterEvent(EventItemUnequipped, 1, func() Event { return &ItemUnequippedEvent{} })
}