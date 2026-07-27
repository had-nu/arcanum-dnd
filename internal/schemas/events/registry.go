package events

import (
	"encoding/json"
	"fmt"
	"sync"
)

// registry maps EventType -> SchemaVersion -> constructor function
var (
	registry   = make(map[EventType]map[int]func() Event)
	registryMu sync.RWMutex
)

// RegisterEvent registers an event constructor for a given type and schema version.
// This should be called in init() functions of event definition files.
func RegisterEvent(eventType EventType, schemaVersion int, constructor func() Event) {
	registryMu.Lock()
	defer registryMu.Unlock()

	if registry[eventType] == nil {
		registry[eventType] = make(map[int]func() Event)
	}
	if _, exists := registry[eventType][schemaVersion]; exists {
		panic(fmt.Sprintf("event %s version %d already registered", eventType, schemaVersion))
	}
	registry[eventType][schemaVersion] = constructor
}

// GetConstructor returns the constructor for an event type and version.
func GetConstructor(eventType EventType, schemaVersion int) (func() Event, bool) {
	registryMu.RLock()
	defer registryMu.RUnlock()

	versions, ok := registry[eventType]
	if !ok {
		return nil, false
	}
	constructor, ok := versions[schemaVersion]
	return constructor, ok
}

// MarshalEvent serializes an Event into an EventEnvelope.
func MarshalEvent(evt Event, envelope EventEnvelope) (EventEnvelope, error) {
	payload, err := json.Marshal(evt)
	if err != nil {
		return EventEnvelope{}, fmt.Errorf("marshal payload: %w", err)
	}
	envelope.Type = evt.EventType()
	envelope.SchemaVersion = evt.SchemaVersion()
	envelope.Payload = payload
	return envelope, nil
}

// UnmarshalPayload deserializes an EventEnvelope's payload into the correct Event type.
func UnmarshalPayload(env EventEnvelope) (Event, error) {
	constructor, ok := GetConstructor(env.Type, env.SchemaVersion)
	if !ok {
		return nil, fmt.Errorf("unknown event type %s version %d", env.Type, env.SchemaVersion)
	}

	evt := constructor()
	if err := json.Unmarshal(env.Payload, evt); err != nil {
		return nil, fmt.Errorf("unmarshal payload for %s v%d: %w", env.Type, env.SchemaVersion, err)
	}
	return evt, nil
}

// MustMarshalEvent is like MarshalEvent but panics on error (for tests).
func MustMarshalEvent(evt Event, envelope EventEnvelope) EventEnvelope {
	env, err := MarshalEvent(evt, envelope)
	if err != nil {
		panic(err)
	}
	return env
}

// MustUnmarshalPayload is like UnmarshalPayload but panics on error (for tests).
func MustUnmarshalPayload(env EventEnvelope) Event {
	evt, err := UnmarshalPayload(env)
	if err != nil {
		panic(err)
	}
	return evt
}