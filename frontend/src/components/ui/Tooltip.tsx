import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { clsx } from 'clsx';

interface TooltipProps extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root> {
  children: React.ReactNode;
}

export function Tooltip({ children, ...props }: TooltipProps) {
  return (
    <TooltipPrimitive.Root {...props}>
      {children}
    </TooltipPrimitive.Root>
  );
}

interface TooltipTriggerProps extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger> {
  children: React.ReactElement;
}

export function TooltipTrigger({ children, ...props }: TooltipTriggerProps) {
  if (!React.isValidElement(children)) {
    throw new Error('TooltipTrigger requires a single child element');
  }

  return (
    <TooltipPrimitive.Trigger asChild {...props}>
      {children}
    </TooltipPrimitive.Trigger>
  );
}

interface TooltipContentProps extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

export function TooltipContent({ className, children, side = 'top', align = 'center', ...props }: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        side={side}
        align={align}
        sideOffset={8}
        className={clsx(
          'z-50 px-3 py-2 text-xs font-medium text-white bg-dnd-stone-900 dark:bg-dnd-stone-100 dark:text-dnd-stone-900',
          'rounded-lg shadow-lg animate-fade-in',
          'data-[state=delayed-open]:animate-scale-in',
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-dnd-stone-900 dark:fill-dnd-stone-100" width={6} height={3} />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

import React from 'react';

Tooltip.displayName = 'Tooltip';
TooltipTrigger.displayName = 'TooltipTrigger';
TooltipContent.displayName = 'TooltipContent';