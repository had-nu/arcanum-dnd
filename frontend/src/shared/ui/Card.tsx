"use client";

import React, { forwardRef, type HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'selected';
  selected?: boolean;
  onClick?: () => void;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', selected = false, onClick, children, ...props }, ref) => {
    const isInteractive = typeof onClick === 'function';

    const variantClasses = {
      default: 'bg-stone-900/50 border border-stone-700',
      elevated: 'bg-stone-900/50 border border-stone-700 hover:border-red-500 hover:bg-stone-800 hover:shadow-lg hover:shadow-red-500/10',
      selected: 'bg-stone-900/50 border-2 border-amber-500 shadow-lg shadow-amber-500/10',
    };

    return (
      <div
        ref={ref}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={onClick}
        onKeyDown={(e) => isInteractive && (e.key === 'Enter' || e.key === ' ') && onClick()}
        className={clsx(
          'relative rounded-lg p-4 transition-all duration-200',
          variantClasses[variant],
          isInteractive && 'cursor-pointer',
          selected && 'border-amber-500 shadow-lg shadow-amber-500/10',
          className
        )}
        {...props}
      >
        {selected && <span className="absolute top-2 right-2 text-amber-500 font-bold">✓</span>}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={clsx('font-label font-bold text-base text-white mb-2', className)}>
      {children}
    </h3>
  );
}

export function CardMeta({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={clsx('text-sm text-stone-400 leading-snug', className)}>{children}</p>;
}

export function CardTags({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('flex flex-wrap gap-2 mt-3', className)}>{children}</div>;
}