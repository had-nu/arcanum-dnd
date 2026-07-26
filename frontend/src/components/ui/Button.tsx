"use client"

import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  asChild?: boolean;
}

export function Button({ 
  className = '', 
  variant = 'primary', 
  size = 'md', 
  asChild = false,
  ...props 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-dnd-blood-600 border-dnd-blood-600 text-white hover:bg-dnd-blood-700 dark:bg-dnd-blood-600 dark:border-dnd-blood-600 dark:text-white focus:ring-dnd-blood-500',
    secondary: 'bg-dnd-stone-100 border-dnd-stone-300 text-dnd-stone-900 hover:bg-dnd-stone-200 dark:bg-dnd-stone-700 dark:border-dnd-stone-600 dark:text-dnd-stone-100 focus:ring-dnd-stone-500',
    outline: 'border-dnd-stone-300 text-dnd-stone-700 hover:bg-dnd-stone-50 dark:border-dnd-stone-600 dark:text-dnd-stone-300 dark:hover:bg-dnd-stone-800 focus:ring-dnd-stone-500',
    ghost: 'text-dnd-stone-700 hover:bg-dnd-stone-50 dark:text-dnd-stone-300 dark:hover:bg-dnd-stone-800 focus:ring-dnd-stone-500',
    danger: 'border-dnd-blood-600 text-dnd-blood-700 hover:bg-dnd-blood-50 dark:border-dnd-blood-500 dark:text-dnd-blood-400 focus:ring-dnd-blood-500',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-xl',
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  if (asChild) {
    return <>{props.children}</>;
  }
  
  return <button className={classes} {...props} />;
}
