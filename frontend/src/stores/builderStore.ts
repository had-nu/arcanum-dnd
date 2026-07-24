import { signal, computed } from '@preact/signals';
import type { BuildRequest, AbilityScores, ClassReq } from '@types/api';

const defaultAbilities: AbilityScores = { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };

export const builderStore = {
  step: signal<'basics' | 'class' | 'skills' | 'spells' | 'review'>('basics'),
  
  name: signal(''),
  
  speciesId: signal(''),
  speciesVariant: signal(''),
  
  backgroundId: signal(''),
  
  classes: signal<ClassReq[]>([{ id: '', level: 1 }]),
  
  abilityScores: signal<AbilityScores>({ ...defaultAbilities }),
  abilityMethod: signal<'standard' | 'point-buy' | 'roll'>('standard'),
  
  skills: signal<string[]>([]),
  
  spells: signal<string[]>([]),
  feats: signal<string[]>([]),
  
  equipment: signal<string[]>([]),
  
  subclassId: signal(''),
  
  bgAlignment: signal(''),
  bgFaith: signal(''),
  bgTrait: signal(''),
  bgIdeal: signal(''),
  bgBond: signal(''),
  bgFlaw: signal(''),
  bgAge: signal(''),
  bgHeight: signal(''),
  bgWeight: signal(''),
  bgEyes: signal(''),
  bgSkin: signal(''),
  bgHair: signal(''),
  bgNotes: signal(''),
  
  xp: signal(0),
  progressionType: signal<'milestone' | 'xp'>('milestone'),
  
  completedSteps: signal<string[]>([]),
  
  errors: signal<Record<string, string>>({}),
  
  isSubmitting: signal(false),
  submitError: signal<string | null>(null),
  submitSuccess: signal(false),
  
  get totalLevel() {
    return this.classes.value.reduce((sum, c) => sum + c.level, 0);
  },
  
  get primaryClass() {
    return this.classes.value[0] || { id: '', level: 1 };
  },
  
  toBuildRequest(): BuildRequest {
    return {
      name: this.name.value,
      classes: this.classes.value,
      backgroundId: this.backgroundId.value,
      speciesId: this.speciesId.value,
      speciesVariant: this.speciesVariant.value || undefined,
      level: this.totalLevel,
      abilityScores: this.abilityScores.value,
      abilityMethod: this.abilityMethod.value,
      skills: this.skills.value,
      spells: this.spells.value,
      feats: this.feats.value,
    };
  },
  
  toSaveRequest() {
    return {
      name: this.name.value,
      classes: this.classes.value.map(c => ({
        id: c.id,
        name: '', // will be filled from content
        level: c.level,
        subclassId: this.subclassId.value || undefined,
      })),
      backgroundId: this.backgroundId.value,
      backgroundName: '',
      speciesId: this.speciesId.value,
      speciesVariant: this.speciesVariant.value || undefined,
      speciesHybrid: undefined,
      level: this.totalLevel,
      abilityMethod: this.abilityMethod.value,
      abilities: this.abilityScores.value,
      skills: this.skills.value,
      spells: this.spells.value,
      feats: this.feats.value,
      equipment: this.equipment.value,
      subclassId: this.subclassId.value || undefined,
      bgAlignment: this.bgAlignment.value || undefined,
      bgFaith: this.bgFaith.value || undefined,
      bgTrait: this.bgTrait.value || undefined,
      bgIdeal: this.bgIdeal.value || undefined,
      bgBond: this.bgBond.value || undefined,
      bgFlaw: this.bgFlaw.value || undefined,
      bgAge: this.bgAge.value || undefined,
      bgHeight: this.bgHeight.value || undefined,
      bgWeight: this.bgWeight.value || undefined,
      bgEyes: this.bgEyes.value || undefined,
      bgSkin: this.bgSkin.value || undefined,
      bgHair: this.bgHair.value || undefined,
      bgNotes: this.bgNotes.value || undefined,
      xp: this.xp.value,
      progressionType: this.progressionType.value,
    };
  },
  
  setField(field: string, value: any) {
    if (this[field as keyof typeof this]?.value !== undefined) {
      (this[field as keyof typeof this] as any).value = value;
    }
  },
  
  setErrors(errors: Record<string, string>) {
    this.errors.value = errors;
  },
  
  clearError(field: string) {
    const { [field]: _, ...rest } = this.errors.value;
    this.errors.value = rest;
  },
  
  markStepComplete(step: string) {
    if (!this.completedSteps.value.includes(step)) {
      this.completedSteps.value = [...this.completedSteps.value, step];
    }
  },
  
  canProceed(): boolean {
    const step = this.step.value;
    const errors = this.errors.value;
    
    if (Object.keys(errors).length > 0) return false;
    
    switch (step) {
      case 'basics':
        return !!this.name.value && !!this.speciesId.value && !!this.backgroundId.value &&
               Object.values(this.abilityScores.value).every(v => v >= 3 && v <= 20);
      case 'class':
        return this.classes.value.length > 0 && this.classes.value.every(c => c.id && c.level > 0);
      case 'skills':
        return this.skills.value.length > 0;
      case 'spells':
        return true; // optional
      case 'review':
        return true;
      default:
        return false;
    }
  },
  
  reset() {
    this.step.value = 'basics';
    this.name.value = '';
    this.speciesId.value = '';
    this.speciesVariant.value = '';
    this.backgroundId.value = '';
    this.classes.value = [{ id: '', level: 1 }];
    this.abilityScores.value = { ...defaultAbilities };
    this.abilityMethod.value = 'standard';
    this.skills.value = [];
    this.spells.value = [];
    this.feats.value = [];
    this.equipment.value = [];
    this.subclassId.value = '';
    this.bgAlignment.value = '';
    this.bgFaith.value = '';
    this.bgTrait.value = '';
    this.bgIdeal.value = '';
    this.bgBond.value = '';
    this.bgFlaw.value = '';
    this.bgAge.value = '';
    this.bgHeight.value = '';
    this.bgWeight.value = '';
    this.bgEyes.value = '';
    this.bgSkin.value = '';
    this.bgNotes.value = '';
    this.xp.value = 0;
    this.progressionType.value = 'milestone';
    this.completedSteps.value = [];
    this.errors.value = {};
    this.isSubmitting.value = false;
    this.submitError.value = null;
    this.submitSuccess.value = false;
  },
  
  loadFromCharacter(character: SavedCharacter) {
    this.name.value = character.name;
    this.speciesId.value = character.speciesId;
    this.speciesVariant.value = character.speciesVariant || '';
    this.backgroundId.value = character.backgroundId;
    this.classes.value = character.classes.map(c => ({ id: c.id, level: c.level }));
    this.subclassId.value = character.subclassId || '';
    this.abilityScores.value = character.abilities as AbilityScores;
    this.abilityMethod.value = character.abilityMethod as any;
    this.skills.value = character.skills;
    this.spells.value = character.spells || [];
    this.feats.value = character.feats || [];
    this.equipment.value = character.equipment || [];
    this.bgAlignment.value = character.bgAlignment || '';
    this.bgFaith.value = character.bgFaith || '';
    this.bgTrait.value = character.bgTrait || '';
    this.bgIdeal.value = character.bgIdeal || '';
    this.bgBond.value = character.bgBond || '';
    this.bgFlaw.value = character.bgFlaw || '';
    this.bgAge.value = character.bgAge || '';
    this.bgHeight.value = character.bgHeight || '';
    this.bgWeight.value = character.bgWeight || '';
    this.bgEyes.value = character.bgEyes || '';
    this.bgSkin.value = character.bgSkin || '';
    this.bgNotes.value = character.bgNotes || '';
    this.xp.value = character.xp;
    this.progressionType.value = character.progressionType;
    this.level.value = character.level;
    
    this.completedSteps.value = ['basics', 'class', 'skills', 'spells'];
  },
};