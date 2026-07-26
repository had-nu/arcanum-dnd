import { useState, useCallback } from 'react';
import { useBuilderStore } from '@/stores/builderStore';
import { api } from '@/api/endpoints';
import type { ClassEntry } from '@/api/endpoints/generated';
import { Button, Input, Card } from '@/shared/ui';

interface SpellManagerProps {
  classData: { id: string; level: number };
  classDef: ClassEntry;
  preview: any;
}

interface SpellWithLevel {
  id: string;
  name: string;
  level: number;
}

export function SpellManager({ classData, classDef, preview }: SpellManagerProps) {
  const { draft, addPreparedSpell, removePreparedSpell } = useBuilderStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [spellLevelFilter, setSpellLevelFilter] = useState<string>('all');
  const [availableSpells, setAvailableSpells] = useState<SpellWithLevel[]>([]);
  const [isLoadingSpells, setIsLoadingSpells] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const preparedSpells = (draft.spells ?? []).filter((s) =>
    availableSpells.some((sp) => sp.id === s)
  );

  const maxPrepared = getMaxPreparedSpells(classData.level, classDef);
  const preparedCount = preparedSpells.length;

  const fetchSpells = useCallback(async () => {
    if (!classDef.spellcaster || !classDef.id) return;
    setIsLoadingSpells(true);
    try {
      const response = await api.getSpells({ class: classDef.id, lvl: classData.level });
      const all: SpellWithLevel[] = [
        ...(response.cantrips?.map((s) => ({ id: s.id!, name: s.name!, level: 0 })) || []),
        ...(response.leveled?.flatMap((level, i) =>
          level.map((s) => ({ id: s.id!, name: s.name!, level: i + 1 }))
        ) || []),
      ];
      setAvailableSpells(all);
    } catch (error) {
      console.error('Failed to fetch spells:', error);
    } finally {
      setIsLoadingSpells(false);
    }
  }, [classDef.id, classData.level]);

  if (typeof window !== 'undefined' && !availableSpells.length) {
    fetchSpells();
  }

  const filteredSpells = availableSpells.filter((spell) => {
    const matchesSearch = spell.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = spellLevelFilter === 'all' || spell.level === parseInt(spellLevelFilter);
    const notPrepared = !preparedSpells.some((ps) => ps === spell.id);
    return matchesSearch && matchesLevel && notPrepared;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-label text-lg text-white">Prepared Spells ({preparedCount}/{maxPrepared})</h3>
          <p className="text-sm text-stone-400">
            Cantrips known: {getCantripsKnown(classData.level, classDef)} · Spell slots: {getSpellSlotsSummary(preview)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowModal(true)}
          disabled={preparedCount >= maxPrepared}
        >
          Add Spells
        </Button>
      </div>

      <div className="prepared-spells-list space-y-2 max-h-60 overflow-y-auto">
        {preparedSpells.length === 0 ? (
          <p className="text-stone-500 text-center py-4">No spells prepared. Click "Add Spells" to choose.</p>
        ) : (
          preparedSpells.map((spellId) => {
            const spell = availableSpells.find((s) => s.id === spellId);
            return (
              <div key={spellId} className="flex items-center justify-between p-3 bg-stone-800/50 rounded-md">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs font-label rounded ${
                    spell?.level === 0 ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {spell?.level === 0 ? 'Cantrip' : `Lv.${spell?.level}`}
                  </span>
                  <span className="font-medium">{spell?.name}</span>
                </div>
                <Button variant="danger" size="sm" onClick={() => removePreparedSpell(spellId)}>Remove</Button>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80" onClick={() => setShowModal(false)} />
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden" variant="elevated">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl text-white">Add Spells</h3>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <Input
              placeholder="Search spells..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4"
            />

            <div className="mb-4">
              <select
                value={spellLevelFilter}
                onChange={(e) => setSpellLevelFilter(e.target.value)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">All Levels</option>
                <option value="0">Cantrips</option>
                {Array.from({ length: 9 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Level {i + 1}</option>
                ))}
              </select>
            </div>

            <div className="spells-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {isLoadingSpells ? (
                <div className="col-span-full text-center py-8 text-stone-400">Loading spells...</div>
              ) : filteredSpells.length === 0 ? (
                <div className="col-span-full text-center py-8 text-stone-400">No spells match your filters</div>
              ) : (
                filteredSpells.map((spell) => (
                  <button
                    key={spell.id}
                    onClick={() => {
                      addPreparedSpell(spell.id);
                      setShowModal(false);
                    }}
                    className="p-3 bg-stone-800/50 border border-stone-700 rounded-md text-left hover:border-red-500 hover:bg-stone-800 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 text-xs font-label rounded ${
                        spell.level === 0 ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {spell.level === 0 ? 'Cantrip' : `Lv.${spell.level}`}
                      </span>
                    </div>
                    <span className="font-medium">{spell.name}</span>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function getMaxPreparedSpells(level: number, classDef: ClassEntry): number {
  const spellcasting = classDef.spellcasting;
  if (!spellcasting?.preparedSpells) return 0;
  const idx = Math.min(level - 1, spellcasting.preparedSpells.length - 1);
  return spellcasting.preparedSpells[idx] || 0;
}

function getCantripsKnown(level: number, classDef: ClassEntry): number {
  const spellcasting = classDef.spellcasting;
  if (!spellcasting?.cantripsKnown) return 0;
  const idx = Math.min(level - 1, spellcasting.cantripsKnown.length - 1);
  return spellcasting.cantripsKnown[idx] || 0;
}

function getSpellSlotsSummary(preview: any): string {
  if (!preview?.spellSlots) return '—';
  const slots = Object.entries(preview.spellSlots)
    .filter(([k]) => parseInt(k) > 0)
    .map(([level, count]) => `L${level}:${count}`)
    .join(' ');
  return slots || '—';
}