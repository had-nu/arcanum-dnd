package runtime

import "github.com/hadnu/arcanum/internal/types"

type Party struct {
	ID           types.PartyID       `json:"id" validate:"required"`
	Name         string              `json:"name" validate:"required"`
	CharacterIDs []types.CharacterID `json:"characterIds,omitempty"`
	Currency     Currency             `json:"currency,omitempty"`
}

type Currency struct {
	Copper   int `json:"copper"`
	Silver   int `json:"silver"`
	Electrum int `json:"electrum"`
	Gold     int `json:"gold"`
	Platinum int `json:"platinum"`
}

type QuestObjective struct {
	ID          string `json:"id" validate:"required"`
	Description string `json:"description" validate:"required"`
	Completed   bool   `json:"completed"`
}

type Quest struct {
	ID          string           `json:"id" validate:"required"`
	Name        string           `json:"name" validate:"required"`
	Objectives  []QuestObjective `json:"objectives,omitempty"`
	Status      string           `json:"status"`
}

type WorldState struct {
	CurrentTime string `json:"currentTime"`
	LocationID  string `json:"locationId,omitempty"`
}

type CampaignSettings struct {
	UseHeroPoints bool `json:"useHeroPoints" yaml:"useHeroPoints"`
	GrittyRest    bool `json:"grittyRest" yaml:"grittyRest"`
}

type CampaignState struct {
	Characters map[types.CharacterID]*Character `json:"characters"`
	Parties    map[types.PartyID]*Party         `json:"parties,omitempty"`
	Encounters map[types.EncounterID]*Encounter `json:"encounters,omitempty"`
	Quests     map[string]*Quest                `json:"quests,omitempty"`
	World      WorldState                        `json:"world,omitempty"`
	Settings   CampaignSettings                  `json:"settings"`
}

func NewCampaignState() CampaignState {
	return CampaignState{
		Characters: make(map[types.CharacterID]*Character),
		Parties:    make(map[types.PartyID]*Party),
		Encounters: make(map[types.EncounterID]*Encounter),
		Quests:     make(map[string]*Quest),
	}
}
