package content

import (
	"github.com/hadnu/arcanum/internal/schemas"
	"github.com/hadnu/arcanum/internal/types"
)

type ContentPack struct {
	ID          types.ContentPackID `yaml:"id" validate:"required"`
	Name        string              `yaml:"name" validate:"required"`
	Version     string              `yaml:"version" validate:"required"`
	License     string              `yaml:"license,omitempty"`
	Attribution string              `yaml:"attribution,omitempty"`
	Overrides   []string            `yaml:"overrides,omitempty"`

	Species      []Species      `yaml:"species,omitempty"`
	Backgrounds  []Background   `yaml:"backgrounds,omitempty"`
	Classes      []Class        `yaml:"classes,omitempty"`
	Feats        []Feat         `yaml:"feats,omitempty"`
	Spells       []Spell        `yaml:"spells,omitempty"`
	Items        []ItemDef      `yaml:"items,omitempty"`
	Monsters     []Monster      `yaml:"monsters,omitempty"`
	Conditions   []Condition    `yaml:"conditions,omitempty"`
}

type SpeciesVariant struct {
	ID           string       `yaml:"id"`
	Name         string       `yaml:"name"`
	Size         types.Size   `yaml:"size,omitempty"`
	Speed        *types.Speed `yaml:"speed,omitempty"`
	AbilityScore struct {
		STR int `yaml:"str,omitempty"`
		DEX int `yaml:"dex,omitempty"`
		CON int `yaml:"con,omitempty"`
		INT int `yaml:"int,omitempty"`
		WIS int `yaml:"wis,omitempty"`
		CHA int `yaml:"cha,omitempty"`
	} `yaml:"abilityScore,omitempty"`
	Traits       []schemas.Effect    `yaml:"traits,omitempty"`
	Languages    []string            `yaml:"languages,omitempty"`
	Spellcasting *VariantSpellcasting `yaml:"spellcasting,omitempty"`
}

type VariantSpellcasting struct {
	Cantrips    int      `yaml:"cantrips"`
	Spells      int      `yaml:"spells"`
	SpellList   []string `yaml:"spellList,omitempty"`
	Ability     types.AbilityScore `yaml:"ability"`
}

type Species struct {
	ID           types.SpeciesID        `yaml:"id" validate:"required"`
	Name         string                 `yaml:"name" validate:"required"`
	Size         types.Size             `yaml:"size"`
	Speed        types.Speed            `yaml:"speed"`
	AbilityScore struct {
		STR int `yaml:"str,omitempty"`
		DEX int `yaml:"dex,omitempty"`
		CON int `yaml:"con,omitempty"`
		INT int `yaml:"int,omitempty"`
		WIS int `yaml:"wis,omitempty"`
		CHA int `yaml:"cha,omitempty"`
	} `yaml:"abilityScore,omitempty"`
	Traits       []schemas.Effect    `yaml:"traits,omitempty"`
	Languages    []string            `yaml:"languages,omitempty"`
	CreatureType types.CreatureType  `yaml:"creatureType"`
	Variants     []SpeciesVariant    `yaml:"variants,omitempty"`
}

type SpellcastingType string

const (
	CasterTypeFull  SpellcastingType = "full"
	CasterTypeHalf  SpellcastingType = "half"
	CasterTypeThird SpellcastingType = "third"
	CasterTypePact  SpellcastingType = "pact"
)

type SpellcastingProfile struct {
	Type            SpellcastingType   `yaml:"type" validate:"required"`
	Ability         types.AbilityScore `yaml:"ability" validate:"required"`
	PreparedFormula string             `yaml:"preparedFormula,omitempty"`
	RitualCasting   bool               `yaml:"ritualCasting,omitempty"`
}

type Background struct {
	ID                  types.BackgroundID   `yaml:"id" validate:"required"`
	Name                string               `yaml:"name" validate:"required"`
	AbilityScoreOptions []types.AbilityScore `yaml:"abilityScoreOptions,omitempty"`
	Skills              []types.Skill        `yaml:"skills,omitempty"`
	Tools               []string             `yaml:"tools,omitempty"`
	Languages           []string             `yaml:"languages,omitempty"`
	Feat                *types.FeatID        `yaml:"feat,omitempty"`
	Traits              []schemas.Effect     `yaml:"traits,omitempty"`
}

