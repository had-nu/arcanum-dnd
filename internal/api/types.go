package api

type ResourceItem struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type ResourceList struct {
	Data  []ResourceItem `json:"data"`
	Count int            `json:"count"`
}

type APIResponse struct {
	Data any `json:"data"`
}

// Spell data from the API
type SpellData struct {
	Slug        string          `json:"slug"`
	Name        string          `json:"name"`
	Description string          `json:"description"`
	DescMD      string          `json:"description_md"`
	Properties  SpellProperties `json:"properties"`
	Source      string          `json:"source"`
}

type SpellProperties struct {
	Name            string   `json:"name"`
	Level           int      `json:"level"`
	Range           string   `json:"range"`
	Ritual          bool     `json:"ritual"`
	School          string   `json:"school"`
	Classes         []string `json:"classes"`
	Duration        string   `json:"duration"`
	Material        string   `json:"material"`
	ActionType      string   `json:"actionType"`
	Components      []string `json:"components"`
	Concentration   bool     `json:"concentration"`
	HigherLevelSlot string   `json:"higherLevelSlot"`
	Description     string   `json:"description"`
}

// Class data from the API
type ClassData struct {
	Slug        string           `json:"slug"`
	Name        string           `json:"name"`
	Description string           `json:"description"`
	DescMD      string           `json:"description_md"`
	Properties  ClassProperties  `json:"properties"`
	Source      string           `json:"source"`
}

type ClassProperties struct {
	CoreTraits       map[string]string `json:"core_traits"`
	FeaturesByLevel  []LevelFeature    `json:"features_by_level"`
}

type LevelFeature struct {
	Level            string `json:"Level"`
	ProficiencyBonus string `json:"Proficiency Bonus"`
	ClassFeatures    string `json:"Class Features"`
}

// Species data from the API
type SpeciesData struct {
	Slug        string             `json:"slug"`
	Name        string             `json:"name"`
	Description string             `json:"description"`
	DescMD      string             `json:"description_md"`
	Properties  SpeciesProperties  `json:"properties"`
	Source      string             `json:"source"`
}

type SpeciesProperties struct {
	Size          string          `json:"size"`
	Speed         string          `json:"speed"`
	Traits        []SpeciesTrait  `json:"traits"`
	CreatureType  string          `json:"creature_type"`
	SourceFile    string          `json:"source_file"`
}

type SpeciesTrait struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

// Background data from the API
type BackgroundData struct {
	Slug        string                `json:"slug"`
	Name        string                `json:"name"`
	Description string                `json:"description"`
	DescMD      string                `json:"description_md"`
	Properties  BackgroundProperties  `json:"properties"`
	Source      string                `json:"source"`
}

type BackgroundProperties struct {
	Feat               string   `json:"feat"`
	AbilityScores      []string `json:"ability_scores"`
	SkillProficiencies []string `json:"skill_proficiencies"`
	ToolProficiency    string   `json:"tool_proficiency"`
	SourceFile         string   `json:"source_file"`
}

// Feat data from the API
type FeatData struct {
	Slug        string          `json:"slug"`
	Name        string          `json:"name"`
	Description string          `json:"description"`
	DescMD      string          `json:"description_md"`
	Properties  FeatProperties  `json:"properties"`
	Source      string          `json:"source"`
}

type FeatProperties struct {
	Benefits []FeatBenefit `json:"benefits"`
	Category string        `json:"category"`
}

type FeatBenefit struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

// Item data from the API
type ItemData struct {
	Slug        string          `json:"slug"`
	Name        string          `json:"name"`
	Description string          `json:"description"`
	DescMD      string          `json:"description_md"`
	Properties  ItemProperties  `json:"properties"`
	Source      string          `json:"source"`
}

type ItemProperties struct {
	Name          string `json:"name"`
	Type          string `json:"type"`
	Rarity        string `json:"rarity"`
	Attunement    bool   `json:"attunement"`
	Description   string `json:"description"`
}

// Monster data from the API
type MonsterData struct {
	Slug        string             `json:"slug"`
	Name        string             `json:"name"`
	Description string             `json:"description"`
	DescMD      string             `json:"description_md"`
	Properties  MonsterProperties  `json:"properties"`
	Source      string             `json:"source"`
}

type MonsterProperties struct {
	AC              int                `json:"ac"`
	HP              int                `json:"hp"`
	HitDice         string             `json:"hitDice"`
	MaxHitPoints    int                `json:"maxHitPoints"`
	Speed           MonsterSpeed       `json:"speed"`
	Stats           AbilityScores      `json:"stats"`
	Modifiers       AbilityScores      `json:"modifiers"`
	SavingThrows    AbilityScores      `json:"savingThrows"`
	Skills          map[string]int     `json:"skills"`
	Challenge       Challenge          `json:"challenge"`
	CR              string             `json:"cr"`
	CRValue         float64            `json:"crValue"`
	XP              int                `json:"xp"`
	Size            string             `json:"size"`
	Alignment       string             `json:"alignment"`
	CreatureType    string             `json:"creatureType"`
	CreatureSubtype string             `json:"creatureSubtype"`
	Languages       []string           `json:"languages"`
	Senses          MonsterSenses      `json:"senses"`
	Initiative      int                `json:"initiative"`
	ProficiencyBonus int               `json:"proficiencyBonus"`
	DamageImmunities    []string       `json:"damageImmunities"`
	DamageResistances   []string       `json:"damageResistances"`
	DamageVulnerabilities []string     `json:"damageVulnerabilities"`
	ConditionImmunities  []string      `json:"conditionImmunities"`
	Traits           []MonsterTrait    `json:"traits"`
	Actions          MonsterActions    `json:"actions"`
	BonusActions     []string          `json:"bonusActions"`
	Reactions        []string          `json:"reactions"`
	LegendaryActions []string          `json:"legendaryActions"`
	Gear             string            `json:"gear"`
}

type MonsterSpeed struct {
	Walk   int `json:"walk"`
	Fly    int `json:"fly"`
	Swim   int `json:"swim"`
	Burrow int `json:"burrow"`
	Climb  int `json:"climb"`
}

type AbilityScores struct {
	STR int `json:"str"`
	DEX int `json:"dex"`
	CON int `json:"con"`
	INT int `json:"int"`
	WIS int `json:"wis"`
	CHA int `json:"cha"`
}

type Challenge struct {
	XP      int     `json:"xp"`
	Rating  string  `json:"rating"`
}

type MonsterSenses struct {
	Darkvision     int `json:"darkvision"`
	Blindsight     int `json:"blindsight"`
	Truesight      int `json:"truesight"`
	Tremorsense    int `json:"tremorsense"`
	PassivePerception int `json:"passivePerception"`
}

type MonsterTrait struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type MonsterActions struct {
	List        []string `json:"list"`
	AttackRolls []any    `json:"attackRolls"`
}
