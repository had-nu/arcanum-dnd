import * as SelectPrimitive from '@radix-ui/react-select';
import { clsx } from 'clsx';
import { ChevronDownIcon } from 'lucide-react';

interface SelectProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root> {
  className?: string;
}

export function Select({ children, ...props }: SelectProps) {
  return (
    <SelectPrimitive.Root {...props}>
      {children}
    </SelectPrimitive.Root>
  );
}

interface SelectTriggerProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  className?: string;
}

export function SelectTrigger({ className, children, ...props }: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      className={clsx(
        'flex h-10 w-full items-center justify-between rounded-lg border border-dnd-stone-300 dark:border-dnd-stone-600',
        'bg-white dark:bg-dnd-stone-800 px-3 py-2 text-sm text-dnd-stone-900 dark:text-dnd-stone-100',
        'placeholder:text-dnd-stone-400 dark:placeholder:text-dnd-stone-500',
        'focus:outline-none focus:ring-2 focus:ring-dnd-blood-500 focus:border-transparent',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-all duration-150',
        'hover:border-dnd-stone-400 dark:hover:border-dnd-stone-500',
        className
      )}
      {...props}
    >
      <SelectPrimitive.Value placeholder={children} />
      <SelectPrimitive.Icon>
        <ChevronDownIcon className="h-4 w-4 text-dnd-stone-500" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

interface SelectContentProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> {
  className?: string;
}

export function SelectContent({ className, children, position = 'popper', sideOffset = 5, ...props }: SelectContentProps) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        sideOffset={sideOffset}
        className={clsx(
          'relative z-50 max-h-96 w-full min-w-[var(--radix-select-trigger-width)]',
          'rounded-lg border border-dnd-stone-200 dark:border-dnd-stone-700',
          'bg-white dark:bg-dnd-stone-900 shadow-lg overflow-hidden',
          'focus:outline-none',
          'data-[side=bottom]:animate-in data-[side=bottom]:slide-in-from-top-2',
          'data-[side=top]:animate-in data-[side=top]:slide-in-from-bottom-2',
          className
        )}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="flex h-4 items-center justify-center text-dnd-stone-500" />
        <SelectPrimitive.Viewport
          className={clsx(
            'p-1',
            'focus:outline-none',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95',
            'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95'
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex h-4 items-center justify-center text-dnd-stone-500" />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

interface SelectGroupProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Group> {
  className?: string;
}

export function SelectGroup({ className, children, ...props }: SelectGroupProps) {
  return (
    <SelectPrimitive.Group className={clsx('data-[focus]:text-dnd-blood-600', className)} {...props}>
      {children}
    </SelectPrimitive.Group>
  );
}

interface SelectLabelProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label> {
  className?: string;
}

export function SelectLabel({ className, children, ...props }: SelectLabelProps) {
  return (
    <SelectPrimitive.Label
      className={clsx('px-2 py-1.5 text-xs font-semibold text-dnd-stone-500 dark:text-dnd-stone-400', className)}
      {...props}
    >
      {children}
    </SelectPrimitive.Label>
  );
}

interface SelectItemProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> {
  className?: string;
  disabled?: boolean;
}

export function SelectItem({ className, disabled, children, ...props }: SelectItemProps) {
  return (
    <SelectPrimitive.Item
      disabled={disabled}
      className={clsx(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm',
        'outline-none focus:bg-dnd-stone-100 dark:focus:bg-dnd-stone-800',
        'data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
        'data-[highlighted]:bg-dnd-stone-100 dark:data-[highlighted]:bg-dnd-stone-800',
        'text-dnd-stone-900 dark:text-dnd-stone-100',
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="truncate">{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator className="h-4 w-4 text-dnd-blood-600 dark:text-dnd-blood-400" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

interface SelectSeparatorProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator> {
  className?: string;
}

export function SelectSeparator({ className, ...props }: SelectSeparatorProps) {
  return (
    <SelectPrimitive.Separator
      className={clsx('-mx-1 my-1 h-px bg-dnd-stone-200 dark:bg-dnd-stone-700', className)}
      {...props}
    />
  );
}

export const SelectViewport = SelectPrimitive.Viewport;
export const SelectScrollUpButton = SelectPrimitive.ScrollUpButton;
export const SelectScrollDownButton = SelectPrimitive.ScrollDownButton;