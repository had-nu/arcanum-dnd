import { clsx } from 'clsx';
import { Slot } from '@radix-ui/react-slot';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  asChild?: boolean;
}

export function Input({
  className,
  label,
  error,
  hint,
  asChild,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;

  const Comp = asChild ? Slot : 'input';

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <Comp
        id={inputId}
        className={clsx(
          'w-full px-3 py-2 text-sm bg-white border rounded-lg placeholder:text-dnd-stone-400',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-dnd-blood-500 focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-dnd-stone-300 dark:border-dnd-stone-600 dark:bg-dnd-stone-800',
          className
        )}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={clsx(errorId, hintId) || undefined}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-sm text-dnd-stone-500 dark:text-dnd-stone-400">
          {hint}
        </p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ className, label, error, hint, id, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={clsx(
          'w-full px-3 py-2 text-sm bg-white border rounded-lg placeholder:text-dnd-stone-400',
          'transition-colors duration-150 resize-y min-h-[80px]',
          'focus:outline-none focus:ring-2 focus:ring-dnd-blood-500 focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-dnd-stone-300 dark:border-dnd-stone-600 dark:bg-dnd-stone-800',
          className
        )}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={clsx(errorId, hintId) || undefined}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-sm text-dnd-stone-500 dark:text-dnd-stone-400">
          {hint}
        </p>
      )}
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function SelectField({ className, label, error, hint, options, placeholder, id, ...props }: SelectFieldProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${selectId}-error` : undefined;
  const hintId = hint ? `${selectId}-hint` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="label">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={clsx(
          'w-full px-3 py-2 text-sm bg-white border rounded-lg appearance-none',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-dnd-blood-500 focus:border-transparent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-dnd-stone-300 dark:border-dnd-stone-600 dark:bg-dnd-stone-800',
          className
        )}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={clsx(errorId, hintId) || undefined}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-sm text-dnd-stone-500 dark:text-dnd-stone-400">
          {hint}
        </p>
      )}
    </div>
  );
}