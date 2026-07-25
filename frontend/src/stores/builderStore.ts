import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BuildRequest, AbilityScores, ClassReq, SavedCharacter } from '@/types/api';

const defaultAbilities: AbilityScores = { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };

type BuilderStep = 'name' | 'class' | 'background' | 'species' | 'abilities' | 'equipment' | 'sheet';

interface BuilderState {
  step: BuilderStep;
  name: string;
  speciesId: string;
  speciesVariant: string;
  backgroundId: string;
  classes: ClassReq[];
  abilityScores: AbilityScores;
  abilityMethod: 'standard' | 'point-buy' | 'roll';
  skills: string[];
  spells: string[];
  feats: string[];
  equipment: string[];
  subclassId: string;
  bgAlignment: string;
  bgFaith: string;
  bgTrait: string;
  bgIdeal: string;
  bgBond: string;
  bgFlaw: string;
  bgAge: string;
  bgHeight: string;
  bgWeight: string;
  bgEyes: string;
  bgSkin: string;
  bgHair: string;
  bgNotes: string;
  xp: number;
  progressionType: 'milestone' | 'xp';
  completedSteps: string[];
  errors: Record<string, string>;
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: boolean;
}

interface BuilderActions {
  setStep: (step: BuilderStep) => void;
  setName: (name: string) => void;
  setSpeciesId: (id: string) => void;
  setSpeciesVariant: (variant: string) => void;
  setBackgroundId: (id: string) => void;
  setClasses: (classes: ClassReq[]) => void;
  setAbilityScores: (scores: AbilityScores) => void;
  setAbilityMethod: (method: BuilderState['abilityMethod']) => void;
  setSkills: (skills: string[]) => void;
  setSpells: (spells: string[]) => void;
  setFeats: (feats: string[]) => void;
  setEquipment: (equipment: string[]) => void;
  setSubclassId: (id: string) => void;
  setBgAlignment: (alignment: string) => void;
  setBgFaith: (faith: string) => void;
  setBgTrait: (trait: string) => void;
  setBgIdeal: (ideal: string) => void;
  setBgBond: (bond: string) => void;
  setBgFlaw: (flaw: string) => void;
  setBgAge: (age: string) => void;
  setBgHeight: (height: string) => void;
  setBgWeight: (weight: string) => void;
  setBgEyes: (eyes: string) => void;
  setBgSkin: (skin: string) => void;
  setBgHair: (hair: string) => void;
  setBgNotes: (notes: string) => void;
  setXp: (xp: number) => void;
  setProgressionType: (type: BuilderState['progressionType']) => void;
  markStepComplete: (step: string) => void;
  setErrors: (errors: Record<string, string>) => void;
  clearError: (field: string) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setSubmitError: (error: string | null) => void;
  setSubmitSuccess: (success: boolean) => void;
  reset: () => void;
  loadFromCharacter: (character: SavedCharacter) => void;
}

