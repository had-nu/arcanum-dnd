package engine

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	contentpack "github.com/hadnu/arcanum/internal/content"
	"github.com/hadnu/arcanum/internal/database"
	"github.com/hadnu/arcanum/internal/rng"
	scontent "github.com/hadnu/arcanum/internal/schemas/content"
	"github.com/hadnu/arcanum/internal/schemas/events"
	"github.com/hadnu/arcanum/internal/schemas/runtime"
	"github.com/hadnu/arcanum/internal/types"
)

type Campaign struct {
	ID            types.CampaignID
	Name          string
	State         runtime.CampaignState
	Version       int
	SchemaVersion int
}

type PlanResult struct {
	Events []events.Event
}

type Engine struct {
	content       scontent.ResolvedContent
	rng           *rng.DefaultRNG
	eventStore    database.EventStore
	snapshotStore database.SnapshotStore
	Plan          *Planner
	Derive        *Deriver
	Apply         *Applier
}

type Planner struct {
	engine *Engine
}

type Deriver struct {
	engine *Engine
}

func NewEngine(content scontent.ResolvedContent, r *rng.DefaultRNG, eventStore database.EventStore, snapshotStore database.SnapshotStore) *Engine {
	e := &Engine{
		content:       content,
		rng:           r,
		eventStore:    eventStore,
		snapshotStore: snapshotStore,
	}
	e.Plan = &Planner{engine: e}
	e.Derive = &Deriver{engine: e}
	e.Apply = &Applier{content: content}
	return e
}

func (e *Engine) CreateCampaign(ctx context.Context, name string) (Campaign, error) {
	state := runtime.NewCampaignState()
	state.Settings = runtime.CampaignSettings{}
	campaign := Campaign{
		ID:            types.NewCampaignID(),
		Name:          name,
		State:         state,
		Version:       0,
		SchemaVersion: 1,
	}

	// Initialize campaign with a CampaignCreated event if needed
	// For now, just persist empty state
	if e.eventStore != nil {
		if err := e.saveSnapshot(ctx, campaign); err != nil {
			return Campaign{}, err
		}
	}

	return campaign, nil
}

func (e *Engine) Commit(ctx context.Context, campaign Campaign, evts []events.Event) (Campaign, error) {
	if len(evts) == 0 {
		return campaign, nil
	}

	// 1. Validate all events
	for _, evt := range evts {
		if err := evt.Validate(); err != nil {
			return Campaign{}, fmt.Errorf("validation failed for %s: %w", evt.EventType(), err)
		}
	}

	// 2. Build envelopes
	envelopes := make([]events.EventEnvelope, len(evts))
	now := time.Now()
	for i, evt := range evts {
		env := events.EventEnvelope{
			ID:            types.NewEventID(),
			AggregateID:   campaign.ID.String(),
			AggregateType: events.AggregateCampaign,
			Version:       campaign.Version + i + 1,
			OccurredAt:    now,
		}
		env, err := events.MarshalEvent(evt, env)
		if err != nil {
			return Campaign{}, fmt.Errorf("marshal event: %w", err)
		}
		envelopes[i] = env
	}

	// 3. Persist to event store
	if e.eventStore != nil {
		if err := e.eventStore.Append(ctx, campaign.ID.String(), campaign.Version, envelopes); err != nil {
			return Campaign{}, fmt.Errorf("event store append: %w", err)
		}
	}

	// 4. Apply to state
	newState := campaign.State
	for _, evt := range evts {
		newState = e.Apply.Apply(newState, evt)
	}

	newCampaign := Campaign{
		ID:            campaign.ID,
		Name:          campaign.Name,
		State:         newState,
		Version:       campaign.Version + len(evts),
		SchemaVersion: campaign.SchemaVersion,
	}

	// 5. Snapshot every N events
	if newCampaign.Version%50 == 0 {
		if e.snapshotStore != nil {
			_ = e.snapshotStore.Save(ctx, campaign.ID.String(), newCampaign.Version, newCampaign.State)
		}
	}

	return newCampaign, nil
}

func (e *Engine) saveSnapshot(ctx context.Context, campaign Campaign) error {
	if e.snapshotStore != nil {
		return e.snapshotStore.Save(ctx, campaign.ID.String(), campaign.Version, campaign.State)
	}
	return nil
}

func (e *Engine) LoadCampaign(ctx context.Context, campaignID types.CampaignID) (Campaign, error) {
	var state runtime.CampaignState
	version := 0

	// 1. Try to load latest snapshot
	if e.snapshotStore != nil {
		snap, snapVersion, err := e.snapshotStore.Load(ctx, campaignID.String())
		if err == nil && snap != nil {
			if s, ok := snap.(runtime.CampaignState); ok {
				state = s
				version = snapVersion
			}
		}
	}

	// 2. Replay events after snapshot
	fromVersion := version + 1
	if version == 0 {
		fromVersion = 1
	}

	if e.eventStore != nil {
		evts, err := e.eventStore.GetEvents(ctx, campaignID.String(), fromVersion)
		if err != nil {
			return Campaign{}, err
		}

		for _, env := range evts {
			evt, err := events.UnmarshalPayload(env)
			if err != nil {
				return Campaign{}, fmt.Errorf("unmarshal event: %w", err)
			}
			state = e.Apply.Apply(state, evt)
			version = env.Version
		}
	}

	// 3. If still no state, create new
	if version == 0 && len(state.Characters) == 0 {
		state = runtime.NewCampaignState()
		state.Settings = runtime.CampaignSettings{}
	}

	return Campaign{
		ID:            campaignID,
		Name:          "Loaded Campaign", // would need to store name
		State:         state,
		Version:       version,
		SchemaVersion: 1,
	}, nil
}

func (e *Engine) Replay(ctx context.Context, aggregateID string, fromVersion int) (runtime.CampaignState, error) {
	state := runtime.NewCampaignState()

	if e.eventStore != nil {
		evts, err := e.eventStore.GetEvents(ctx, aggregateID, fromVersion)
		if err != nil {
			return state, err
		}

		for _, env := range evts {
			evt, err := events.UnmarshalPayload(env)
			if err != nil {
				return state, fmt.Errorf("unmarshal event: %w", err)
			}
			state = e.Apply.Apply(state, evt)
		}
	}

	return state, nil
}

// ExportCampaign serializes campaign state for backup/debug
func (e *Engine) ExportCampaign(campaign Campaign) ([]byte, error) {
	data := map[string]interface{}{
		"id":             campaign.ID.String(),
		"name":           campaign.Name,
		"version":        campaign.Version,
		"schema_version": campaign.SchemaVersion,
		"state":          campaign.State,
	}
	return json.MarshalIndent(data, "", "  ")
}

var _ = contentpack.LoadContentPack