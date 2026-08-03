"use client";

import React, { forwardRef, type HTMLAttributes, type Ref, type ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'ref'> {
  variant?: 'default' | 'elevated' | 'selected';
  selected?: boolean;
  onClick?: () => void;
}

type CardRef = Ref<HTMLDivElement | HTMLButtonElement>;

export const Card = forwardRef<CardRef, CardProps>(
  ({ className = '', variant = 'default', selected = false, onClick, children, ...props }, ref) => {
    const isInteractive = typeof onClick === 'function';

    const variantClasses = {
      default: 'bg-[var(--bg-surface)] border border-[var(--border)]',
      elevated: 'bg-[var(--bg-surface)] border border-[var(--border)] hover:border-[var(--red)] hover:bg-[var(--bg-hover)] hover:shadow-lg hover:shadow-[var(--red)]/10',
      selected: 'bg-[var(--bg-surface)] border-2 border-[var(--gold)] shadow-lg shadow-[var(--gold)]/10',
    };

    const baseClasses = clsx(
      'relative rounded-[var(--radius-lg)] p-4 transition-all duration-200',
      variantClasses[variant],
      selected && 'border-[var(--gold)] shadow-lg shadow-[var(--gold)]/10',
      className
    );

    if (isInteractive) {
      const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>;
      return (
        <button
          ref={ref as Ref<HTMLButtonElement>}
          type="button"
          onClick={onClick}
          onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
          className={clsx(baseClasses, 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-root)]')}
          {...buttonProps}
        >
          {selected && (
            <span className="absolute top-2 right-2 text-[var(--gold)]" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          )}
          {children}
        </button>
      );
    }

    return (
      <div ref={ref as Ref<HTMLDivElement>} className={baseClasses} {...props}>
        {selected && (
          <span className="absolute top-2 right-2 text-[var(--gold)]" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={clsx('font-label font-bold text-base text-[var(--text)] mb-2', className)}>
      {children}
    </h3>
  );
}

export function CardMeta({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={clsx('text-sm text-[var(--text-muted)] leading-snug', className)}>{children}</p>;
}

export function CardTags({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('flex flex-wrap gap-2 mt-3', className)}>{children}</div>;
}