"use client";

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', asChild = false, children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

    const variantClasses = {
      primary: 'bg-[var(--red)] border-[var(--red)] text-white hover:bg-[var(--red-hover)] dark:bg-[var(--red)] dark:border-[var(--red)] dark:text-white focus-visible:ring-[var(--red)]',
      secondary: 'bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg-hover)] dark:bg-[var(--db-bg-elevated)] dark:border-[var(--db-border-light)] dark:text-[var(--db-text)] focus-visible:ring-[var(--border-focus)]',
      outline: 'border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg-hover)] dark:border-[var(--db-border-light)] dark:text-[var(--db-text)] dark:hover:bg-[var(--db-bg-elevated)] focus-visible:ring-[var(--border-focus)]',
      ghost: 'text-[var(--text)] hover:bg-[var(--bg-hover)] dark:text-[var(--db-text)] dark:hover:bg-[var(--db-bg-elevated)] focus-visible:ring-[var(--border-focus)]',
      danger: 'border-[var(--red)] text-[var(--red)] hover:bg-[var(--red-hover)] hover:text-white dark:border-[var(--db-red)] dark:text-[var(--db-red)] dark:hover:bg-[var(--db-red)] dark:hover:text-white focus-visible:ring-[var(--red)]',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm rounded-[var(--radius)] min-h-[44px]',
      md: 'px-4 py-2 text-base rounded-[var(--radius-lg)] min-h-[44px]',
      lg: 'px-6 py-3 text-lg rounded-[var(--radius-xl)] min-h-[44px]',
    };

    const classes = clsx(baseClasses, variantClasses[variant], sizeClasses[size], className);

    if (asChild) {
      return <>{children}</>;
    }

    return <button ref={ref} className={classes} {...props}>{children}</button>;
  }
);

Button.displayName = 'Button';