import { clsx } from 'clsx';

export interface LevelSelectProps {
  value?: number;
  level?: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function LevelSelect({ value, level, onChange, min = 1, max = 20, className = '' }: LevelSelectProps) {
  const currentValue = value ?? level ?? min;
  return (
    <select
      value={currentValue}
      onChange={(e) => onChange(parseInt(e.target.value, 10))}
      className={clsx(
        'px-2 py-1 bg-stone-900 border border-stone-700 text-white rounded-md',
        'focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent',
        'text-sm',
        className
      )}
    >
      {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((lvl) => (
        <option key={lvl} value={lvl}>
          {lvl}
        </option>
      ))}
    </select>
  );
}