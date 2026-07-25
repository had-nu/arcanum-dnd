import { clsx } from 'clsx';
import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'parchment' | 'stone';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ 
  className, 
  variant = 'parchment', 
  padding = 'md', 
  children, 
  ...props 
}: CardProps) {
  const variants = {
    default: 'bg-white dark:bg-dnd-stone-800 border-dnd-stone-200 dark:border-dnd-stone-700',
    parchment: 'bg-dnd-parchment-100 dark:bg-dnd-parchment-900 border-dnd-parchment-300 dark:border-dnd-parchment-700',
    stone: 'bg-dnd-stone-100 dark:bg-dnd-stone-800 border-dnd-stone-300 dark:border-dnd-stone-600',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={clsx(
        'rounded-xl border shadow-sm',
        variants[variant],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('mb-4 border-b border-dnd-stone-200 dark:border-dnd-stone-700 pb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={clsx('text-xl font-bold text-dnd-stone-900 dark:text-dnd-stone-100', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={clsx('text-dnd-stone-600 dark:text-dnd-stone-400 mt-1', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('mt-4 border-t border-dnd-stone-200 dark:border-dnd-stone-700 pt-4 flex items-center gap-3', className)} {...props}>
      {children}
    </div>
  );
}