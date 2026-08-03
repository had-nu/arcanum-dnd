import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useContentStore } from '@/stores/contentStore';
import { useBuilderStore } from '@/stores/builderStore';
import { useWizardUIStore } from '@/stores/wizardUIStore';
import { TopChrome } from './TopChrome';
import { ClassStep } from './class-step/ClassStep';
import { BackgroundStep } from './BackgroundStep';
import { SpeciesStep } from './SpeciesStep';
import { AbilitiesStep } from './AbilitiesStep';
import { EquipmentStep } from './EquipmentStep';
import { WhatsNextStep } from './WhatsNextStep';
import { Button } from '@/shared/ui';

const STEPS = [
  { id: 'class', label: 'Class' },
  { id: 'background', label: 'Background' },
  { id: 'species', label: 'Species' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'whatsnext', label: "What's Next" },
] as const;

type StepId = (typeof STEPS)[number]['id'];

function getStepIndex(step: StepId): number {
  return STEPS.findIndex((s) => s.id === step);
}

function canProceed(): boolean {
  const { draft } = useBuilderStore.getState();
  const currentStep = useWizardUIStore.getState().activeStep;
  switch (currentStep) {
    case 'class':
      return draft.classes.length > 0;
    case 'background':
      return !!draft.backgroundId;
    case 'species':
      return !!draft.speciesId;
    case 'abilities':
      return Object.values(draft.abilityScores).every((v) => typeof v === 'number' && v > 0);
    case 'equipment':
      return draft.classes.length > 0;
    case 'whatsnext':
      return true;
    default:
      return false;
  }
}

function goToStep(step: StepId) {
  const current = useWizardUIStore.getState().activeStep;
  const currentIdx = getStepIndex(current);
  const targetIdx = getStepIndex(step);
  if (targetIdx <= currentIdx + 1) {
    useWizardUIStore.getState().setActiveStep(step);
  }
}

export function BuilderPage() {
  const params = useParams();
  const characterId = params.name;

  const { loaded, load } = useContentStore();
  const { draft, preview, requestPreview, loadFromCharacter, reset } = useBuilderStore();
  const { activeStep, setActiveStep } = useWizardUIStore();

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (characterId && characterId !== 'new') {
      const loadCharacter = async () => {
        try {
          const response = await fetch(`/api/characters/${encodeURIComponent(characterId)}`);
          if (response.ok) {
            const character = await response.json();
            loadFromCharacter(character);
          }
        } catch (error) {
          console.error('Failed to load character:', error);
        }
      };
      loadCharacter();
    } else if (characterId === 'new') {
      reset();
      setActiveStep('class');
    }
  }, [characterId, loadFromCharacter, reset, setActiveStep]);

  useEffect(() => {
    if (loaded && draft.classes.length > 0) {
      requestPreview();
    }
  }, [loaded, draft, requestPreview]);

  const currentStepIndex = getStepIndex(activeStep);
  const isLastStep = currentStepIndex === STEPS.length - 1;

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--red)] border-t-transparent mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Loading content...</p>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (activeStep) {
      case 'class':
        return <ClassStep />;
      case 'background':
        return <BackgroundStep />;
      case 'species':
        return <SpeciesStep />;
      case 'abilities':
        return <AbilitiesStep />;
      case 'equipment':
        return <EquipmentStep />;
      case 'whatsnext':
        return <WhatsNextStep />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-root)] flex flex-col">
      <TopChrome />
      <nav className="steps-bar" aria-label="Character creation steps">
        <div className="container mx-auto px-4">
          <div className="steps-inner">
            {STEPS.map((s, index) => {
              const isCompleted = index < currentStepIndex;
              const isActive = s.id === activeStep;
              const isAccessible = index <= currentStepIndex + 1;

              return (
                <button
                  key={s.id}
                  className={`step ${isCompleted ? 'done' : ''} ${isActive ? 'active' : ''}`}
                  onClick={() => isAccessible && goToStep(s.id)}
                  disabled={!isAccessible}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main id="main-content" className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 pb-8">
          <div className="step-content pt-6">
            {renderStep()}
          </div>

          <div className="actions flex justify-between pt-6 border-t border-[var(--border)] mt-8">
            {currentStepIndex > 0 && (
              <Button onClick={() => goToStep(STEPS[currentStepIndex - 1].id)}>Back</Button>
            )}
            {isLastStep ? (
              <Button variant="primary" onClick={handleSave} disabled={!preview}>Save Character</Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => goToStep(STEPS[currentStepIndex + 1].id)}
                disabled={!canProceed()}
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function handleSave() {
  const { save } = useBuilderStore.getState();
  save().then(() => {
    window.location.href = '/characters';
  }).catch((error) => {
    console.error('Save failed:', error);
    alert('Failed to save character');
  });
}