export const builderStore = create<BuilderState & BuilderActions>()(
  persist(
    (set, get) => ({
      step: 'name',
      name: '',
      speciesId: '',
      speciesVariant: '',
      backgroundId: '',
      classes: [{ id: '', level: 1 }],
      abilityScores: { ...defaultAbilities },
      abilityMethod: 'standard',
      skills: [],
      spells: [],
      feats: [],
      equipment: [],
      subclassId: '',
      bgAlignment: '',
      bgFaith: '',
      bgTrait: '',
      bgIdeal: '',
      bgBond: '',
      bgFlaw: '',
      bgAge: '',
      bgHeight: '',
      bgWeight: '',
      bgEyes: '',
      bgSkin: '',
      bgHair: '',
      bgNotes: '',
      xp: 0,
      progressionType: 'milestone',
      completedSteps: [],
      errors: {},
      isSubmitting: false,
      submitError: null,
      submitSuccess: false,

      setStep: (step) => set({ step }),
      setName: (name) => set({ name }),
      setSpeciesId: (speciesId) => set({ speciesId }),
      setSpeciesVariant: (speciesVariant) => set({ speciesVariant }),
      setBackgroundId: (backgroundId) => set({ backgroundId }),
      setClasses: (classes) => set({ classes }),
      setAbilityScores: (abilityScores) => set({ abilityScores }),
      setAbilityMethod: (abilityMethod) => set({ abilityMethod }),
      setSkills: (skills) => set({ skills }),
      setSpells: (spells) => set({ spells }),
      setFeats: (feats) => set({ feats }),
      setEquipment: (equipment) => set({ equipment }),
      setSubclassId: (subclassId) => set({ subclassId }),
      setBgAlignment: (bgAlignment) => set({ bgAlignment }),
      setBgFaith: (bgFaith) => set({ bgFaith }),
      setBgTrait: (bgTrait) => set({ bgTrait }),
      setBgIdeal: (bgIdeal) => set({ bgIdeal }),
      setBgBond: (bgBond) => set({ bgBond }),
      setBgFlaw: (bgFlaw) => set({ bgFlaw }),
      setBgAge: (bgAge) => set({ bgAge }),
      setBgHeight: (bgHeight) => set({ bgHeight }),
      setBgWeight: (bgWeight) => set({ bgWeight }),
      setBgEyes: (bgEyes) => set({ bgEyes }),
      setBgSkin: (bgSkin) => set({ bgSkin }),
      setBgHair: (bgHair) => set({ bgHair }),
      setBgNotes: (bgNotes) => set({ bgNotes }),
      setXp: (xp) => set({ xp }),
      setProgressionType: (progressionType) => set({ progressionType }),

      markStepComplete: (step) => {
        const current = get().completedSteps;
        if (!current.includes(step)) {
          set({ completedSteps: [...current, step] });
        }
      },

      setErrors: (errors) => set({ errors }),
      clearError: (field) => {
        const current = get().errors;
        const { [field]: _, ...rest } = current;
        set({ errors: rest });
      },
      setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
      setSubmitError: (submitError) => set({ submitError }),
      setSubmitSuccess: (submitSuccess) => set({ submitSuccess }),

      reset: () => set({
        step: 'name',
        name: '',
        speciesId: '',
        speciesVariant: '',
        backgroundId: '',
        classes: [{ id: '', level: 1 }],
        abilityScores: { ...defaultAbilities },
        abilityMethod: 'standard',
        skills: [],
        spells: [],
        feats: [],
        equipment: [],
        subclassId: '',
        bgAlignment: '',
        bgFaith: '',
        bgTrait: '',
        bgIdeal: '',
        bgBond: '',
        bgFlaw: '',
        bgAge: '',
        bgHeight: '',
        bgWeight: '',
        bgEyes: '',
        bgSkin: '',
        bgHair: '',
        bgNotes: '',
        xp: 0,
        progressionType: 'milestone',
        completedSteps: [],
        errors: {},
        isSubmitting: false,
        submitError: null,
        submitSuccess: false,
      }),

      loadFromCharacter: (character) => set({
        name: character.name,
        speciesId: character.speciesId,
        speciesVariant: character.speciesVariant || '',
        backgroundId: character.backgroundId,
        classes: character.classes.map(c => ({ id: c.id, level: c.level })),
        subclassId: character.subclassId || '',
        abilityScores: {
          STR: character.abilities.STR ?? 10,
          DEX: character.abilities.DEX ?? 10,
          CON: character.abilities.CON ?? 10,
          INT: character.abilities.INT ?? 10,
          WIS: character.abilities.WIS ?? 10,
          CHA: character.abilities.CHA ?? 10,
        } as AbilityScores,
        abilityMethod: character.abilityMethod as BuilderState['abilityMethod'],
        skills: character.skills,
        spells: character.spells || [],
        feats: character.feats || [],
        equipment: character.equipment || [],
        bgAlignment: character.bgAlignment || '',
        bgFaith: character.bgFaith || '',
        bgTrait: character.bgTrait || '',
        bgIdeal: character.bgIdeal || '',
        bgBond: character.bgBond || '',
        bgFlaw: character.bgFlaw || '',
        bgAge: character.bgAge || '',
        bgHeight: character.bgHeight || '',
        bgWeight: character.bgWeight || '',
        bgEyes: character.bgEyes || '',
        bgSkin: character.bgSkin || '',
        bgHair: character.bgHair || '',
        bgNotes: character.bgNotes || '',
        xp: character.xp,
        progressionType: character.progressionType,
        completedSteps: ['name', 'class', 'background', 'species'],
      }),
    }),
    {
      name: 'arcanum-builder',
      partialize: (state) => ({
        // Only persist builder data, not UI state
        step: state.step,
        name: state.name,
        speciesId: state.speciesId,
        speciesVariant: state.speciesVariant,
        backgroundId: state.backgroundId,
        classes: state.classes,
        abilityScores: state.abilityScores,
        abilityMethod: state.abilityMethod,
        skills: state.skills,
        spells: state.spells,
        feats: state.feats,
        equipment: state.equipment,
        subclassId: state.subclassId,
        bgAlignment: state.bgAlignment,
        bgFaith: state.bgFaith,
        bgTrait: state.bgTrait,
        bgIdeal: state.bgIdeal,
        bgBond: state.bgBond,
        bgFlaw: state.bgFlaw,
        bgAge: state.bgAge,
        bgHeight: state.bgHeight,
        bgWeight: state.bgWeight,
        bgEyes: state.bgEyes,
        bgSkin: state.bgSkin,
        bgHair: state.bgHair,
        bgNotes: state.bgNotes,
        xp: state.xp,
        progressionType: state.progressionType,
        completedSteps: state.completedSteps,
      }),
    }
  )
);

