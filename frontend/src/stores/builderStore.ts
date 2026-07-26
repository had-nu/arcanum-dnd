import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { BuildRequest, AbilityScores, CharacterSheet, BuildResponse, ClassEntry, SubClassEntry, ClassReq } from '@/api/endpoints/generated';
import { useContentStore } from './contentStore';

interface ChoicePoint {
  type: 'subclass' | 'spell' | 'ability-improvement';
  classId?: string;
  level: number;
  name: string;
  description: string;
  options: Array<{ id: string; name: string; description: string }>;
}

interface ClassWithSubclass extends ClassReq {
  subclassId?: string;
}

interface DraftWithSubclass extends Omit<BuildRequest, 'classes'> {
  classes: ClassWithSubclass[];
}

interface BuilderStore {
  draft: DraftWithSubclass;
  preview: CharacterSheet | null;
  pendingChoices: ChoicePoint[];
  debounceTimer: ReturnType<typeof setTimeout> | null;

  setName: (name: string) => void;
  addClass: (classId: string) => void;
  setClassLevel: (classId: string, level: number) => void;
  removeClass: (classId: string) => void;
  setSubclass: (classId: string, subclassId: string | undefined) => void;
  setBackground: (backgroundId: string) => void;
  setSpecies: (speciesId: string, variant?: string) => void;
  setAbilityScore: (ability: keyof AbilityScores, value: number) => void;
  setAbilityMethod: (method: BuildRequest['abilityMethod']) => void;
  toggleSkill: (skillId: string) => void;
  addPreparedSpell: (spellId: string) => void;
  removePreparedSpell: (spellId: string) => void;
  addFeat: (featId: string) => void;
  removeFeat: (featId: string) => void;

  requestPreview: () => void;
  cancelPreview: () => void;
  save: () => Promise<void>;
  reset: () => void;
  loadFromCharacter: (character: any) => void;
  deriveChoices: (classesData: ClassEntry[]) => void;
}

const defaultAbilities: AbilityScores = { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 };

const initialDraft: DraftWithSubclass = {
  name: '',
  classes: [],
  backgroundId: '',
  speciesId: '',
  speciesVariant: undefined,
  level: 1,
  abilityScores: defaultAbilities,
  abilityMethod: 'standard',
  skills: [],
  spells: [],
  feats: [],
};

