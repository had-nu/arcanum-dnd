package types

import (
	"fmt"
	"io"
	"math/rand"
	"time"

	"github.com/oklog/ulid/v2"
)

var defaultEntropy = ulid.Monotonic(rand.New(rand.NewSource(time.Now().UnixNano())), 0)

type CharacterID struct{ ulid.ULID }

func NewCharacterID() CharacterID {
	return CharacterID{ulid.MustNew(ulid.Timestamp(time.Now()), defaultEntropy)}
}

func ParseCharacterID(s string) (CharacterID, error) {
	u, err := ulid.Parse(s)
	if err != nil {
		return CharacterID{}, fmt.Errorf("parse character id: %w", err)
	}
	return CharacterID{u}, nil
}

func (id CharacterID) String() string { return id.ULID.String() }

type CreatureID struct{ ulid.ULID }

func NewCreatureID() CreatureID {
	return CreatureID{ulid.MustNew(ulid.Timestamp(time.Now()), defaultEntropy)}
}

func (id CreatureID) String() string { return id.ULID.String() }

type ItemInstanceID struct{ ulid.ULID }

func NewItemInstanceID() ItemInstanceID {
	return ItemInstanceID{ulid.MustNew(ulid.Timestamp(time.Now()), defaultEntropy)}
}

func (id ItemInstanceID) String() string { return id.ULID.String() }

type EventID struct{ ulid.ULID }

func NewEventID() EventID {
	return EventID{ulid.MustNew(ulid.Timestamp(time.Now()), defaultEntropy)}
}

func (id EventID) String() string { return id.ULID.String() }

type CampaignID struct{ ulid.ULID }

func NewCampaignID() CampaignID {
	return CampaignID{ulid.MustNew(ulid.Timestamp(time.Now()), defaultEntropy)}
}

func (id CampaignID) String() string { return id.ULID.String() }

type EncounterID struct{ ulid.ULID }

func NewEncounterID() EncounterID {
	return EncounterID{ulid.MustNew(ulid.Timestamp(time.Now()), defaultEntropy)}
}

func (id EncounterID) String() string { return id.ULID.String() }

type PartyID struct{ ulid.ULID }

func NewPartyID() PartyID {
	return PartyID{ulid.MustNew(ulid.Timestamp(time.Now()), defaultEntropy)}
}

func (id PartyID) String() string { return id.ULID.String() }

type SpellID string

func (id SpellID) String() string { return string(id) }

type SpeciesID string

func (id SpeciesID) String() string { return string(id) }

type BackgroundID string

func (id BackgroundID) String() string { return string(id) }

type ClassID string

func (id ClassID) String() string { return string(id) }

type ConditionID string

func (id ConditionID) String() string { return string(id) }

type MonsterStatblockID string

func (id MonsterStatblockID) String() string { return string(id) }

type ItemDefinitionID string

func (id ItemDefinitionID) String() string { return string(id) }

type FeatID string

func (id FeatID) String() string { return string(id) }

type SubClassID string

func (id SubClassID) String() string { return string(id) }

type EffectInstanceID struct{ ulid.ULID }

func NewEffectInstanceID() EffectInstanceID {
	return EffectInstanceID{ulid.MustNew(ulid.Timestamp(time.Now()), defaultEntropy)}
}

func (id EffectInstanceID) String() string { return id.ULID.String() }

type ContentPackID string

func (id ContentPackID) String() string { return string(id) }

var _ fmt.Stringer = CharacterID{}
var _ fmt.Stringer = CreatureID{}
var _ fmt.Stringer = EventID{}
var _ fmt.Stringer = CampaignID{}
var _ fmt.Stringer = SpellID("")
var _ fmt.Stringer = SpeciesID("")

func MustNewULID() ulid.ULID {
	return ulid.MustNew(ulid.Timestamp(time.Now()), defaultEntropy)
}

func NewULIDReader() io.Reader {
	return defaultEntropy
}
