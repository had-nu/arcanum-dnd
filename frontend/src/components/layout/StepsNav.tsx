import { clsx } from 'clsx';
import { useLocation } from 'wouter';

const steps = [
  { id: 'basics', label: 'Basics', href: '/builder?step=basics', icon: '👤' },
  { id: 'class', label: 'Class', href: '/builder?step=class', icon: '⚔️' },
  { id: 'skills', label: 'Skills', href: '/builder?step=skills', icon: '🎯' },
  { id: 'spells', label: 'Spells', href: '/builder?step=spells', icon: '✨' },
  { id: 'review', label: 'Review', href: '/builder?step=review', icon: '📋' },
];

const stepOrder = ['basics', 'class', 'skills', 'spells', 'review'];

interface StepsNavProps {
  currentStep: string;
  completedSteps: string[];
  onStepClick?: (stepId: string) => void;
}

export function StepsNav({ currentStep, completedSteps, onStepClick }: StepsNavProps) {
  const [, navigate] = useLocation();
  const currentIndex = stepOrder.indexOf(currentStep);

  const handleClick = (stepId: string) => {
    if (onStepClick) {
      onStepClick(stepId);
    } else {
      navigate(`/builder?step=${stepId}`);
    }
  };

  const canAccess = (stepId: string) => {
    const stepIndex = stepOrder.indexOf(stepId);
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
          const isFuture = stepOrder.indexOf(step.id) > currentIndex && !isCompleted;

          return (
            <li key={step.id} className="relative flex flex-col items-center gap-2">
              <button
                onClick={() => isAccessible && handleClick(step.id)}
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
                aria-label={`Step ${index + 1}: ${step.label} ${isCompleted ? '(completed)' : isActive ? '(current)' : isFuture ? '(locked)' : ''}`}
              >
                <div
                  className={clsx(
                    'relative flex items-center justify-center w-12 h-12 rounded-full border-4',
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
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-2xl" aria-hidden="true">{step.icon}</span>
                  )}
                </div>
                <span className={clsx(
                  'text-xs font-medium font-condensed uppercase tracking-wider text-center w-24',
                  isActive && 'text-dnd-blood-600 dark:text-dnd-blood-400',
                  isCompleted && 'text-dnd-gold-600 dark:text-dnd-gold-400',
                  !isActive && !isCompleted && isAccessible && 'text-dnd-stone-600 dark:text-dnd-stone-400',
                  !isAccessible && 'text-dnd-stone-300 dark:text-dnd-stone-600'
                )}>
                  {step.label}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={clsx(
                    'absolute top-[22px] left-1/2 right-1/2 h-1 transform -translate-x-1/2',
                    isCompleted || (isActive && index < currentIndex)
                      ? 'bg-dnd-gold-500'
                      : 'bg-dnd-stone-200 dark:bg-dnd-stone-700'
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}