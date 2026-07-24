import { createContext, useContext, useState } from 'preact/hooks';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { XIcon } from '@heroicons/react/24/solid';
import { clsx } from 'clsx';

interface SheetContextValue {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const SheetContext = createContext<SheetContextValue | null>(null);

function useSheetContext() {
  const context = useContext(SheetContext);
  if (!context) {
    throw new Error('Sheet components must be used within Sheet');
  }
  return context;
}

interface SheetProps {
  children: React.ReactNode | ((ctx: SheetContextValue) => React.ReactNode);
}

export function Sheet({ children }: SheetProps) {
  const [open, setOpen] = useState(false);
  const value = { isOpen: open, onOpen: () => setOpen(true), onClose: () => setOpen(false) };

  return (
    <SheetContext.Provider value={value}>
      {typeof children === 'function' ? children(value) : children}
    </SheetContext.Provider>
  );
}

interface SheetTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function SheetTrigger({ children, onClick, ...props }: SheetTriggerProps) {
  const { onOpen, isOpen } = useSheetContext();
  return (
    <button onClick={(e) => { onClick?.(e); onOpen(); }} {...props}>
      {children}
    </button>
  );
}

interface SheetContentProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  children: React.ReactNode;
  side?: 'left' | 'right' | 'top' | 'bottom';
}

export function SheetContent({ children, side = 'right', className, ...props }: SheetContentProps) {
  const { isOpen, onClose } = useSheetContext();

  if (!isOpen) return null;

  const sideStyles = {
    right: 'right-0 h-full w-full max-w-2xl',
    left: 'left-0 h-full w-full max-w-2xl',
    top: 'top-0 w-full h-auto max-h-[80vh]',
    bottom: 'bottom-0 w-full h-auto max-h-[80vh]',
  };

  const animationStyles = {
    right: 'animate-slide-in-from-right animate-slide-out-to-right',
    left: 'animate-slide-in-from-left animate-slide-out-to-left',
    top: 'animate-slide-in-from-top animate-slide-out-to-top',
    bottom: 'animate-slide-in-from-bottom animate-slide-out-to-bottom',
  };

  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in" />
      <SheetPrimitive.Content
        className={clsx(
          'fixed z-50 bg-dnd-parchment-100 dark:bg-dnd-parchment-900 shadow-2xl',
          'border-l border-dnd-stone-200 dark:border-dnd-stone-700',
          sideStyles[side],
          animationStyles[side],
          className
        )}
        {...props}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 border-b border-dnd-stone-200 dark:border-dnd-stone-700">
            <h2 className="text-lg font-bold text-dnd-stone-900 dark:text-dnd-stone-100">
              {props['aria-label'] || 'Sheet'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-dnd-stone-500 hover:bg-dnd-stone-200 dark:hover:bg-dnd-stone-700 transition-colors"
              aria-label="Close"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {children}
          </div>
        </div>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

interface SheetCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function SheetClose({ children, onClick, ...props }: SheetCloseProps) {
  const { onClose } = useSheetContext();
  return (
    <button onClick={(e) => { onClick?.(e); onClose(); }} {...props}>
      {children}
    </button>
  );
}

Sheet.displayName = 'Sheet';
SheetTrigger.displayName = 'SheetTrigger';
SheetContent.displayName = 'SheetContent';
SheetClose.displayName = 'SheetClose';