import { clsx } from 'clsx';

interface SkillSelectorProps {
  skills: Array<{ id: string; name: string; ability: string }>;
  selected: string[];
  onChange: (skills: string[]) => void;
  maxSelections: number;
  pool: string[];
  errors?: string;
}

const abilityNames: Record<string, string> = {
  STR: 'Strength', DEX: 'Dexterity', CON: 'Constitution',
  INT: 'Intelligence', WIS: 'Wisdom', CHA: 'Charisma',
};

export function SkillSelector({ skills, selected, onChange, maxSelections, pool, errors }: SkillSelectorProps) {
  const available = skills.filter(s => pool.includes(s.id));
  
  const toggle = (skillId: string) => {
    const next = selected.includes(skillId)
      ? selected.filter(s => s !== skillId)
      : selected.length < maxSelections
        ? [...selected, skillId]
        : selected;
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="label mb-0">Skills</label>
        <div className={clsx(
          'text-sm font-mono px-2 py-0.5 rounded',
          selected.length >= maxSelections ? 'bg-dnd-blood-100 text-dnd-blood-700 dark:bg-dnd-blood-900/30 dark:text-dnd-blood-300' : 'bg-dnd-stone-100 text-dnd-stone-700 dark:bg-dnd-stone-800 dark:text-dnd-stone-300'
        )}>
          {selected.length} / {maxSelections}
        </div>
      </div>

      {errors && <p className="text-sm text-red-600 dark:text-red-400">{errors}</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto scrollbar-thin">
        {available.map(skill => {
          const isSelected = selected.includes(skill.id);
          const isDisabled = !isSelected && selected.length >= maxSelections;
          
          return (
            <label
              key={skill.id}
              className={clsx(
                'flex items-center gap-2 p-2 rounded-lg border transition-all duration-150 cursor-pointer',
                isSelected
                  ? 'bg-dnd-blood-50 dark:bg-dnd-blood-900/30 border-dnd-blood-300 dark:border-dnd-blood-700'
                  : 'bg-white dark:bg-dnd-stone-800 border-dnd-stone-200 dark:border-dnd-stone-700 hover:border-dnd-stone-300 dark:hover:border-dnd-stone-600',
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => !isDisabled && toggle(skill.id)}
                disabled={isDisabled}
                className={clsx(
                  'w-4 h-4 rounded border-dnd-stone-300 text-dnd-blood-600',
                  'focus:ring-2 focus:ring-dnd-blood-500 focus:ring-offset-2',
                  'disabled:opacity-50'
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{skill.name}</div>
                <div className="text-xs text-dnd-stone-500 dark:text-dnd-stone-400 capitalize">
                  {abilityNames[skill.ability] || skill.ability}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {selected.length < maxSelections && (
        <p className="text-sm text-dnd-stone-500 dark:text-dnd-stone-400 text-center">
          Select {maxSelections - selected.length} more skill{maxSelections - selected.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}