type Class struct {
	ID            types.ClassID        `yaml:"id" validate:"required"`
	Name          string               `yaml:"name" validate:"required"`
	HitDie        types.HitDie         `yaml:"hitDie" validate:"required"`
	PrimaryAbility []types.AbilityScore `yaml:"primaryAbility" validate:"required,min=1"`
	SavingThrows  []types.AbilityScore  `yaml:"savingThrows" validate:"required,min=2"`
	Spellcasting  *SpellcastingProfile `yaml:"spellcasting,omitempty"`
	Proficiencies struct {
		Armor   []string `yaml:"armor,omitempty"`
		Weapons []string `yaml:"weapons,omitempty"`
		Skills  []struct {
			Skill  types.Skill   `yaml:"skill"`
			Choose int           `yaml:"choose,omitempty"`
			From   []types.Skill `yaml:"from,omitempty"`
		} `yaml:"skills,omitempty"`
	} `yaml:"proficiencies,omitempty"`
	SubClasses []SubClass   `yaml:"subClasses,omitempty"`
	Levels     []LevelEntry `yaml:"levels" validate:"required,min=1"`
}

type SubClass struct {
	ID                   types.SubClassID     `yaml:"id" validate:"required"`
	Name                 string               `yaml:"name" validate:"required"`
	Description          string               `yaml:"description,omitempty"`
	SpellcastingOverride *SpellcastingProfile `yaml:"spellcastingOverride,omitempty"`
	AlwaysPreparedSpells map[int][]types.SpellID `yaml:"alwaysPreparedSpells,omitempty"`
	Features             []types.FeatID       `yaml:"features,omitempty"`
	Effects              []schemas.Effect     `yaml:"effects,omitempty"`
}

type LevelEntry struct {
	Level          int            `yaml:"level" validate:"min=1,max=20"`
	ProfBonus      int            `yaml:"profBonus"`
	Features       []types.FeatID `yaml:"features,omitempty"`
	CantripsKnown  int            `yaml:"cantripsKnown,omitempty"`
	PreparedSpells int            `yaml:"preparedSpells,omitempty"`
	SpellsKnown    int            `yaml:"spellsKnown,omitempty"`
	SpellSlots     map[int]int    `yaml:"spellSlots,omitempty"`
	Feat           *types.FeatID  `yaml:"feat,omitempty"`
}

type Feat struct {
	ID          types.FeatID     `yaml:"id" validate:"required"`
	Name        string           `yaml:"name" validate:"required"`
	Prerequisites *Prerequisites `yaml:"prerequisites,omitempty"`
	Effects       []schemas.Effect `yaml:"effects,omitempty"`
	ReplacesID    *types.FeatID   `yaml:"replacesId,omitempty"`
}

type Prerequisites struct {
	Level       *int                `yaml:"level,omitempty"`
	Ability     *types.AbilityScore `yaml:"ability,omitempty"`
	AbilityMin  *int                `yaml:"abilityMin,omitempty"`
	Feat        *types.FeatID       `yaml:"feat,omitempty"`
	Class       *types.ClassID      `yaml:"class,omitempty"`
	Spellcasting *bool              `yaml:"spellcasting,omitempty"`
	Proficiency  *types.Skill       `yaml:"proficiency,omitempty"`
}

type Spell struct {
	ID              types.SpellID        `yaml:"id" validate:"required"`
	Name            string               `yaml:"name" validate:"required"`
	Level           int                  `yaml:"level" validate:"min=0,max=9"`
	School          types.SpellSchool    `yaml:"school" validate:"required"`
	CastingTime     string               `yaml:"castingTime"`
	Range           string               `yaml:"range"`
	Components      struct {
		Verbal     bool   `yaml:"verbal"`
		Somatic    bool   `yaml:"somatic"`
		Material   bool   `yaml:"material,omitempty"`
		MaterialDesc string `yaml:"materialDesc,omitempty"`
		Cost       *int   `yaml:"cost,omitempty"`
	} `yaml:"components"`
	Duration        string               `yaml:"duration"`
	Concentration   bool                 `yaml:"concentration"`
	Damage          *SpellDamage         `yaml:"damage,omitempty"`
	Healing         *string              `yaml:"healing,omitempty"`
	Save            *types.AbilityScore  `yaml:"save,omitempty"`
	Attack          bool                 `yaml:"attack,omitempty"`
	Classes         []types.ClassID      `yaml:"classes,omitempty"`
	Ritual          bool                 `yaml:"ritual,omitempty"`
	Effects         []schemas.Effect     `yaml:"effects,omitempty"`
}