export const useBuilderStore = create<BuilderStore>()(
  devtools(
    persist(
      (set, get) => ({
        draft: initialDraft,
        preview: null,
        pendingChoices: [],
        debounceTimer: null,

        setName: (name) => set((state) => ({ draft: { ...state.draft, name } })),
        addClass: (classId) =>
          set((state) => ({
            draft: { ...state.draft, classes: [...state.draft.classes, { id: classId, level: 1 }] },
          })),
        setClassLevel: (classId, level) =>
          set((state) => ({
            draft: {
              ...state.draft,
              classes: state.draft.classes.map((c) => (c.id === classId ? { ...c, level } : c)),
            },
          })),
        removeClass: (classId) =>
          set((state) => ({
            draft: { ...state.draft, classes: state.draft.classes.filter((c) => c.id !== classId) },
          })),
        setSubclass: (classId, subclassId) =>
          set((state) => ({
            draft: {
              ...state.draft,
              classes: state.draft.classes.map((c) =>
                c.id === classId ? { ...c, subclassId } : c
              ),
            },
          })),
        setBackground: (backgroundId) => set((state) => ({ draft: { ...state.draft, backgroundId } })),
        setSpecies: (speciesId, variant) =>
          set((state) => ({ draft: { ...state.draft, speciesId, speciesVariant: variant } })),
        setAbilityScore: (ability, value) =>
          set((state) => ({
            draft: { ...state.draft, abilityScores: { ...state.draft.abilityScores, [ability]: value } },
          })),
        setAbilityMethod: (abilityMethod) => set((state) => ({ draft: { ...state.draft, abilityMethod } })),
        toggleSkill: (skillId) =>
          set((state) => {
            const skills = state.draft.skills ?? [];
            return {
              draft: {
                ...state.draft,
                skills: skills.includes(skillId)
                  ? skills.filter((s) => s !== skillId)
                  : [...skills, skillId],
              },
            };
          }),
        addPreparedSpell: (spellId) =>
          set((state) => ({
            draft: { ...state.draft, spells: [...(state.draft.spells ?? []), spellId] },
          })),
        removePreparedSpell: (spellId) =>
          set((state) => ({
            draft: { ...state.draft, spells: (state.draft.spells ?? []).filter((s) => s !== spellId) },
          })),
        addFeat: (featId) =>
          set((state) => ({
            draft: { ...state.draft, feats: [...(state.draft.feats ?? []), featId] },
          })),
        removeFeat: (featId) =>
          set((state) => ({
            draft: { ...state.draft, feats: (state.draft.feats ?? []).filter((f) => f !== featId) },
          })),

        requestPreview: () => {
          const { debounceTimer } = get();
          if (debounceTimer) clearTimeout(debounceTimer);

          const timer = setTimeout(async () => {
            const { draft } = get();
            if (!draft.name || draft.classes.length === 0 || !draft.backgroundId || !draft.speciesId) {
              set({ preview: null });
              return;
            }

            try {
              const response = await fetch('/api/build', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(draft),
              });
              if (!response.ok) throw new Error('Build failed');
              const data: BuildResponse = await response.json();
              set({ preview: data.sheet ?? null });
              const { classes: allClasses } = useContentStore.getState();
              get().deriveChoices(allClasses);
            } catch (error) {
              console.error('Preview error:', error);
              set({ preview: null });
            }
          }, 300);

          set({ debounceTimer: timer });
        },

        cancelPreview: () => {
          const { debounceTimer } = get();
          if (debounceTimer) clearTimeout(debounceTimer);
          set({ debounceTimer: null });
        },

        deriveChoices: (classesData: ClassEntry[]) => {
          const { draft, preview } = get();
          if (!preview) return;

          const choices: ChoicePoint[] = [];

          for (const cls of draft.classes) {
            const classDef = classesData.find((c) => c.id === cls.id);
            if (!classDef) continue;

            if (classDef.subclassLevel && cls.level >= classDef.subclassLevel && !cls.subclassId) {
              choices.push({
                type: 'subclass',
                classId: cls.id,
                level: classDef.subclassLevel,
                name: 'Choose Subclass',
                description: `Select a subclass for ${classDef.name}`,
                options: (classDef.subClasses ?? []).map((sc: SubClassEntry) => ({
                  id: sc.id ?? '',
                  name: sc.name ?? '',
                  description: sc.description ?? '',
                })),
              });
            }

            if (classDef.spellcaster) {
              const spellcasting = classDef.spellcasting;
              if (spellcasting?.preparedSpells && spellcasting.preparedSpells[cls.level - 1]) {
                const maxPrepared = spellcasting.preparedSpells[cls.level - 1];
                const currentPrepared = preview.spells?.length ?? 0;
                if (currentPrepared < maxPrepared) {
                  choices.push({
                    type: 'spell',
                    classId: cls.id,
                    level: cls.level,
                    name: 'Prepare Spells',
                    description: `Choose ${maxPrepared - currentPrepared} more prepared spells`,
                    options: [],
                  });
                }
              }
            }
          }

          if (preview.level && preview.level >= 4 && preview.level % 4 === 0) {
            choices.push({
              type: 'ability-improvement',
              level: preview.level,
              name: 'Ability Score Improvement',
              description: 'Increase one ability by 2, or two abilities by 1, or choose a feat',
              options: [],
            });
          }

          set({ pendingChoices: choices });
        },

        save: async () => {
          const { draft, preview } = get();
          if (!draft.name || !preview) return;

          const saveRequest = {
            name: draft.name,
            classes: draft.classes.map((c) => ({ id: c.id, level: c.level, subclassId: c.subclassId })),
            backgroundId: draft.backgroundId,
            speciesId: draft.speciesId,
            speciesVariant: draft.speciesVariant,
            level: draft.classes.reduce((sum, c) => sum + c.level, 0),
            abilityMethod: draft.abilityMethod,
            abilities: draft.abilityScores,
            skills: draft.skills,
            spells: draft.spells,
            feats: draft.feats,
            equipment: [],
            progressionType: 'milestone' as const,
          };

          const response = await fetch('/api/characters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saveRequest),
          });

          if (!response.ok) throw new Error('Save failed');
        },

        reset: () => set({ draft: initialDraft, preview: null, pendingChoices: [] }),

        loadFromCharacter: (character) => {
          set({
            draft: {
              name: character.name || '',
              classes: (character.classes || []).map((c: any) => ({ id: c.id, level: c.level, subclassId: c.subclassId })),
              backgroundId: character.backgroundId || '',
              speciesId: character.speciesId || '',
              speciesVariant: character.speciesVariant,
              level: character.level || 1,
              abilityScores: character.abilities || defaultAbilities,
              abilityMethod: character.abilityMethod as BuildRequest['abilityMethod'] || 'standard',
              skills: character.skills || [],
              spells: character.spells || [],
              feats: character.feats || [],
            },
            preview: null,
            pendingChoices: [],
          });
        },
      }),
      {
        name: 'arcanum-builder',
        partialize: (state) => ({ draft: state.draft }),
      }
    ),
    { name: 'builder-store' }
  )
);