export const getTotalLevel = () => {
  const state = builderStore.getState();
  return state.classes.reduce((sum, c) => sum + c.level, 0);
};

export const getPrimaryClass = () => {
  const state = builderStore.getState();
  return state.classes[0] || { id: '', level: 1 };
};

// Helper functions for the store
export const getBuilderRequest = () => {
  const state = builderStore.getState();
  return {
    name: state.name,
    classes: state.classes,
    backgroundId: state.backgroundId,
    speciesId: state.speciesId,
    speciesVariant: state.speciesVariant || undefined,
    level: getTotalLevel(),
    abilityScores: state.abilityScores,
    abilityMethod: state.abilityMethod,
    skills: state.skills,
    spells: state.spells,
    feats: state.feats,
  } as BuildRequest;
};

export const getSaveRequest = () => {
  const state = builderStore.getState();
  return {
    name: state.name,
    classes: state.classes.map(c => ({
      id: c.id,
      name: '',
      level: c.level,
      subclassId: state.subclassId || undefined,
    })),
    backgroundId: state.backgroundId,
    backgroundName: '',
    speciesId: state.speciesId,
    speciesVariant: state.speciesVariant || undefined,
    speciesHybrid: undefined,
    level: getTotalLevel(),
    abilityMethod: state.abilityMethod,
    abilities: state.abilityScores as unknown as Record<string, number>,
    skills: state.skills,
    spells: state.spells,
    feats: state.feats,
    equipment: state.equipment,
    subclassId: state.subclassId || undefined,
    bgAlignment: state.bgAlignment || undefined,
    bgFaith: state.bgFaith || undefined,
    bgTrait: state.bgTrait || undefined,
    bgIdeal: state.bgIdeal || undefined,
    bgBond: state.bgBond || undefined,
    bgFlaw: state.bgFlaw || undefined,
    bgAge: state.bgAge || undefined,
    bgHeight: state.bgHeight || undefined,
    bgWeight: state.bgWeight || undefined,
    bgEyes: state.bgEyes || undefined,
    bgSkin: state.bgSkin || undefined,
    bgHair: state.bgHair || undefined,
    bgNotes: state.bgNotes || undefined,
    xp: state.xp,
    progressionType: state.progressionType,
  };
};
