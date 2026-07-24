import { clsx } from 'clsx';
import { Slot } from '@radix-ui/react-slot';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  asChild?: boolean;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading,
  asChild,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';

  const variants = {
    primary: 'bg-dnd-blood-600 text-white hover:bg-dnd-blood-700 active:bg-dnd-blood-800 focus-visible:ring-dnd-blood-500',
    secondary: 'bg-dnd-stone-100 text-dnd-stone-900 hover:bg-dnd-stone-200 active:bg-dnd-stone-300 focus-visible:ring-dnd-stone-400 dark:bg-dnd-stone-800 dark:text-dnd-stone-100 dark:hover:bg-dnd-stone-700',
    outline: 'border-2 border-dnd-stone-300 bg-transparent hover:bg-dnd-stone-100 active:bg-dnd-stone-200 focus-visible:ring-dnd-stone-400 dark:border-dnd-stone-600 dark:hover:bg-dnd-stone-800',
    ghost: 'bg-transparent hover:bg-dnd-stone-100 active:bg-dnd-stone-200 focus-visible:ring-dnd-stone-400 dark:hover:bg-dnd-stone-800',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <Comp
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium rounded-lg',
        'transition-all duration-150',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-dnd-parchment dark:focus-visible:ring-offset-dnd-stone-950',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </Comp>
  );
}