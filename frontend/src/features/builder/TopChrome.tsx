import { useState, useEffect, useRef } from 'react';
import { useBuilderStore } from '@/stores/builderStore';
import { useContentStore } from '@/stores/contentStore';

export function TopChrome() {
  const { preview, draft, setName } = useBuilderStore();
  const { classes: allClasses } = useContentStore();
  const totalLevel = draft.classes.reduce((sum, c) => sum + c.level, 0);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(draft.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  function handleStartEdit() {
    setEditName(draft.name);
    setIsEditing(true);
  }

  function handleFinishEdit() {
    setIsEditing(false);
    const trimmed = editName.trim();
    if (trimmed && trimmed !== draft.name) {
      setName(trimmed);
    } else if (!trimmed && draft.name) {
      setEditName(draft.name);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleFinishEdit();
    } else if (e.key === 'Escape') {
      setEditName(draft.name);
      setIsEditing(false);
    }
  }

  const maxHP = preview?.hp?.max ?? '—';
  const ac = preview?.ac ?? '—';
  const hitDice = draft.classes.map((c) => {
    const classDef = allClasses.find((cl) => cl.id === c.id);
    return classDef ? classDef.hitDie : '?';
  }).join(' / ');

  if (!draft.name && draft.classes.length === 0) return null;

  return (
    <header className="bg-stone-900/95 backdrop-blur-sm border-b border-stone-700 px-4 py-3">
      <div className="container mx-auto flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleFinishEdit}
              onKeyDown={handleKeyDown}
              className="font-heading text-xl text-white bg-stone-800 border border-stone-600 rounded px-2 py-1 outline-none focus:border-red-500 w-full max-w-xs"
              placeholder="Character name"
            />
          ) : (
            <h1
              className="font-heading text-xl text-white truncate cursor-pointer hover:text-red-400 transition-colors"
              onClick={handleStartEdit}
              title="Click to rename"
            >
              {draft.name || 'Unnamed Character'}
            </h1>
          )}
          <span className="px-3 py-1 bg-red-600 text-white text-sm font-label rounded-full">Level {totalLevel}</span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-stone-400">
            <span className="font-label text-white">HP:</span>
            <span className="text-lg font-bold text-white">{maxHP}</span>
          </div>
          <div className="flex items-center gap-2 text-stone-400">
            <span className="font-label text-white">AC:</span>
            <span className="text-lg font-bold text-white">{ac}</span>
          </div>
          <div className="flex items-center gap-2 text-stone-400">
            <span className="font-label text-white">Hit Dice:</span>
            <span className="font-mono text-white">{hitDice}</span>
          </div>

          {preview && preview.spellSlots && (
            <div className="flex items-center gap-2 text-stone-400">
              <span className="font-label text-white">Slots:</span>
              <span className="font-mono text-white text-xs">
                {Object.entries(preview.spellSlots)
                  .filter(([k]) => parseInt(k) > 0)
                  .map(([level, count]) => `L${level}:${count}`)
                  .join(' ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
