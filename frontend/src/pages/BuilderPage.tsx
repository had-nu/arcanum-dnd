import { useEffect } from 'preact/hooks';
import { useNavigate, useParams } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeftIcon, ChevronRightIcon, SaveIcon, LoaderCircleIcon, SparklesIcon } from 'lucide-preact';

import { StepsNav } from '@components/layout/StepsNav';
import { AbilityScores } from '@components/character/AbilityScores';
import { SpeciesPicker } from '@components/character/SpeciesPicker';
import { BackgroundPicker } from '@components/character/BackgroundPicker';
import { ClassPicker } from '@components/character/ClassPicker';
import { SkillSelector } from '@components/character/SkillSelector';
import { SpellSelector } from '@components/character/SpellSelector';
import { FeatSelector } from '@components/character/FeatSelector';
import { CharacterSheetPreview } from '@components/character/CharacterSheetPreview';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { ToastContainer, useToast } from '@components/ui/Toast';
import { useContent } from '@hooks/useContent';
import { useBuild } from '@hooks/useContent';
import { useSaveCharacter } from '@hooks/useContent';
import { builderStore } from '@stores/builderStore';

const stepSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  speciesId: z.string().min(1, 'Species is required'),
  backgroundId: z.string().min(1, 'Background is required'),
});

const classSchema = z.object({
  classes: z.array(z.object({
    id: z.string().min(1, 'Class is required'),
    level: z.number().min(1).max(20),
  })).min(1, 'At least one class required'),
});

const skillSchema = z.object({
  skills: z.array(z.string()).min(1, 'At least one skill required'),
});

const steps = [
  { key: 'basics', label: 'Basics', icon: SparklesIcon },
  { key: 'class', label: 'Class', icon: SparklesIcon },
  { key: 'skills', label: 'Skills', icon: SparklesIcon },
  { key: 'spells', label: 'Spells/Feats', icon: SparklesIcon },
  { key: 'review', label: 'Review', icon: SparklesIcon },
];

const stepOrder = ['basics', 'class', 'skills', 'spells', 'review'] as const;
type StepKey = typeof stepOrder[number];

