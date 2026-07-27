package events

import (
	"errors"

	"github.com/hadnu/arcanum/internal/types"
)

// ChoiceOption represents a single choice option.
type ChoiceOption struct {
	ID          string `json:"id" validate:"required"`
	Label       string `json:"label" validate:"required"`
	Description string `json:"description,omitempty"`
}

// ChoiceRequiredEvent represents a choice being required from a player.
type ChoiceRequiredEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	Choices     []ChoiceOption    `json:"choices" validate:"required,min=1"`
}

func (e ChoiceRequiredEvent) EventType() EventType { return EventChoiceRequired }
func (e ChoiceRequiredEvent) SchemaVersion() int   { return 1 }
func (e ChoiceRequiredEvent) Validate() error {
	if len(e.Choices) == 0 { return errors.New("choices required") }
	return nil
}

// ChoiceResolvedEvent represents a choice being resolved.
type ChoiceResolvedEvent struct {
	CharacterID types.CharacterID `json:"characterId" validate:"required"`
	ChoiceID    string            `json:"choiceId" validate:"required"`
	SelectedID  string            `json:"selectedId" validate:"required"`
}

func (e ChoiceResolvedEvent) EventType() EventType { return EventChoiceResolved }
func (e ChoiceResolvedEvent) SchemaVersion() int   { return 1 }
func (e ChoiceResolvedEvent) Validate() error {
	if e.ChoiceID == "" { return errors.New("choiceId required") }
	if e.SelectedID == "" { return errors.New("selectedId required") }
	return nil
}

func init() {
	RegisterEvent(EventChoiceRequired, 1, func() Event { return &ChoiceRequiredEvent{} })
	RegisterEvent(EventChoiceResolved, 1, func() Event { return &ChoiceResolvedEvent{} })
}