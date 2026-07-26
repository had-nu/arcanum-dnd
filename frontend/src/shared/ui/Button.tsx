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
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
      primary: 'bg-red-600 border-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:border-red-600 dark:text-white focus:ring-red-500',
      secondary: 'bg-stone-100 border-stone-300 text-stone-900 hover:bg-stone-200 dark:bg-stone-700 dark:border-stone-600 dark:text-stone-100 focus:ring-stone-500',
      outline: 'border-stone-300 text-stone-700 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800 focus:ring-stone-500',
      ghost: 'text-stone-700 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-800 focus:ring-stone-500',
      danger: 'border-red-600 text-red-700 hover:bg-red-50 dark:border-red-500 dark:text-red-400 focus:ring-red-500',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-base rounded-lg',
      lg: 'px-6 py-3 text-lg rounded-xl',
    };

    const classes = clsx(baseClasses, variantClasses[variant], sizeClasses[size], className);

    if (asChild) {
      return <>{children}</>;
    }

    return <button ref={ref} className={classes} {...props} />;
  }
);

Button.displayName = 'Button';