import { clsx } from 'clsx';

interface SpellSelectorProps {
  classId: string;
  spells: any;
  value: string[];
  onChange: (value: string[]) => void;
  level: number;
}

export function SpellSelector({ classId, spells, value, onChange, level }: SpellSelectorProps) {
  const classSpells = classId ? spells.leveled.flat() : [];
  const available = classSpells.filter(s => s.level <= Math.max(1, Math.floor((level + 1) / 2)));

  const maxSpells = Math.max(1, level); // simplified

  const toggle = (spellId: string) => {
    const next = value.includes(spellId)
      ? value.filter(id => id !== spellId)
      : [...value, spellId];
    onChange(next);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Spells</CardTitle>
        <CardDescription>Select spells known/prepared</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={clsx(
          'text-sm font-mono px-2 py-1 rounded',
          value.length >= maxSpells ? 'bg-dnd-blood-100 text-dnd-blood-700' : 'bg-dnd-stone-100 text-dnd-stone-700'
        )}>
          {value.length} / {maxSpells} spells
        </div>

        {available.length === 0 && (
          <p className="text-sm text-dnd-stone-500 dark:text-dnd-stone-400 text-center py-8">
            No spells available for this class/level
          </p>
        )}

        <div className="max-h-96 overflow-y-auto scrollbar-thin">
          {available.map(spell => (
            <label
              key={spell.id}
              className={clsx(
                'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                value.includes(spell.id)
                  ? 'bg-dnd-blood-50 dark:bg-dnd-blood-900/30 border-dnd-blood-300'
                  : 'bg-white dark:bg-dnd-stone-800 border-dnd-stone-200 dark:border-dnd-stone-700 hover:border-dnd-stone-300'
              )}
            >
              <input
                type="checkbox"
                checked={value.includes(spell.id)}
                onChange={() => toggle(spell.id)}
                disabled={!value.includes(spell.id) && value.length >= maxSpells}
                className="w-4 h-4 rounded border-dnd-stone-300 text-dnd-blood-600 focus:ring-dnd-blood-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{spell.name}</span>
                  <span className="badge badge-secondary text-xs">
                    Level {spell.level} {spell.school}
                  </span>
                  {spell.ritual && <span className="badge badge-secondary text-xs">Ritual</span>}
                  {spell.concentration && <span className="badge badge-secondary text-xs">Conc.</span>}
                </div>
                <div className="text-xs text-dnd-stone-500 dark:text-dnd-stone-400">
                  {spell.time} • {spell.range} • {spell.duration}
                </div>
              </div>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}