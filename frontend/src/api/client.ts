import type { ContentResponse, SpellsResponse, BuildResponse, CharacterSummary, SavedCharacter, SaveCharacterRequest } from '@types/api';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
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
  getContent: () => fetchJSON<ContentResponse>(`${API_BASE}/content`),
  
  getSpells: (params?: { class?: string; level?: number; lvl?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.class) searchParams.set('class', params.class);
    if (params?.level) searchParams.set('level', String(params.level));
    if (params?.lvl) searchParams.set('lvl', String(params.lvl));
    return fetchJSON<SpellsResponse>(`${API_BASE}/spells?${searchParams}`);
  },
  
  buildCharacter: (payload: any) => 
    fetchJSON<BuildResponse>(`${API_BASE}/build`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  
  listCharacters: () => 
    fetchJSON<CharacterSummary[]>(`${API_BASE}/characters`),
  
  getCharacter: (name: string) => 
    fetchJSON<SavedCharacter>(`${API_BASE}/characters/${encodeURIComponent(name)}`),
  
  saveCharacter: (payload: SaveCharacterRequest) => 
    fetchJSON<SavedCharacter>(`${API_BASE}/characters`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  
  updateCharacter: (name: string, payload: SaveCharacterRequest) => 
    fetchJSON<SavedCharacter>(`${API_BASE}/characters/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  
  deleteCharacter: (name: string) => 
    fetchJSON<void>(`${API_BASE}/characters/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    }),
  
  health: () => 
    fetchJSON<{ status: string; version: string; timestamp: string }>(`${API_BASE}/health`),
};