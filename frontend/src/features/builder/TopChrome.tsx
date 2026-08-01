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
    <header className="bg-[var(--bg-surface)]/95 backdrop-blur-sm border-b border-[var(--border)] px-4 py-3">
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
              className="font-heading text-xl text-[var(--text)] bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[var(--radius)] px-2 py-1 outline-none focus:border-[var(--red)] w-full max-w-xs"
              placeholder="Character name"
            />
          ) : (
            <h1
              className="font-heading text-xl text-[var(--text)] truncate cursor-pointer hover:text-[var(--red)] transition-colors"
              onClick={handleStartEdit}
              title="Click to rename"
            >
              {draft.name || 'Unnamed Character'}
            </h1>
          )}
          <span className="px-3 py-1 bg-[var(--red)] text-white text-sm font-label rounded-full">Level {totalLevel}</span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <span className="font-label text-[var(--text)]">HP:</span>
            <span className="text-lg font-bold text-[var(--text)]">{maxHP}</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <span className="font-label text-[var(--text)]">AC:</span>
            <span className="text-lg font-bold text-[var(--text)]">{ac}</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <span className="font-label text-[var(--text)]">Hit Dice:</span>
            <span className="font-mono text-[var(--text)]">{hitDice}</span>
          </div>

          {preview && preview.spellSlots && (
            <div className="flex items-center gap-2 text-[var(--text-muted)]">
              <span className="font-label text-[var(--text)]">Slots:</span>
              <span className="font-mono text-[var(--text)] text-xs">
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
