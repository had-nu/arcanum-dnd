import { clsx } from 'clsx';

interface BackgroundPickerProps {
  backgrounds: any[];
  value: string;
  onChange: (id: string) => void;
  errors?: string;
}

export function BackgroundPicker({ backgrounds, value, onChange, errors }: BackgroundPickerProps) {
  const selected = backgrounds.find(b => b.id === value);

  return (
    <div>
      <label className="label">Background</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input"
      >
        <option value="">Select background</option>
        {backgrounds.map(b => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
      {errors && <p className="mt-1 text-sm text-red-600">{errors}</p>}

      {selected && (
        <div className="mt-3 p-3 bg-dnd-stone-50 dark:bg-dnd-stone-800/50 rounded-lg text-sm text-dnd-stone-700 dark:text-dnd-stone-300">
          <strong>Skills:</strong> {selected.skills?.join(', ') || '—'}
          {selected.feat && <span className="ml-2"><strong>Feat:</strong> {selected.feat}</span>}
        </div>
      )}
    </div>
  );
}