package types

import "fmt"

type AbilityScore string

const (
	STR AbilityScore = "STR"
	DEX AbilityScore = "DEX"
	CON AbilityScore = "CON"
	INT AbilityScore = "INT"
	WIS AbilityScore = "WIS"
	CHA AbilityScore = "CHA"
)

var AllAbilityScores = []AbilityScore{STR, DEX, CON, INT, WIS, CHA}

type AbilityScores struct {
	STR int `validate:"min=1,max=30"`
	DEX int `validate:"min=1,max=30"`
	CON int `validate:"min=1,max=30"`
	INT int `validate:"min=1,max=30"`
	WIS int `validate:"min=1,max=30"`
	CHA int `validate:"min=1,max=30"`
}

type Size string

const (
	SizeTiny       Size = "Tiny"
	SizeSmall      Size = "Small"
	SizeMedium     Size = "Medium"
	SizeLarge      Size = "Large"
	SizeHuge       Size = "Huge"
	SizeGargantuan Size = "Gargantuan"
)

type CreatureType string

const (
	CreatureAberration  CreatureType = "Aberration"
	CreatureBeast       CreatureType = "Beast"
	CreatureCelestial   CreatureType = "Celestial"
	CreatureConstruct   CreatureType = "Construct"
	CreatureDragon      CreatureType = "Dragon"
	CreatureElemental   CreatureType = "Elemental"
	CreatureFey         CreatureType = "Fey"
	CreatureFiend       CreatureType = "Fiend"
	CreatureGiant       CreatureType = "Giant"
	CreatureHumanoid    CreatureType = "Humanoid"
	CreatureMonstrosity CreatureType = "Monstrosity"
	CreatureOoze        CreatureType = "Ooze"
	CreaturePlant       CreatureType = "Plant"
	CreatureUndead      CreatureType = "Undead"
)

type DamageType string

const (
	DamageAcid       DamageType = "acid"
	DamageBludgeoning DamageType = "bludgeoning"
	DamageCold       DamageType = "cold"
	DamageFire       DamageType = "fire"
	DamageForce      DamageType = "force"
	DamageLightning  DamageType = "lightning"
	DamageNecrotic   DamageType = "necrotic"
	DamagePiercing   DamageType = "piercing"
	DamagePoison     DamageType = "poison"
	DamagePsychic    DamageType = "psychic"
	DamageRadiant    DamageType = "radiant"
	DamageSlashing   DamageType = "slashing"
	DamageThunder    DamageType = "thunder"
)

type Skill string

const (
	SkillAcrobatics     Skill = "acrobatics"
	SkillAnimalHandling Skill = "animal-handling"
	SkillArcana         Skill = "arcana"
	SkillAthletics      Skill = "athletics"
	SkillDeception      Skill = "deception"
	SkillHistory        Skill = "history"
	SkillInsight        Skill = "insight"
	SkillIntimidation   Skill = "intimidation"
	SkillInvestigation  Skill = "investigation"
	SkillMedicine       Skill = "medicine"
	SkillNature         Skill = "nature"
	SkillPerception     Skill = "perception"
	SkillPerformance    Skill = "performance"
	SkillPersuasion     Skill = "persuasion"
	SkillReligion       Skill = "religion"
	SkillSleightOfHand  Skill = "sleight-of-hand"
	SkillStealth        Skill = "stealth"
	SkillSurvival       Skill = "survival"
)

var AllSkills = []Skill{
	SkillAcrobatics, SkillAnimalHandling, SkillArcana,
	SkillAthletics, SkillDeception, SkillHistory,
	SkillInsight, SkillIntimidation, SkillInvestigation,
	SkillMedicine, SkillNature, SkillPerception,
	SkillPerformance, SkillPersuasion, SkillReligion,
	SkillSleightOfHand, SkillStealth, SkillSurvival,
}

