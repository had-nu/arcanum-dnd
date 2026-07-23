package engine

import (
	contentpack "github.com/hadnu/arcanum/internal/content"
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
	Events        []events.Event
	Cursor        int
	SchemaVersion int
}

type PlanResult struct {
	Events []events.Event
}

type Engine struct {
	content scontent.ResolvedContent
	rng     rng.RNG
	Plan    *Planner
	Derive  *Deriver
	Apply   *Applier
}

type Planner struct {
	engine *Engine
}

type Deriver struct {
	engine *Engine
}

type Applier struct{}

func NewEngine(content scontent.ResolvedContent, r rng.RNG) *Engine {
	e := &Engine{
		content: content,
		rng:     r,
	}
	e.Plan = &Planner{engine: e}
	e.Derive = &Deriver{engine: e}
	e.Apply = &Applier{}
	return e
}

func (e *Engine) CreateCampaign(name string) Campaign {
	state := runtime.NewCampaignState()
	state.Settings = runtime.CampaignSettings{}
	return Campaign{
		ID:            types.NewCampaignID(),
		Name:          name,
		State:         state,
		Events:        make([]events.Event, 0),
		Cursor:        0,
		SchemaVersion: 1,
	}
}

func (e *Engine) Commit(campaign Campaign, evts []events.Event) Campaign {
	nextState := campaign.State
	for _, evt := range evts {
		nextState = e.Apply.Apply(nextState, evt)
	}
	before := campaign.Events[:campaign.Cursor]
	nextEvents := append(before, evts...)
	return Campaign{
		ID:            campaign.ID,
		Name:          campaign.Name,
		State:         nextState,
		Events:        nextEvents,
		Cursor:        len(nextEvents),
		SchemaVersion: campaign.SchemaVersion,
	}
}

func (e *Engine) Replay(evts []events.Event) runtime.CampaignState {
	state := runtime.NewCampaignState()
	for _, evt := range evts {
		state = e.Apply.Apply(state, evt)
	}
	return state
}

var _ = contentpack.LoadContentPack
