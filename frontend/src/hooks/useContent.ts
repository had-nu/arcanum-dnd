import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { SaveCharacterRequest } from '@/types/api';

export function useContent() {
  return useQuery({
    queryKey: ['content'],
    queryFn: () => api.getContent(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useSpells(classId?: string, level?: number, charLevel?: number) {
  return useQuery({
    queryKey: ['spells', classId, level, charLevel],
    queryFn: () => api.getSpells({ class: classId, level, lvl: charLevel }),
    enabled: !!classId || !!level,
    staleTime: 1000 * 60 * 5,
  });
}

export function useBuild() {
  return useMutation({
    mutationFn: (payload: any) => api.buildCharacter(payload),
  });
}

export function useCharacters() {
  return useQuery({
    queryKey: ['characters'],
    queryFn: () => api.listCharacters(),
  });
}

export function useCharacter(name: string) {
  return useQuery({
    queryKey: ['character', name],
    queryFn: () => api.getCharacter(name),
    enabled: !!name,
  });
}

export function useSaveCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveCharacterRequest) => api.saveCharacter(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}

export function useUpdateCharacter(name: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveCharacterRequest) => api.updateCharacter(name, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['character', name] });
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => api.deleteCharacter(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}