var SkillAbility = map[Skill]AbilityScore{
	SkillAcrobatics:     DEX,
	SkillAnimalHandling: WIS,
	SkillArcana:         INT,
	SkillAthletics:      STR,
	SkillDeception:      CHA,
	SkillHistory:        INT,
	SkillInsight:        WIS,
	SkillIntimidation:   CHA,
	SkillInvestigation:  INT,
	SkillMedicine:       WIS,
	SkillNature:         INT,
	SkillPerception:     WIS,
	SkillPerformance:    CHA,
	SkillPersuasion:     CHA,
	SkillReligion:       INT,
	SkillSleightOfHand:  DEX,
	SkillStealth:        DEX,
	SkillSurvival:       WIS,
}

type ProficiencyLevel string

const (
	ProficiencyNone       ProficiencyLevel = "none"
	ProficiencyHalf       ProficiencyLevel = "half"
	ProficiencyProficient ProficiencyLevel = "proficient"
	ProficiencyExpertise  ProficiencyLevel = "expertise"
)

func ProficiencyMultiplier(level ProficiencyLevel) float64 {
	switch level {
	case ProficiencyHalf:
		return 0.5
	case ProficiencyProficient:
		return 1
	case ProficiencyExpertise:
		return 2
	default:
		return 0
	}
}

type HitDie string

const (
	HitDieD6  HitDie = "d6"
	HitDieD8  HitDie = "d8"
	HitDieD10 HitDie = "d10"
	HitDieD12 HitDie = "d12"
)

type MovementMode string

const (
	MovementWalk         MovementMode = "walk"
	MovementFly          MovementMode = "fly"
	MovementSwim         MovementMode = "swim"
	MovementClimb        MovementMode = "climb"
	MovementBurrow       MovementMode = "burrow"
	MovementTeleport     MovementMode = "teleport"
)

type Speed struct {
	Walk  int `yaml:"walk" validate:"min=0"`
	Fly   int `yaml:"fly,omitempty"`
	Swim  int `yaml:"swim,omitempty"`
	Climb int `yaml:"climb,omitempty"`
	Burrow int `yaml:"burrow,omitempty"`
}

type SpellSchool string

const (
	SchoolAbjuration      SpellSchool = "Abjuration"
	SchoolConjuration     SpellSchool = "Conjuration"
	SchoolDivination      SpellSchool = "Divination"
	SchoolEnchantment     SpellSchool = "Enchantment"
	SchoolEvocation       SpellSchool = "Evocation"
	SchoolIllusion        SpellSchool = "Illusion"
	SchoolNecromancy      SpellSchool = "Necromancy"
	SchoolTransmutation   SpellSchool = "Transmutation"
)

type Alignment string

const (
	AlignmentLawfulGood    Alignment = "Lawful Good"
	AlignmentNeutralGood   Alignment = "Neutral Good"
	AlignmentChaoticGood   Alignment = "Chaotic Good"
	AlignmentLawfulNeutral Alignment = "Lawful Neutral"
	AlignmentTrueNeutral   Alignment = "True Neutral"
	AlignmentChaoticNeutral Alignment = "Chaotic Neutral"
	AlignmentLawfulEvil    Alignment = "Lawful Evil"
	AlignmentNeutralEvil   Alignment = "Neutral Evil"
	AlignmentChaoticEvil   Alignment = "Chaotic Evil"
	AlignmentUnaligned     Alignment = "Unaligned"
)

type DiceExpression struct {
	Count    int `yaml:"count" validate:"min=1"`
	Die      int `yaml:"die" validate:"min=2,max=100"`
	Modifier int `yaml:"modifier,omitempty"`
}

type ChoiceOption struct {
	ID          string `json:"id" validate:"required"`
	Label       string `json:"label" validate:"required"`
	Description string `json:"description,omitempty"`
}

func (d DiceExpression) String() string {
	if d.Modifier > 0 {
		return fmt.Sprintf("%dd%d+%d", d.Count, d.Die, d.Modifier)
	}
	if d.Modifier < 0 {
		return fmt.Sprintf("%dd%d%d", d.Count, d.Die, d.Modifier)
	}
	return fmt.Sprintf("%dd%d", d.Count, d.Die)
}
