import { useCallback } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeftIcon, ChevronRightIcon, SaveIcon, LoaderCircleIcon } from 'lucide-react';

import { StepsNav } from '@/components/layout/StepsNav';
import { AbilityScores } from '@/components/character/AbilityScores';
import { SpeciesPicker } from '@/components/character/SpeciesPicker';
import { BackgroundPicker } from '@/components/character/BackgroundPicker';
import { ClassPicker } from '@/components/character/ClassPicker';
import { SkillSelector } from '@/components/character/SkillSelector';
import { SpellSelector } from '@/components/character/SpellSelector';
import { FeatSelector } from '@/components/character/FeatSelector';
import { CharacterSheetPreview } from '@/components/character/CharacterSheetPreview';
import { EquipmentPicker } from '@/components/character/EquipmentPicker';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { useContent } from '@/hooks/useContent';
import { useSpells } from '@/hooks/useContent';
import { useBuild } from '@/hooks/useContent';
import { useSaveCharacter } from '@/hooks/useContent';
import { builderStore, getTotalLevel } from '@stores/builderStore';

const STEPS = ['name', 'class', 'background', 'species', 'abilities', 'equipment', 'sheet'] as const;

export function BuilderPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: content } = useContent();
  const buildMutation = useBuild();
  const saveMutation = useSaveCharacter();

  const step = builderStore((s) => s.step);
  const name = builderStore((s) => s.name);
  const classes = builderStore((s) => s.classes);
  const backgroundId = builderStore((s) => s.backgroundId);
  const speciesId = builderStore((s) => s.speciesId);
  const abilityScores = builderStore((s) => s.abilityScores);
  const abilityMethod = builderStore((s) => s.abilityMethod);
  const skills = builderStore((s) => s.skills);
  const spells = builderStore((s) => s.spells);
  const feats = builderStore((s) => s.feats);
  const equipment = builderStore((s) => s.equipment);
  const isSubmitting = builderStore((s) => s.isSubmitting);
  const completedSteps = builderStore((s) => s.completedSteps);

  const currentStepIndex = STEPS.indexOf(step);
  const totalLevel = getTotalLevel();

  const classId = classes[0]?.id;
  const { data: spellsData } = useSpells(classId, undefined, totalLevel);
  const spellsFetched = spellsData || { cantrips: [], leveled: [] };

  const classesData = content?.classes || [];
  const speciesData = content?.species || [];
  const backgroundsData = content?.backgrounds || [];
  const skillsData = content?.skills || [];
  const featsData = content?.feats || {};

  const setStep = useCallback((s: typeof STEPS[number]) => {
    builderStore.getState().setStep(s);
  }, []);

  const handleNext = () => {
    const step = STEPS[currentStepIndex];

    if (step === 'name' && !name.trim()) {
      toast.error('Name required', 'Enter a character name.');
      return;
    }
    if (step === 'class' && !classes[0]?.id) {
      toast.error('Class required', 'Select a class.');
      return;
    }
    if (step === 'background' && !backgroundId) {
      toast.error('Background required', 'Select a background.');
      return;
    }
    if (step === 'species' && !speciesId) {
      toast.error('Species required', 'Select a species.');
      return;
    }
    if (step === 'sheet') {
      handleBuild();
      return;
    }

    builderStore.getState().markStepComplete(step);
    if (currentStepIndex < STEPS.length - 1) {
      setStep(STEPS[currentStepIndex + 1]);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setStep(STEPS[currentStepIndex - 1]);
    }
  };

  const handleBuild = async () => {
    builderStore.getState().setIsSubmitting(true);
    builderStore.getState().setSubmitError(null);

    try {
      const request = {
        name,
        classes,
        backgroundId,
        speciesId,
        speciesVariant: builderStore.getState().speciesVariant || undefined,
        level: totalLevel,
        abilityScores,
        abilityMethod,
        skills,
        spells,
        feats,
      };
      await buildMutation.mutateAsync(request);
      builderStore.getState().setSubmitSuccess(true);
      toast.success('Character built!', 'Review your character sheet below.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Build failed';
      builderStore.getState().setSubmitError(msg);
      toast.error('Build failed', msg);
    } finally {
      builderStore.getState().setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    try {
      const state = builderStore.getState();
      await saveMutation.mutateAsync({
        name: state.name,
        classes: state.classes.map(c => ({
          id: c.id,
          name: '',
          level: c.level,
          subclassId: state.subclassId || undefined,
        })),
        backgroundId: state.backgroundId,
        speciesId: state.speciesId,
        speciesVariant: state.speciesVariant || undefined,
        level: getTotalLevel(),
        abilityMethod: state.abilityMethod,
        abilities: state.abilityScores as unknown as Record<string, number>,
        skills: state.skills,
        spells: state.spells,
        feats: state.feats,
        equipment: state.equipment,
        subclassId: state.subclassId || undefined,
        bgAlignment: state.bgAlignment || undefined,
        bgFaith: state.bgFaith || undefined,
        bgTrait: state.bgTrait || undefined,
        bgIdeal: state.bgIdeal || undefined,
        bgBond: state.bgBond || undefined,
        bgFlaw: state.bgFlaw || undefined,
        bgAge: state.bgAge || undefined,
        bgHeight: state.bgHeight || undefined,
        bgWeight: state.bgWeight || undefined,
        bgEyes: state.bgEyes || undefined,
        bgSkin: state.bgSkin || undefined,
        bgHair: state.bgHair || undefined,
        bgNotes: state.bgNotes || undefined,
        xp: state.xp,
        progressionType: state.progressionType,
      });
      toast.success('Character saved!', 'You can find it in your vault.');
      navigate('/characters');
    } catch (error) {
      toast.error('Save failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'name':
        return (
          <div className="space-y-6">
            <div>
              <label className="label">Character Name</label>
              <input
                className="input"
                type="text"
                placeholder="Enter character name"
                value={name}
                onChange={(e) => builderStore.getState().setName(e.currentTarget.value)}
                autoFocus
              />
            </div>
          </div>
        );

      case 'class':
        return (
          <div className="space-y-6">
            <ClassPicker
              classes={classesData}
              value={classes}
              onChange={(v) => builderStore.getState().setClasses(v)}
              totalLevel={totalLevel}
              errors={undefined}
            />
            {classId && (
              <SpellSelector
                classId={classId}
                spells={spellsFetched}
                value={spells}
                onChange={(v) => builderStore.getState().setSpells(v)}
                level={totalLevel}
              />
            )}
          </div>
        );

      case 'background':
        return (
          <div className="space-y-6">
            <BackgroundPicker
              backgrounds={backgroundsData}
              value={backgroundId}
              onChange={(id) => builderStore.getState().setBackgroundId(id)}
              personalityState={{
                alignment: builderStore.getState().bgAlignment,
                faith: builderStore.getState().bgFaith,
                trait: builderStore.getState().bgTrait,
                ideal: builderStore.getState().bgIdeal,
                bond: builderStore.getState().bgBond,
                flaw: builderStore.getState().bgFlaw,
                age: builderStore.getState().bgAge,
                height: builderStore.getState().bgHeight,
                weight: builderStore.getState().bgWeight,
                eyes: builderStore.getState().bgEyes,
                skin: builderStore.getState().bgSkin,
                hair: builderStore.getState().bgHair,
                notes: builderStore.getState().bgNotes,
              }}
              onPersonalityChange={(field, value) => {
                const s = builderStore.getState();
                switch (field) {
                  case 'alignment': s.setBgAlignment(value); break;
                  case 'faith': s.setBgFaith(value); break;
                  case 'trait': s.setBgTrait(value); break;
                  case 'ideal': s.setBgIdeal(value); break;
                  case 'bond': s.setBgBond(value); break;
                  case 'flaw': s.setBgFlaw(value); break;
                  case 'age': s.setBgAge(value); break;
                  case 'height': s.setBgHeight(value); break;
                  case 'weight': s.setBgWeight(value); break;
                  case 'eyes': s.setBgEyes(value); break;
                  case 'skin': s.setBgSkin(value); break;
                  case 'hair': s.setBgHair(value); break;
                  case 'notes': s.setBgNotes(value); break;
                }
              }}
            />
          </div>
        );

      case 'species':
        return (
          <div className="space-y-6">
            <SpeciesPicker
              species={speciesData}
              value={speciesId}
              onChange={(id) => builderStore.getState().setSpeciesId(id)}
              variant={builderStore.getState().speciesVariant}
              onVariantChange={(v) => builderStore.getState().setSpeciesVariant(v)}
            />
          </div>
        );

      case 'abilities': {
        const primaryClass = classesData.find((c) => c.id === classes[0]?.id);
        const classSkillPool = primaryClass?.skillPool || [];
        const backgroundSkillPool = backgroundsData.find((b) => b.id === backgroundId)?.skills || [];
        const skillPool = [...new Set([...classSkillPool, ...backgroundSkillPool])];
        const maxSkills = primaryClass?.skillChoices || 2;

        return (
          <div className="space-y-6">
            <AbilityScores
              scores={abilityScores}
              onChange={(v) => builderStore.getState().setAbilityScores(v)}
              method={abilityMethod}
              onMethodChange={(v) => builderStore.getState().setAbilityMethod(v)}
            />
            <SkillSelector
              skills={skillsData}
              selected={skills}
              onChange={(v) => builderStore.getState().setSkills(v)}
              maxSelections={maxSkills}
              pool={skillPool}
            />
          </div>
        );
      }

      case 'equipment':
        return (
          <div className="space-y-6">
            <EquipmentPicker
              classId={classes[0]?.id}
              value={equipment}
              onChange={(v) => builderStore.getState().setEquipment(v)}
            />
            <FeatSelector
              feats={featsData}
              value={feats}
              onChange={(v) => builderStore.getState().setFeats(v)}
            />
          </div>
        );

      case 'sheet':
        return (
          <CharacterSheetPreview
            character={{
              name,
              classes,
              backgroundId,
              speciesId,
              abilityScores,
              hp: { current: 0, max: 0, temp: 0 },
              ac: 10,
              savingThrows: {},
              skills: {},
              attacks: [],
              spells,
              features: [],
            }}
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
        currentStep={step}
        completedSteps={completedSteps}
        onStepClick={(id) => {
          const targetIdx = STEPS.indexOf(id as typeof STEPS[number]);
          if (targetIdx !== -1 && (targetIdx <= currentStepIndex || completedSteps.includes(id))) {
            setStep(id as typeof STEPS[number]);
          }
        }}
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
            {step === 'sheet' ? (
              <>
                <Button variant="secondary" onClick={handleSave} disabled={saveMutation.isPending}>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Save Character
                </Button>
                <Button onClick={handleBuild} disabled={buildMutation.isPending || isSubmitting}>
                  {(buildMutation.isPending || isSubmitting) && <LoaderCircleIcon className="h-4 w-4 animate-spin mr-2" />}
                  Build Sheet
                </Button>
              </>
            ) : (
              <Button onClick={handleNext} disabled={isSubmitting}>
                {isSubmitting && <LoaderCircleIcon className="h-4 w-4 animate-spin mr-2" />}
                Next <ChevronRightIcon className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
