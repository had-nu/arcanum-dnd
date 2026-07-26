import { clsx } from 'clsx';

export interface ClassGlyphProps {
  classId: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export function ClassGlyph({ classId, size = 'md', className = '' }: ClassGlyphProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-center bg-dnd-bg-input rounded-md overflow-hidden',
        SIZE_CLASSES[size],
        className
      )}
      aria-label={classId}
    >
      <img
        src={`/img/classes/${classId}.svg`}
        alt={classId}
        className="w-full h-full object-contain"
      />
    </div>
  );
}