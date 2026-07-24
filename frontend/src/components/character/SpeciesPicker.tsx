import { clsx } from 'clsx';

interface SpeciesPickerProps {
  species: any[];
  value: string;
  onChange: (id: string) => void;
  variant: string;
  onVariantChange: (id: string) => void;
  errors?: string;
}

export function SpeciesPicker({ species, value, onChange, variant, onVariantChange, errors }: SpeciesPickerProps) {
  const selected = species.find(s => s.id === value);
  const variants = selected?.variants || [];

  return (
    <div>
      <label className="label">Species</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input"
      >
        <option value="">Select species</option>
        {species.map(s => (
          <option key={s.id} value={s.id}>{s.name} ({s.size}, Speed {s.speed}ft)</option>
        ))}
      </select>
      {errors && <p className="mt-1 text-sm text-red-600">{errors}</p>}

      {variants.length > 0 && (
        <div className="mt-4">
          <label className="label">Variant / Subrace</label>
          <select
            value={variant}
            onChange={e => onVariantChange(e.target.value)}
            className="input"
          >
            <option value="">— None —</option>
            {variants.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
      )}

      {selected && (
        <div className="mt-3 p-3 bg-dnd-stone-50 dark:bg-dnd-stone-800/50 rounded-lg text-sm text-dnd-stone-700 dark:text-dnd-stone-300">
          <strong>Size:</strong> {selected.size} • <strong>Speed:</strong> {selected.speed}ft
        </div>
      )}
    </div>
  );
}