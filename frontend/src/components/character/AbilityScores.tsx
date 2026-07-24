import { clsx } from 'clsx';

interface AbilityScoresProps {
  scores: { value: { STR: number; DEX: number; CON: number; INT: number; WIS: number; CHA: number } };
  onChange: (scores: { STR: number; DEX: number; CON: number; INT: number; WIS: number; CHA: number }) => void;
  method: 'standard' | 'point-buy' | 'roll';
  onMethodChange: (method: 'standard' | 'point-buy' | 'roll') => void;
}

export function AbilityScores({ scores, onChange, method, onMethodChange }: AbilityScoresProps) {
  const abilities = [
    { key: 'STR', label: 'Strength', abbr: 'STR' },
    { key: 'DEX', label: 'Dexterity', abbr: 'DEX' },
    { key: 'CON', label: 'Constitution', abbr: 'CON' },
    { key: 'INT', label: 'Intelligence', abbr: 'INT' },
    { key: 'WIS', label: 'Wisdom', abbr: 'WIS' },
    { key: 'CHA', label: 'Charisma', abbr: 'CHA' },
  ] as const;

  const pointBuyCosts: Record<number, number> = {
    8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
  };

  const calculatePoints = (vals: typeof scores.value) => {
    return Object.values(vals).reduce((sum, v) => sum + (pointBuyCosts[v] || 0), 0);
  };

  const pointsUsed = method === 'point-buy' ? calculatePoints(scores.value) : 0;
  const pointsRemaining = method === 'point-buy' ? 27 - pointsUsed : null;

  const mod = (score: number) => Math.floor((score - 10) / 2);
  const modStr = (score: number) => {
    const m = mod(score);
    return m >= 0 ? `+${m}` : String(m);
  };

  const handleChange = (key: string, delta: number) => {
    const current = scores.value[key as keyof typeof scores.value];
    let next = current + delta;
    
    if (method === 'point-buy') {
      next = Math.max(8, Math.min(15, next));
      const newScores = { ...scores.value, [key]: next };
      if (calculatePoints(newScores) > 27) return;
    } else {
      next = Math.max(3, Math.min(20, next));
    }
    
    onChange({ ...scores.value, [key]: next });
  };

  const handleInputChange = (key: string, value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    
    let next = Math.max(3, Math.min(20, num));
    
    if (method === 'point-buy') {
      next = Math.max(8, Math.min(15, next));
      const newScores = { ...scores.value, [key]: next };
      if (calculatePoints(newScores) > 27) return;
    }
    
    onChange({ ...scores.value, [key]: next });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onMethodChange(e.currentTarget.value as 'standard' | 'point-buy' | 'roll');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-dnd-stone-900 dark:text-dnd-stone-100">Ability Scores</h3>
        <div className="flex items-center gap-2">
          <select
            value={method}
            onChange={handleSelectChange}
            className="input w-auto px-3 py-1.5 text-sm"
          >
            <option value="standard">Standard Array</option>
            <option value="point-buy">Point Buy (27 pts)</option>
            <option value="roll">Manual/Rolled</option>
          </select>
          {method === 'point-buy' && (
            <span className={clsx(
              'text-sm font-mono px-2 py-1 rounded bg-dnd-stone-100 dark:bg-dnd-stone-800',
              pointsRemaining !== null && pointsRemaining < 0 ? 'text-red-600' : 'text-dnd-stone-700 dark:text-dnd-stone-300'
            )}>
              {pointsRemaining} pts left
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
{abilities.map(({ key, label, abbr }) => {
            const value = scores.value[key];
            
            return (
            <div key={key} className="ability-score bg-dnd-stone-50 dark:bg-dnd-stone-800/50 rounded-xl border border-dnd-stone-200 dark:border-dnd-stone-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="ability-label text-xs font-semibold uppercase tracking-wider text-dnd-stone-500 dark:text-dnd-stone-400">
                  {label}
                </span>
                <span className="text-xs text-dnd-stone-400 dark:text-dnd-stone-500">{abbr}</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => handleChange(key, -1)}
                  disabled={method === 'point-buy' && (value <= 8 || pointsRemaining === 0)}
                  className={clsx(
                    'w-10 h-10 rounded-lg flex items-center justify-center text-lg font-medium transition-colors',
                    'hover:bg-dnd-stone-200 dark:hover:bg-dnd-stone-700',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                  aria-label={`Decrease ${label}`}
                >
                  −
                </button>
                <div className="text-center min-w-[60px]">
<input
                    type="number"
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(key, e.currentTarget.value)}
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => handleInputChange(key, e.currentTarget.value)}
                    className="ability-value w-full text-center text-3xl font-bold text-dnd-stone-900 dark:text-dnd-stone-100 bg-transparent border-0 focus:outline-none focus:ring-0"
                    min={method === 'point-buy' ? 8 : 3}
                    max={method === 'point-buy' ? 15 : 20}
                    aria-label={`${label} score`}
                  />
                  <div className="ability-mod text-lg font-medium text-dnd-blood-600 dark:text-dnd-blood-400 mt-1">
                    {modStr(value)}
                  </div>
                </div>
                <button
                  onClick={() => handleChange(key, 1)}
                  disabled={method === 'point-buy' && (value >= 15 || pointsRemaining === 0)}
                  className={clsx(
                    'w-10 h-10 rounded-lg flex items-center justify-center text-lg font-medium transition-colors',
                    'hover:bg-dnd-stone-200 dark:hover:bg-dnd-stone-700',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                  aria-label={`Increase ${label}`}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {method === 'standard' && (
        <p className="text-sm text-dnd-stone-500 dark:text-dnd-stone-400 text-center">
          Standard Array: 15, 14, 13, 12, 10, 8 — assign as desired
        </p>
      )}

      {method === 'point-buy' && pointsRemaining !== null && pointsRemaining < 0 && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center">
          Exceeded point budget! Reduce some scores.
        </p>
      )}
    </div>
  );
}