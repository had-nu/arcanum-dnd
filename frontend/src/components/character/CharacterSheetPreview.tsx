import { clsx } from 'clsx';

interface CharacterSheetPreviewProps {
  character: any;
  content: any;
}

export function CharacterSheetPreview({ character, content }: CharacterSheetPreviewProps) {
  const classes = content?.classes || [];
  const species = content?.species || [];
  const backgrounds = content?.backgrounds || [];

  const classData = character.classes?.map((c: any) => {
    const cls = classes.find((cl: any) => cl.id === c.id);
    return { ...c, name: cls?.name || c.id, hitDie: cls?.hitDie };
  }) || [];

  const speciesData = species.find((s: any) => s.id === character.speciesId);
  const backgroundData = backgrounds.find((b: any) => b.id === character.backgroundId);

  const totalLevel = classData.reduce((sum: number, c: any) => sum + c.level, 0);

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin print-sheet">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-dnd-stone-300 dark:border-dnd-stone-600 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-dnd-stone-900 dark:text-dnd-stone-100 font-condensed">
            {character.name || 'Unnamed Character'}
          </h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-dnd-stone-600 dark:text-dnd-stone-400">
            <span>Level {totalLevel}</span>
            <span>•</span>
            <span>{classData.map((c: any) => `${c.name} ${c.level}`).join(' / ')}</span>
            <span>•</span>
            <span>{speciesData?.name || character.speciesId}</span>
            <span>•</span>
            <span>{backgroundData?.name || character.backgroundId}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-dnd-blood-600 dark:text-dnd-blood-400">
            AC {character.ac || 10}
          </div>
          <div className="text-sm text-dnd-stone-600 dark:text-dnd-stone-400">Armor Class</div>
        </div>
      </div>

      {/* Ability Scores */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(key => {
          const score = character.abilityScores?.[key] || 10;
          const mod = Math.floor((score - 10) / 2);
          return (
            <div key={key} className={clsx(
              'ability-score',
              mod >= 0 ? 'border-l-4 border-dnd-blood-500' : 'border-l-4 border-dnd-stone-400'
            )}>
              <div className="ability-label">{key}</div>
              <div className="ability-value">{score}</div>
              <div className="ability-mod">{mod >= 0 ? '+' : ''}{mod}</div>
            </div>
          );
        })}
      </div>

      {/* HP */}
      <div className="grid grid-cols-3 gap-3">
        <div className="ability-score border-l-4 border-green-500">
          <div className="ability-label">Max HP</div>
          <div className="ability-value">{character.hp?.max || '—'}</div>
        </div>
        <div className="ability-score border-l-4 border-blue-500">
          <div className="ability-label">Current HP</div>
          <div className="ability-value">{character.hp?.current || '—'}</div>
        </div>
        <div className="ability-score border-l-4 border-amber-500">
          <div className="ability-label">Temp HP</div>
          <div className="ability-value">{character.hp?.temp || 0}</div>
        </div>
      </div>

      {/* Saving Throws */}
      <div className="card p-4">
        <h3 className="font-semibold text-dnd-stone-900 dark:text-dnd-stone-100 mb-3">Saving Throws</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map(key => {
            const prof = character.savingThrows?.[key];
            const abilityMod = Math.floor(((character.abilityScores?.[key] || 10) - 10) / 2);
            const pb = Math.ceil((1 + totalLevel) / 4) + 1; // simplified
            const total = prof ? abilityMod + pb : abilityMod;
            return (
              <div key={key} className={clsx(
                'p-2 rounded text-center text-sm',
                prof ? 'bg-dnd-blood-50 dark:bg-dnd-blood-900/30 border border-dnd-blood-300' : ''
              )}>
                <div className="text-xs text-dnd-stone-500 dark:text-dnd-stone-400 uppercase">{key}</div>
                <div className="text-lg font-bold">{total >= 0 ? '+' : ''}{total}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skills */}
      <div className="card p-4">
        <h3 className="font-semibold text-dnd-stone-900 dark:text-dnd-stone-100 mb-3">Skills</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(character.skills || {}).map(([skill, mod]) => (
            <div key={skill} className={clsx(
              'p-2 rounded text-center text-sm',
              mod ? 'bg-dnd-gold-50 dark:bg-dnd-gold-900/30 border border-dnd-gold-300' : ''
            )}>
              <div className="text-xs text-dnd-stone-500 dark:text-dnd-stone-400 capitalize">{skill.replace(/_/g, ' ')}</div>
              <div className="font-bold">{mod >= 0 ? '+' : ''}{mod}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      {character.features?.length && (
        <div className="card p-4">
          <h3 className="font-semibold text-dnd-stone-900 dark:text-dnd-stone-100 mb-3">Features</h3>
          <div className="space-y-2">
            {character.features.map((f: any) => (
              <div key={f.id} className="p-2 bg-dnd-stone-50 dark:bg-dnd-stone-800/50 rounded">
                <div className="font-medium">{f.name}</div>
                <div className="text-sm text-dnd-stone-600 dark:text-dnd-stone-400">
                  Level {f.level} • {f.class}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spells */}
      {character.spells?.length && (
        <div className="card p-4">
          <h3 className="font-semibold text-dnd-stone-900 dark:text-dnd-stone-100 mb-3">
            Spells ({character.spells.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {character.spells.map((s: string) => (
              <span key={s} className="badge badge-secondary">{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}