package events

import (
	"errors"

	"github.com/hadnu/arcanum/internal/types"
)

// SpellCastDeclaredEvent represents a spell being declared for casting.
type SpellCastDeclaredEvent struct {
	CasterID   types.CharacterID    `json:"casterId" validate:"required"`
	SpellID    types.SpellID        `json:"spellId" validate:"required"`
	SlotLevel  int                  `json:"slotLevel" validate:"min=1,max=9"`
	TargetIDs  []types.CharacterID  `json:"targetIds,omitempty"`
}

func (e SpellCastDeclaredEvent) EventType() EventType { return EventSpellCastDeclared }
func (e SpellCastDeclaredEvent) SchemaVersion() int   { return 1 }
func (e SpellCastDeclaredEvent) Validate() error {
	if e.SlotLevel < 1 || e.SlotLevel > 9 { return errors.New("slotLevel must be 1-9") }
	return nil
}

// SpellSlotUsedEvent represents a spell slot being used.
type SpellSlotUsedEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	SlotLevel   int               `json:"slotLevel" validate:"min=1,max=9"`
	SpellID     types.SpellID     `json:"spellId,omitempty"`
}

func (e SpellSlotUsedEvent) EventType() EventType { return EventSpellSlotUsed }
func (e SpellSlotUsedEvent) SchemaVersion() int   { return 1 }
func (e SpellSlotUsedEvent) Validate() error {
	if e.SlotLevel < 1 || e.SlotLevel > 9 { return errors.New("slotLevel must be 1-9") }
	return nil
}

// ConcentrationStartedEvent represents concentration starting on a spell.
type ConcentrationStartedEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	SpellID     types.SpellID     `json:"spellId" validate:"required"`
}

func (e ConcentrationStartedEvent) EventType() EventType { return EventConcentrationStarted }
func (e ConcentrationStartedEvent) SchemaVersion() int   { return 1 }
func (e ConcentrationStartedEvent) Validate() error { return nil }

// ConcentrationBrokenEvent represents concentration being broken.
type ConcentrationBrokenEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	SpellID     types.SpellID     `json:"spellId" validate:"required"`
	Reason      string            `json:"reason,omitempty"`
}

func (e ConcentrationBrokenEvent) EventType() EventType { return EventConcentrationBroken }
func (e ConcentrationBrokenEvent) SchemaVersion() int   { return 1 }
func (e ConcentrationBrokenEvent) Validate() error { return nil }

func init() {
	RegisterEvent(EventSpellCastDeclared, 1, func() Event { return &SpellCastDeclaredEvent{} })
	RegisterEvent(EventSpellSlotUsed, 1, func() Event { return &SpellSlotUsedEvent{} })
	RegisterEvent(EventConcentrationStarted, 1, func() Event { return &ConcentrationStartedEvent{} })
	RegisterEvent(EventConcentrationBroken, 1, func() Event { return &ConcentrationBrokenEvent{} })
}