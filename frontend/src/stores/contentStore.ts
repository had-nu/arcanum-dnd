import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ContentResponse, ClassEntry, SpeciesEntry, BackgroundEntry, FeatEntry, SkillEntry, AbilityEntry } from '@/api/endpoints/generated';

interface ContentStore {
  classes: ClassEntry[];
  species: SpeciesEntry[];
  backgrounds: BackgroundEntry[];
  feats: Record<string, FeatEntry>;
  skills: SkillEntry[];
  abilities: AbilityEntry[];
  spellCasterClasses: string[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
}

export const useContentStore = create<ContentStore>()(
  devtools(
    (set, get) => ({
      classes: [],
      species: [],
      backgrounds: [],
      feats: {},
      skills: [],
      abilities: [],
      spellCasterClasses: [],
      loaded: false,
      loading: false,
      error: null,

      load: async () => {
        if (get().loaded || get().loading) return;

        set({ loading: true, error: null });

        try {
          const response = await fetch('/api/content');
          if (!response.ok) throw new Error('Failed to fetch content');

          const data: ContentResponse = await response.json();

          set({
            classes: data.classes ?? [],
            species: data.species ?? [],
            backgrounds: data.backgrounds ?? [],
            feats: data.feats ?? {},
            skills: data.skills ?? [],
            abilities: data.abilities ?? [],
            spellCasterClasses: data.spellCasterClasses ?? [],
            loaded: true,
            loading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: false,
          });
        }
      },
    }),
    { name: 'content-store' }
  )
);