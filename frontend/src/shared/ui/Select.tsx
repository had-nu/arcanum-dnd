"use client";

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, id, options, placeholder, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-stone-200 mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            'w-full px-3 py-2 bg-stone-900 border border-stone-700 text-white rounded-md',
            'focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${selectId}-error` : undefined}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${selectId}-error`} className="mt-1 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';