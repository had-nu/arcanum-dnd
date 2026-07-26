import { clsx } from 'clsx';

export interface ChevronProps {
  direction?: 'left' | 'right' | 'up' | 'down';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Chevron({ direction = 'right', size = 'md', className = '' }: ChevronProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const rotateClasses = {
    left: 'rotate-180',
    right: '',
    up: '-rotate-90',
    down: 'rotate-90',
  };

  return (
    <svg
      className={clsx(sizeClasses[size], rotateClasses[direction], 'text-dnd-text-muted', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}