export function BuilderPage() {
  const navigate = useNavigate();
  const { name } = useParams<{ name?: string }>();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const { toast } = useToast();
  
  const { data: content } = useContent();
  const buildMutation = useBuild();
  const saveMutation = useSaveCharacter();
  
  const isEditing = !!name;
  
  const currentStep = stepOrder[currentStepIndex];
  
  const stepForm = useForm({
    resolver: zodResolver(stepSchema),
    defaultValues: {
      name: builderStore.name.value,
      speciesId: builderStore.speciesId.value,
      backgroundId: builderStore.backgroundId.value,
    },
    mode: 'onChange',
  });
  
  const classForm = useForm({
    resolver: zodResolver(classSchema),
    defaultValues: {
      classes: builderStore.classes.value,
    },
    mode: 'onChange',
  });
  
  const skillForm = useForm({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      skills: builderStore.skills.value,
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (isEditing && name && content?.characters && content.backgrounds && content.species) {
      // TODO: load character data
    }
  }, [name, isEditing, content]);

  const handleNext = async () => {
    const step = stepOrder[currentStepIndex];
    
    let isValid = false;
    switch (step) {
      case 'basics':
        isValid = await stepForm.trigger();
        break;
      case 'class':
        isValid = await classForm.trigger();
        break;
      case 'skills':
        isValid = await skillForm.trigger();
        break;
      case 'spells':
        isValid = true;
        break;
      case 'review':
        await handleBuild();
        return;
    }
    
    if (isValid && currentStepIndex < stepOrder.length - 1) {
      builderStore.markStepComplete(step);
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleBuild = async () => {
    builderStore.isSubmitting.value = true;
    builderStore.submitError.value = null;
    
    try {
      const response = await buildMutation.mutateAsync(builderStore.toBuildRequest());
      builderStore.submitSuccess.value = true;
      toast.success('Character built!', 'Review your character sheet below.');
      
      if (isEditing && name) {
        await saveMutation.mutateAsync({
          ...builderStore.toSaveRequest(),
          name,
        });
        toast.success('Character updated!', 'Your changes have been saved.');
      }
    } catch (error) {
      builderStore.submitError.value = error instanceof Error ? error.message : 'Build failed';
      toast.error('Build failed', builderStore.submitError.value);
    } finally {
      builderStore.isSubmitting.value = false;
    }
  };

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync(builderStore.toSaveRequest());
      toast.success('Character saved!', 'You can find it in your vault.');
      navigate('/characters');
    } catch (error) {
      toast.error('Save failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const renderStepContent = () => {
    const classes = content?.classes || [];
    const species = content?.species || [];
    const backgrounds = content?.backgrounds || [];
    const skills = content?.skills || [];
    const spells = content?.spells || { cantrips: [], leveled: [] };
    const feats = content?.feats || {};

    switch (currentStep) {
      case 'basics':
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <AbilityScores
                scores={builderStore.abilityScores}
                onChange={v => builderStore.abilityScores.value = v}
                method={builderStore.abilityMethod.value}
                onMethodChange={v => builderStore.abilityMethod.value = v}
                totalLevel={builderStore.totalLevel}
              />
              <div className="space-y-4">
                <SpeciesPicker
                  species={species}
                  value={builderStore.speciesId.value}
                  onChange={v => builderStore.speciesId.value = v}
                  variant={builderStore.speciesVariant.value}
                  onVariantChange={v => builderStore.speciesVariant.value = v}
                  errors={stepForm.formState.errors.speciesId?.message}
                />
                <BackgroundPicker
                  backgrounds={backgrounds}
                  value={builderStore.backgroundId.value}
                  onChange={v => builderStore.backgroundId.value = v}
                  errors={stepForm.formState.errors.backgroundId?.message}
                />
              </div>
            </div>
            <div>
              <label className="label">Character Name</label>
              <input
                {...stepForm.register('name')}
                className="input"
                placeholder="Enter character name"
                value={builderStore.name.value}
                onChange={e => builderStore.name.value = e.target.value}
              />
              {stepForm.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600">{stepForm.formState.errors.name.message}</p>
              )}
            </div>
          </div>
        );

      case 'class':
        return (
          <ClassPicker
            classes={classes}
            selectedClasses={builderStore.classes.value}
            onChange={v => builderStore.classes.value = v}
            subclassId={builderStore.subclassId.value}
            onSubclassChange={v => builderStore.subclassId.value = v}
            totalLevel={builderStore.totalLevel}
          />
        );

      case 'skills':
        return (
          <SkillSelector
            skills={skills}
            classSkills={classes.find(c => c.id === builderStore.classes.value[0]?.id)?.skillPool || []}
            backgroundSkills={backgrounds.find(b => b.id === builderStore.backgroundId.value)?.skills || []}
            value={builderStore.skills.value}
            onChange={v => builderStore.skills.value = v}
          />
        );

      case 'spells':
        const classId = builderStore.classes.value[0]?.id;
        return (
          <div className="grid gap-6 md:grid-cols-2">
            <SpellSelector
              classId={classId}
              spells={spells}
              value={builderStore.spells.value}
              onChange={v => builderStore.spells.value = v}
              level={builderStore.totalLevel}
            />
            <FeatSelector
              feats={feats}
              value={builderStore.feats.value}
              onChange={v => builderStore.feats.value = v}
            />
          </div>
        );

      case 'review':
        return (
          <CharacterSheetPreview
            character={builderStore.toBuildRequest()}
            content={content}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <StepsNav
        steps={steps}
        currentStep={currentStep}
        completedSteps={builderStore.completedSteps.value}
      />
      
      <Card className="mt-6 animate-fade-in">
        <div className="p-6">
          {renderStepContent()}
        </div>
        
        <div className="flex items-center justify-between px-6 py-4 border-t border-dnd-stone-200 dark:border-dnd-stone-700">
          <Button variant="ghost" onClick={handleBack} disabled={currentStepIndex === 0}>
            <ChevronLeftIcon className="h-4 w-4 mr-2" /> Back
          </Button>
          
          <div className="flex gap-3">
            {currentStepIndex < stepOrder.length - 1 ? (
              <Button onClick={handleNext} disabled={builderStore.isSubmitting.value}>
                {builderStore.isSubmitting.value && <LoaderCircleIcon className="h-4 w-4 animate-spin mr-2" />}
                Next <ChevronRightIcon className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <>
                <Button variant="secondary" onClick={handleSave} disabled={saveMutation.isPending}>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Save Character
                </Button>
                <Button onClick={handleBuild} disabled={buildMutation.isPending}>
                  {buildMutation.isPending && <LoaderCircleIcon className="h-4 w-4 animate-spin mr-2" />}
                  Build Sheet
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      <ToastContainer />
    </div>
  );
}

import { useState } from 'preact/hooks';