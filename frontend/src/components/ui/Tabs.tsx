import * as TabsPrimitive from '@radix-ui/react-tabs';
import { clsx } from 'clsx';

interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  children: React.ReactNode;
}

export function Tabs({ className, children, ...props }: TabsProps) {
  return (
    <TabsPrimitive.Root className={clsx('w-full', className)} {...props}>
      {children}
    </TabsPrimitive.Root>
  );
}

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {}

export function TabsList({ className, children, ...props }: TabsListProps) {
  return (
    <TabsPrimitive.List
      className={clsx(
        'inline-flex h-10 items-center justify-center rounded-lg bg-dnd-stone-100 dark:bg-dnd-stone-800 p-1',
        'border border-dnd-stone-200 dark:border-dnd-stone-700',
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  );
}

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  disabled?: boolean;
}

export function TabsTrigger({ className, disabled, children, ...props }: TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      disabled={disabled}
      className={clsx(
        'flex items-center justify-center px-4 py-1.5 text-sm font-medium rounded-md',
        'transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-dnd-blood-500',
        'data-[state=active]:bg-white dark:data-[state=active]:bg-dnd-stone-800',
        'data-[state=active]:shadow-sm data-[state=active]:text-dnd-stone-900 dark:data-[state=active]:text-dnd-stone-100',
        'data-[state=inactive]:text-dnd-stone-600 dark:data-[state=inactive]:text-dnd-stone-400',
        'hover:data-[state=inactive]:text-dnd-stone-900 dark:hover:data-[state=inactive]:text-dnd-stone-100',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}

interface TabsContentProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {}

export function TabsContent({ className, children, ...props }: TabsContentProps) {
  return (
    <TabsPrimitive.Content
      className={clsx(
        'mt-4 ring-0 focus-visible:ring-2 focus-visible:ring-dnd-blood-500',
        'animate-fade-in',
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Content>
  );
}

Tabs.displayName = 'Tabs';
TabsList.displayName = 'TabsList';
TabsTrigger.displayName = 'TabsTrigger';
TabsContent.displayName = 'TabsContent';