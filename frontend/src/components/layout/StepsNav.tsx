import { clsx } from 'clsx';

const steps = [
  { id: 'name', label: 'Name' },
  { id: 'class', label: 'Class' },
  { id: 'background', label: 'Background' },
  { id: 'species', label: 'Species' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'sheet', label: 'Sheet' },
];

interface StepsNavProps {
  currentStep: string;
  completedSteps: string[];
  onStepClick?: (stepId: string) => void;
}

export function StepsNav({ currentStep, completedSteps, onStepClick }: StepsNavProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);

  const canAccess = (stepId: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    return stepIndex <= currentIndex + 1 || completedSteps.includes(stepId);
  };

  return (
    <nav className="relative" aria-label="Character creation steps">
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-dnd-stone-200 dark:bg-dnd-stone-700" />
      <ol className="relative flex items-center justify-between px-2">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isActive = step.id === currentStep;
          const isAccessible = canAccess(step.id);

          return (
            <li key={step.id} className="relative flex flex-col items-center gap-2">
              <button
                onClick={() => isAccessible && onStepClick?.(step.id)}
                disabled={!isAccessible}
                className={clsx(
                  'relative flex flex-col items-center gap-1.5 transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-dnd-blood-500 focus:ring-offset-2 focus:ring-offset-dnd-parchment dark:focus:ring-offset-dnd-stone-950',
                  isActive
                    ? 'text-dnd-blood-600 dark:text-dnd-blood-400'
                    : isCompleted
                    ? 'text-dnd-gold-600 dark:text-dnd-gold-400'
                    : isAccessible
                    ? 'text-dnd-stone-600 dark:text-dnd-stone-400 hover:text-dnd-stone-900 dark:hover:text-dnd-stone-100'
                    : 'text-dnd-stone-300 dark:text-dnd-stone-600 cursor-not-allowed'
                )}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`Step ${index + 1}: ${step.label} ${isCompleted ? '(completed)' : isActive ? '(current)' : ''}`}
              >
                <div
                  className={clsx(
                    'relative flex items-center justify-center w-10 h-10 rounded-full border-2 text-xs font-bold',
                    'transition-all duration-200',
                    isActive
                      ? 'bg-dnd-blood-600 border-dnd-blood-600 text-white shadow-lg shadow-dnd-blood-600/30'
                      : isCompleted
                      ? 'bg-dnd-gold-500 border-dnd-gold-500 text-white'
                      : isAccessible
                      ? 'bg-dnd-parchment-100 border-dnd-stone-300 text-dnd-stone-500 dark:bg-dnd-stone-800 dark:border-dnd-stone-600 dark:text-dnd-stone-400'
                      : 'bg-dnd-parchment-100 border-dnd-stone-200 text-dnd-stone-300 dark:bg-dnd-stone-800 dark:border-dnd-stone-700 dark:text-dnd-stone-600'
                  )}
                  aria-hidden="true"
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className={clsx(
                  'text-[10px] font-medium font-condensed uppercase tracking-wider text-center w-16 hidden sm:block',
                  isActive && 'text-dnd-blood-600 dark:text-dnd-blood-400',
                  isCompleted && 'text-dnd-gold-600 dark:text-dnd-gold-400',
                  !isActive && !isCompleted && isAccessible && 'text-dnd-stone-600 dark:text-dnd-stone-400',
                  !isAccessible && 'text-dnd-stone-300 dark:text-dnd-stone-600'
                )}>
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
