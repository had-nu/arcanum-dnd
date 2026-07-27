import {
  type ContentResponse,
  type SpellsResponse,
  type BuildResponse,
  type BuildRequest,
  type CharacterSummary,
  type SavedCharacter,
  type SaveCharacterRequest,
  type GetSpellsParams,
} from './endpoints/generated';

import type { FeaturesResponse } from '@/types/api';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function fetchWithBase<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  getContent: () => fetchWithBase<ContentResponse>('/content'),

  getSpells: (params?: GetSpellsParams) => {
    const searchParams = new URLSearchParams();
    if (params?.class) searchParams.set('class', params.class);
    if (params?.level) searchParams.set('level', String(params.level));
    if (params?.lvl) searchParams.set('lvl', String(params.lvl));
    const query = searchParams.toString();
    return fetchWithBase<SpellsResponse>(`/spells${query ? `?${query}` : ''}`);
  },

  buildCharacter: (payload: BuildRequest) =>
    fetchWithBase<BuildResponse>('/build', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listCharacters: () => fetchWithBase<CharacterSummary[]>('/characters'),

  getCharacter: (name: string) =>
    fetchWithBase<SavedCharacter>(`/characters/${encodeURIComponent(name)}`),

  saveCharacter: (payload: SaveCharacterRequest) =>
    fetchWithBase<SavedCharacter>('/characters', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateCharacter: (name: string, payload: SaveCharacterRequest) =>
    fetchWithBase<SavedCharacter>(`/characters/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteCharacter: (name: string) =>
    fetchWithBase<void>(`/characters/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    }),

  getFeatures: (classId: string, subclassId?: string) => {
    let url = `/features/${encodeURIComponent(classId)}`;
    if (subclassId) url += `?subclassId=${encodeURIComponent(subclassId)}`;
    return fetchWithBase<FeaturesResponse>(url);
  },

  health: () =>
    fetchWithBase<{ status: string; version: string; timestamp: string }>('/health'),
};

export type {
  ContentResponse,
  SpellsResponse,
  BuildResponse,
  BuildRequest,
  CharacterSummary,
  SavedCharacter,
  SaveCharacterRequest,
  GetSpellsParams,
  FeaturesResponse,
};