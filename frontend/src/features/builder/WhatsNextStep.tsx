import { useBuilderStore } from '@/stores/builderStore';
import { Card } from '@/shared/ui';

export function WhatsNextStep() {
  const { pendingChoices, preview, draft } = useBuilderStore();

  return (
    <div className="whatsnext-section">
      <h2 className="sec-title">What's Next?</h2>
      {pendingChoices.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="font-heading text-xl text-white mb-2">All choices complete!</h3>
          <p className="text-stone-400">Your character is ready to adventure.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingChoices.map((choice, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center text-red-500">
                  {choice.type === 'subclass' && '🎭'}
                  {choice.type === 'spell' && '📜'}
                  {choice.type === 'ability-improvement' && '⬆️'}
                </div>
                <div className="flex-1">
                  <h4 className="font-label text-white">{choice.name}</h4>
                  <p className="text-stone-400 text-sm mt-1">{choice.description}</p>
                  {choice.options.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {choice.options.map((opt) => (
                        <button
                          key={opt.id}
                          className="px-3 py-1 bg-stone-800 border border-stone-700 rounded text-sm text-stone-300 hover:border-red-500 hover:bg-stone-800/50"
                        >
                          {opt.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-stone-900/50 border border-stone-700 rounded-lg">
        <h3 className="font-label text-amber-500 mb-2">Character Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-stone-400">Level</span>
            <div className="text-white font-bold">{draft.classes.reduce((s, c) => s + c.level, 0)}</div>
          </div>
          <div>
            <span className="text-stone-400">HP</span>
            <div className="text-white font-bold">{preview?.hp?.max || '—'}</div>
          </div>
          <div>
            <span className="text-stone-400">AC</span>
            <div className="text-white font-bold">{preview?.ac || '—'}</div>
          </div>
          <div>
            <span className="text-stone-400">Spell Slots</span>
            <div className="text-white font-bold text-xs">
              {preview?.spellSlots
                ? Object.entries(preview.spellSlots)
                    .filter(([k]) => parseInt(k) > 0)
                    .map(([l, c]) => `L${l}:${c}`)
                    .join(' ')
                : '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}