import { useBuilderStore } from '@/stores/builderStore';
import { useContentStore } from '@/stores/contentStore';

export function TopChrome() {
  const { preview, draft } = useBuilderStore();
  const { classes: allClasses } = useContentStore();
  const totalLevel = draft.classes.reduce((sum, c) => sum + c.level, 0);

  const maxHP = preview?.hp?.max ?? 0;
  const ac = preview?.ac ?? 10;
  const hitDice = draft.classes.map((c) => {
    const classDef = allClasses.find((cl) => cl.id === c.id);
    return classDef ? `d${classDef.hitDie}` : 'd?';
  }).join(' / ');

  if (!draft.name && draft.classes.length === 0) return null;

  return (
    <header className="sticky top-[60px] z-30 bg-stone-900/95 backdrop-blur-sm border-b border-stone-700 px-4 py-3">
      <div className="container mx-auto flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <h1 className="font-heading text-xl text-white truncate">{draft.name || 'Unnamed Character'}</h1>
          <span className="px-3 py-1 bg-red-600 text-white text-sm font-label rounded-full">Level {totalLevel}</span>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-stone-400">
            <span className="font-label text-white">HP:</span>
            <span className="text-lg font-bold text-white">{maxHP}</span>
          </div>
          <div className="flex items-center gap-2 text-stone-400">
            <span className="font-label text-white">AC:</span>
            <span className="text-lg font-bold text-white">{ac}</span>
          </div>
          <div className="flex items-center gap-2 text-stone-400">
            <span className="font-label text-white">Hit Dice:</span>
            <span className="font-mono text-white">{hitDice}</span>
          </div>

          {preview && preview.spellSlots && (
            <div className="flex items-center gap-2 text-stone-400">
              <span className="font-label text-white">Slots:</span>
              <span className="font-mono text-white text-xs">
                {Object.entries(preview.spellSlots)
                  .filter(([k]) => parseInt(k) > 0)
                  .map(([level, count]) => `L${level}:${count}`)
                  .join(' ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}