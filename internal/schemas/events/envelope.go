package events

import "github.com/hadnu/arcanum/internal/types"

type EventEnvelope struct {
	ID             types.EventID `json:"id" validate:"required"`
	At             string        `json:"at" validate:"required"`
	SessionID      *types.EventID `json:"sessionId,omitempty"`
	CausedByEventID *types.EventID `json:"causedByEventId,omitempty"`
	ActorID        *string        `json:"actorId,omitempty"`
}