type SpellDamage struct {
	Type       types.DamageType `yaml:"type"`
	Dice       string           `yaml:"dice"`
	PerSlot    string           `yaml:"perSlot,omitempty"`
	CantripScale []CantripTier  `yaml:"cantripScale,omitempty"`
}

type CantripTier struct {
	CharacterLevel int    `yaml:"characterLevel"`
	Dice           string `yaml:"dice"`
}

type ItemDef struct {
	ID          types.ItemDefinitionID `yaml:"id" validate:"required"`
	Name        string                 `yaml:"name" validate:"required"`
	Type        string                 `yaml:"type" validate:"required"`
	Rarity      string                 `yaml:"rarity,omitempty"`
	Value       int                    `yaml:"value,omitempty"`
	Weight      float64                `yaml:"weight,omitempty"`
	Attunement  string                 `yaml:"attunement,omitempty"`
	Description string                 `yaml:"description,omitempty"`
	Effects     []schemas.Effect       `yaml:"effects,omitempty"`
	Weapon      *WeaponStats           `yaml:"weapon,omitempty"`
	Armor       *ArmorStats            `yaml:"armor,omitempty"`
}

type WeaponStats struct {
	Damage     string               `yaml:"damage"`
	DamageType types.DamageType     `yaml:"damageType"`
	Properties []string             `yaml:"properties,omitempty"`
	Mastery    string               `yaml:"mastery,omitempty"`
	Range      *int                 `yaml:"range,omitempty"`
	LongRange  *int                 `yaml:"longRange,omitempty"`
}

type ArmorStats struct {
	BaseAC        int    `yaml:"baseAC"`
	DexBonus      bool   `yaml:"dexBonus,omitempty"`
	DexMax        *int   `yaml:"dexMax,omitempty"`
	StrengthMin   *int   `yaml:"strengthMin,omitempty"`
	StealthDisadv bool   `yaml:"stealthDisadv,omitempty"`
}

type Monster struct {
	ID            types.MonsterStatblockID `yaml:"id" validate:"required"`
	Name          string             `yaml:"name" validate:"required"`
	Size          types.Size         `yaml:"size"`
	Type          types.CreatureType `yaml:"type"`
	AC            int                `yaml:"ac"`
	HP            string             `yaml:"hp"`
	Speed         types.Speed        `yaml:"speed"`
	AbilityScores types.AbilityScores `yaml:"abilityScores"`
	CR            string             `yaml:"cr"`
	Traits        []schemas.Effect   `yaml:"traits,omitempty"`
}

type Condition struct {
	ID          types.ConditionID  `yaml:"id" validate:"required"`
	Name        string             `yaml:"name" validate:"required"`
	Effects     []schemas.Effect   `yaml:"effects,omitempty"`
}

type ResolvedContent struct {
	Species     map[types.SpeciesID]*Species     `json:"species"`
	Backgrounds map[types.BackgroundID]*Background `json:"backgrounds"`
	Classes     map[types.ClassID]*Class           `json:"classes"`
	Feats       map[types.FeatID]*Feat             `json:"feats"`
	Spells      map[types.SpellID]*Spell           `json:"spells"`
	Items       map[types.ItemDefinitionID]*ItemDef `json:"items"`
	Monsters    map[types.MonsterStatblockID]*Monster `json:"monsters"`
	Conditions  map[types.ConditionID]*Condition    `json:"conditions"`
}

func NewResolvedContent() ResolvedContent {
	return ResolvedContent{
		Species:     make(map[types.SpeciesID]*Species),
		Backgrounds: make(map[types.BackgroundID]*Background),
		Classes:     make(map[types.ClassID]*Class),
		Feats:       make(map[types.FeatID]*Feat),
		Spells:      make(map[types.SpellID]*Spell),
		Items:       make(map[types.ItemDefinitionID]*ItemDef),
		Monsters:    make(map[types.MonsterStatblockID]*Monster),
		Conditions:  make(map[types.ConditionID]*Condition),
	}
}
