import { createContext } from 'preact';
import { useState, useContext } from 'preact/hooks';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-preact';
import { clsx } from 'clsx';

interface DialogContextValue {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within Dialog');
  }
  return context;
}

interface DialogProps {
  children: React.ReactNode | ((ctx: DialogContextValue) => React.ReactNode);
}

export function Dialog({ children }: DialogProps) {
  const [open, setOpen] = useState(false);
  const value = { isOpen: open, onOpen: () => setOpen(true), onClose: () => setOpen(false) };

  return (
    <DialogContext.Provider value={value}>
      {typeof children === 'function' ? children(value) : children}
    </DialogContext.Provider>
  );
}

interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function DialogTrigger({ children, onClick, ...props }: DialogTriggerProps) {
  const { onOpen } = useDialogContext();
  return (
    <button onClick={(e) => { onClick?.(e); onOpen(); }} {...props}>
      {children}
    </button>
  );
}

interface DialogContentProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

export function DialogContent({ children, size = 'md', className, ...props }: DialogContentProps) {
  const { isOpen, onClose } = useDialogContext();

  if (!isOpen) return null;

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in" />
      <DialogPrimitive.Content
        className={clsx(
          'fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2',
          'bg-white dark:bg-dnd-stone-900 rounded-xl shadow-2xl',
          'border border-dnd-stone-200 dark:border-dnd-stone-700',
          sizeStyles[size],
          'animate-scale-in',
          className
        )}
        {...props}
      >
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-dnd-stone-200 dark:border-dnd-stone-700">
            <h2 className="text-lg font-bold text-dnd-stone-900 dark:text-dnd-stone-100">
              {props['aria-label'] || 'Dialog'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-dnd-stone-500 hover:bg-dnd-stone-200 dark:hover:bg-dnd-stone-700 transition-colors"
              aria-label="Close"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4">
            {children}
          </div>
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function DialogClose({ children, onClick, ...props }: DialogCloseProps) {
  const { onClose } = useDialogContext();
  return (
    <button onClick={(e) => { onClick?.(e); onClose(); }} {...props}>
      {children}
    </button>
  );
}

Dialog.displayName = 'Dialog';
DialogTrigger.displayName = 'DialogTrigger';
DialogContent.displayName = 'DialogContent';
DialogClose.displayName = 'DialogClose';