export interface ContentResponse {
  classes: ClassEntry[];
  backgrounds: BackgroundEntry[];
  species: SpeciesEntry[];
  abilities: AbilityEntry[];
  skills: SkillEntry[];
  feats: Record<string, FeatEntry>;
  spellCasterClasses: string[];
}

export interface ClassEntry {
  id: string;
  name: string;
  hitDie: string;
  savingThrows: string[];
  primaryAbility: string[];
  skillChoices: number;
  skillPool: string[];
  spellcaster: boolean;
  subClasses: SubClassEntry[];
  subclassLevel: number;
  features: FeatureDef[];
  spellcasting?: SpellcastingEntry;
}

export interface SubClassEntry {
  id: string;
  name: string;
  description?: string;
}

export interface FeatureDef {
  level: number;
  id: string;
  name: string;
}

export interface SpellcastingEntry {
  type?: string;
  ability?: string;
  cantripsKnown?: number[];
  preparedSpells?: number[];
  spellsKnown?: number[];
  spellSlots?: Record<string, number>;
  ritualCasting?: boolean;
  spellLists?: Record<number, string[]>;
}

export interface BackgroundEntry {
  id: string;
  name: string;
  skills: string[];
  feat?: string;
}

export interface SpeciesEntry {
  id: string;
  name: string;
  size: string;
  speed: number;
  variants: VariantEntry[];
}

export interface VariantEntry {
  id: string;
  name: string;
}

export interface AbilityEntry {
  id: string;
  name: string;
}

export interface SkillEntry {
  id: string;
  name: string;
  ability: string;
}

export interface FeatEntry {
  id: string;
  name: string;
  description?: string;
  prerequisites?: unknown;
}

export interface SpellsResponse {
  cantrips: SpellEntry[];
  leveled: SpellEntry[][];
}

export interface SpellEntry {
  id: string;
  name: string;
  level: number;
  school: string;
  time: string;
  range: string;
  duration: string;
  concentration: boolean;
  damage?: string;
  save?: string;
  attack?: boolean;
  ritual?: boolean;
}

export interface BuildRequest {
  name: string;
  classes: ClassReq[];
  backgroundId: string;
  speciesId: string;
  speciesVariant?: string;
  level: number;
  abilityScores: AbilityScores;
  abilityMethod?: string;
  skills: string[];
  spells?: string[];
  feats?: string[];
}

export interface ClassReq {
  id: string;
  level: number;
  subclassId?: string;
  classTab?: 'features' | 'spells';
}

export interface AbilityScores {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
  method?: 'standard' | 'point-buy' | 'roll';
  rolledScores?: number[];
  assignedRolls?: number[];
  [key: string]: number | string | number[] | undefined;
}

export interface BuildResponse {
  id: string;
  sheet: CharacterSheet;
  classes: string[];
  event: Event;
  yaml: string;
  features: FeatureView[];
}

export interface FeatureView {
  class: string;
  level: number;
  name: string;
  id: string;
}

export interface CharacterSheet {
  id: string;
  name: string;
  level: number;
  classes: ClassSummary[];
  species: string;
  background: string;
  abilityScores: AbilityScores;
  hp: HP;
  ac: number;
  savingThrows: Record<string, number>;
  skills: Record<string, number>;
  attacks: Attack[];
  spellSlots: Record<string, number>;
  spells: string[];
  features: FeatureView[];
}

export interface ClassSummary {
  id: string;
  name: string;
  level: number;
  subclass?: string;
}

export interface HP {
  current: number;
  max: number;
  temp: number;
}

export interface Attack {
  name: string;
  bonus: number;
  damage: string;
  type: string;
  range: string;
}

export interface Event {
  type: string;
  characterCreated?: CharacterCreatedEvent;
}

export interface CharacterCreatedEvent {
  characterId: string;
  name: string;
  speciesId: string;
  speciesVariant?: string;
  backgroundId: string;
  level: number;
  abilityScores: AbilityScores;
  maxHP: number;
  savingThrows: string[];
  skills: Record<string, string>;
  spells: string[];
  feats: string[];
  abilityMethod?: string;
  classes: ClassEntryEvent[];
}

export interface ClassEntryEvent {
  classId: string;
  level: number;
}

export interface SavedCharacter {
  name: string;
  classes: SavedClass[];
  backgroundId: string;
  backgroundName?: string;
  speciesId: string;
  speciesVariant?: string;
  speciesHybrid?: string;
  level: number;
  abilityMethod: string;
  abilities: Record<string, number>;
  skills: string[];
  spells?: string[];
  feats?: string[];
  equipment?: string[];
  subclassId?: string;
  bgAlignment?: string;
  bgFaith?: string;
  bgTrait?: string;
  bgIdeal?: string;
  bgBond?: string;
  bgFlaw?: string;
  bgAge?: string;
  bgHeight?: string;
  bgWeight?: string;
  bgEyes?: string;
  bgSkin?: string;
  bgHair?: string;
  bgNotes?: string;
  xp: number;
  progressionType: 'milestone' | 'xp';
  createdAt: string;
  updatedAt: string;
}

export interface SavedClass {
  id: string;
  name: string;
  level: number;
  subclassId?: string;
}

export interface CharacterSummary {
  name: string;
  level: number;
  classes: string;
  species: string;
  updatedAt: string;
}

export interface SaveCharacterRequest {
  name: string;
  classes: SavedClass[];
  backgroundId: string;
  backgroundName?: string;
  speciesId: string;
  speciesVariant?: string;
  speciesHybrid?: string;
  level: number;
  abilityMethod: string;
  abilities: Record<string, number>;
  skills: string[];
  spells?: string[];
  feats?: string[];
  equipment?: string[];
  subclassId?: string;
  bgAlignment?: string;
  bgFaith?: string;
  bgTrait?: string;
  bgIdeal?: string;
  bgBond?: string;
  bgFlaw?: string;
  bgAge?: string;
  bgHeight?: string;
  bgWeight?: string;
  bgEyes?: string;
  bgSkin?: string;
  bgHair?: string;
  bgNotes?: string;
  xp: number;
  progressionType: 'milestone' | 'xp';
}