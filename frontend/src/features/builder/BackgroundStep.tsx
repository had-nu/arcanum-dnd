import { useContentStore } from '@/stores/contentStore';
import { useBuilderStore } from '@/stores/builderStore';
import { Button, Card, CardTitle, CardMeta, CardTags, ScrollIcon, XIcon } from '@/shared/ui';

export function BackgroundStep() {
  const { draft, setBackground } = useBuilderStore();
  const { backgrounds } = useContentStore();

  if (!draft.backgroundId) {
    return (
      <div className="bg-section">
        <h2 className="sec-title">Choose Background</h2>
        <div className="class-picker" id="bg-picker">
          <div className="picker-header mb-4">
            <input
              type="text"
              placeholder="Search backgrounds..."
              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text)] rounded-[var(--radius)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:border-transparent min-h-[44px]"
            />
          </div>
          <div className="card-grid" id="bg-picker-list">
            {backgrounds.map((bg) => (
              <Card
                key={bg.id!}
                onClick={() => setBackground(bg.id!)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <ScrollIcon size={24} className="text-[var(--text-muted)]" />
                  <CardTitle>{bg.name}</CardTitle>
                </div>
                <CardMeta>Feat: {bg.feat}</CardMeta>
                <CardTags>
                  {bg.skills?.map((s) => <span key={s} className="tag tag-blue">{s}</span>)}
                </CardTags>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const bg = backgrounds.find((b) => b.id === draft.backgroundId);

  return (
    <div className="bg-section">
      <h2 className="sec-title">Background: {bg?.name}</h2>
      <div className="selected-bg-row bg-[var(--bg-surface)]/50 border border-[var(--border)] rounded-[var(--radius-lg)] p-4">
        <div className="selected-bg-hdr flex items-start justify-between mb-4">
          <div>
            <div className="selected-bg-name font-label text-lg text-[var(--text)]">{bg?.name}</div>
            <div className="selected-bg-meta flex gap-2 mt-1">
              <span className="tag tag-gold">Feat: {bg?.feat}</span>
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={() => setBackground('')} aria-label="Remove background"><XIcon size={14} /></Button>
        </div>
        <div className="selected-bg-body">
          <CardMeta>{bg?.skills?.join(', ')}</CardMeta>
        </div>
      </div>
    </div>
  );
}