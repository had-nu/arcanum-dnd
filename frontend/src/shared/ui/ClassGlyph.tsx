import { clsx } from 'clsx';

export interface ClassGlyphProps {
  classId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const CLASS_FALLBACKS: Record<string, string> = {
  barbarian: '🪓',
  bard: '🎭',
  cleric: '⚖️',
  druid: '🌿',
  fighter: '⚔️',
  monk: '👊',
  paladin: '🛡️',
  ranger: '🏹',
  rogue: '🗡️',
  sorcerer: '🔥',
  warlock: '👁️',
  wizard: '📜',
};

const SIZE_CLASSES = {
  sm: 'w-6 h-6 text-lg',
  md: 'w-10 h-10 text-2xl',
  lg: 'w-12 h-12 text-3xl',
  xl: 'w-16 h-16 text-4xl',
};

export function ClassGlyph({ classId, size = 'md', className = '' }: ClassGlyphProps) {
  const normalizedId = classId.toLowerCase();
  const fallback = CLASS_FALLBACKS[normalizedId] || '🎲';

  return (
    <div
      className={clsx(
        'relative flex items-center justify-center bg-dnd-bg-input rounded-md overflow-hidden',
        SIZE_CLASSES[size],
        className
      )}
      aria-label={classId}
    >
      <img
        src={`/img/classes/${classId}.svg`}
        alt={classId}
        className="w-full h-full object-contain"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        {fallback}
      </span>
    </div>
  );
}