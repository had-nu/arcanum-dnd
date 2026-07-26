import { create } from 'zustand';

type BuilderStep = 'class' | 'background' | 'species' | 'abilities' | 'equipment' | 'whatsnext';
type ClassTab = 'features' | 'spells' | 'optional-features';

interface WizardUIStore {
  activeStep: BuilderStep;
  activeClassTab: ClassTab;
  setActiveStep: (step: BuilderStep) => void;
  setActiveClassTab: (tab: ClassTab) => void;
  reset: () => void;
}

export const useWizardUIStore = create<WizardUIStore>((set) => ({
  activeStep: 'class',
  activeClassTab: 'features',
  setActiveStep: (step) => set({ activeStep: step }),
  setActiveClassTab: (tab) => set({ activeClassTab: tab }),
  reset: () => set({ activeStep: 'class', activeClassTab: 'features' }),
}));