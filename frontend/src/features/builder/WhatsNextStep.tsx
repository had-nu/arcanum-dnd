import { useBuilderStore } from '@/stores/builderStore';
import { Card, CheckIcon, ScrollIcon, TheaterIcon } from '@/shared/ui';

export function WhatsNextStep() {
  const { pendingChoices, preview, draft } = useBuilderStore();

  return (
    <div className="whatsnext-section">
      <h2 className="sec-title">What's Next?</h2>
      {pendingChoices.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-4"><CheckIcon size={48} className="text-[var(--green)]" /></div>
          <h3 className="font-heading text-xl text-[var(--text)] mb-2">All choices complete!</h3>
          <p className="text-[var(--text-muted)]">Your character is ready to adventure.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingChoices.map((choice, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--red)]/20 flex items-center justify-center text-[var(--red)]">
                  {choice.type === 'subclass' && <TheaterIcon size={24} className="text-[var(--red)]" />}
                  {choice.type === 'spell' && <ScrollIcon size={24} className="text-[var(--red)]" />}
                  {choice.type === 'ability-improvement' && (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--red)]">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-label text-[var(--text)]">{choice.name}</h4>
                  <p className="text-[var(--text-muted)] text-sm mt-1">{choice.description}</p>
                  {choice.options.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {choice.options.map((opt) => (
                        <button
                          key={opt.id}
                          className="px-3 py-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded text-sm text-[var(--text-muted)] hover:border-[var(--red)] hover:bg-[var(--bg-elevated)]/50"
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

      <div className="mt-8 p-4 bg-[var(--bg-surface)]/50 border border-[var(--border)] rounded-[var(--radius-lg)]">
        <h3 className="font-label text-[var(--gold)] mb-2">Character Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-[var(--text-muted)]">Level</span>
            <div className="text-[var(--text)] font-bold">{draft.classes.reduce((s, c) => s + c.level, 0)}</div>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">HP</span>
            <div className="text-[var(--text)] font-bold">{preview?.hp?.max || '—'}</div>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">AC</span>
            <div className="text-[var(--text)] font-bold">{preview?.ac || '—'}</div>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Spell Slots</span>
            <div className="text-[var(--text)] font-bold text-xs">
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