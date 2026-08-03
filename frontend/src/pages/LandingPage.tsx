import { useNavigate } from 'react-router-dom';
import { useContentStore } from '@/stores/contentStore';
import { Button, Card, Input, Select } from '@/shared/ui';

export function LandingPage() {
  const navigate = useNavigate();
  const { classes, species } = useContentStore();

  const totalCharacters = 0;
  const recentCharacters = [] as any[];

  return (
    <div className="min-h-screen bg-[var(--bg-root)] text-[var(--text)]">
      <header className="nav sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg-root)]">
        <div className="container bar h-[60px] flex items-center justify-between">
          <button className="logo flex flex-col items-start line-height-[1] bg-none border-none cursor-pointer" onClick={() => navigate('/')}>
            <span className="top text-[var(--red)] text-xs tracking-wider font-bold">D&D</span>
            <span className="main text-[18px] tracking-[0.02em] -mt-[2px] font-heading">
              Arcanum
            </span>
          </button>
          <div className="nav-icons flex items-center gap-5 text-[var(--text-muted)]">
            <button aria-label="Search" className="bg-none border-none text-inherit cursor-pointer flex">
              <svg viewBox="0 0 24 24" width="19" height="19" stroke="currentColor" fill="none" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
            <button aria-label="Settings" className="bg-none border-none text-inherit cursor-pointer flex">
              <svg viewBox="0 0 24 24" width="19" height="19" stroke="currentColor" fill="none" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <div className="avatar w-8 h-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" fill="none" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="container py-8 pb-16">
        <div className="breadcrumb inline-flex items-center gap-1.5 px-3 py-1 mb-6 border border-[var(--border)] rounded-full text-[var(--text-muted)] text-xs font-bold tracking-wider uppercase">
          <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" fill="none" strokeWidth="2">
            <path d="M8 21h8a2 2 0 0 0 2-2V9.83a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2V21a2 2 0 0 0 2 2z" />
          </svg>
          My Characters
        </div>

        <div className="head-row flex flex-wrap items-start justify-between gap-4 mb-2">
          <h1 className="title font-heading text-[36px] text-[var(--text)]">
            My Characters
          </h1>
          <Button variant="primary" onClick={() => navigate('/builder/new')}>
            <span>+ Create a character</span>
          </Button>
        </div>

        <div className="meta-row flex flex-wrap items-center justify-between gap-3 mb-8 text-base">
          <div className="slots">
            <span className="text-[var(--text-muted)]">Total: <b className="text-[var(--blue)]">{totalCharacters}</b> characters</span>
          </div>
          <a href="#" className="text-[var(--text-muted)] hover:text-[var(--text)] inline-flex items-center gap-1.5 text-sm">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            View all
          </a>
        </div>

        <div className="controls flex flex-wrap gap-3 mb-8">
          <Input
            placeholder="Search characters..."
            className="flex-1 min-w-[240px]"
          />
          <Select
            options={classes?.filter((c): c is typeof c & { id: string; name: string } => !!c.id && !!c.name).map((c) => ({ value: c.id, label: c.name })) || []}
            placeholder="All Classes"
            className="min-w-[160px]"
          />
          <Select
            options={species?.filter((s): s is typeof s & { id: string; name: string } => !!s.id && !!s.name).map((s) => ({ value: s.id, label: s.name })) || []}
            placeholder="All Species"
            className="min-w-[160px]"
          />
        </div>

        {recentCharacters.length === 0 ? (
          <div className="empty-state text-center py-16">
            <h3 className="font-heading text-xl text-[var(--text)] mb-2">
              No characters yet
            </h3>
            <p className="text-[var(--text-muted)] mb-6">
              Your vault is empty. Create your first hero to begin.
            </p>
            <Button variant="primary" onClick={() => navigate('/builder/new')} className="px-6 py-3">
              Create Character
            </Button>
          </div>
        ) : (
          <div className="grid gap-6" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'}}>
            {recentCharacters.map((char) => (
              <CharacterCard key={char.name} character={char} onEdit={() => navigate(`/builder/${char.name}`)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function CharacterCard({ character, onEdit }: { character: any; onEdit: () => void }) {
  const primaryClass = character.classes?.[0];
  const classId = primaryClass?.id || 'fighter';
  const speciesName = character.species || 'Human';

  return (
    <Card className="card border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--bg-surface)] hover:border-[var(--red)] transition-colors cursor-pointer" onClick={onEdit}>
      <div className="card-art relative h-32 bg-gradient-to-b from-[var(--bg-elevated)] to-black flex items-end p-4">
        <div className="absolute inset-0 bg-black/30" />
        <div className="card-id relative flex items-center gap-3">
          <div className="card-glyph w-11 h-11 rounded-full bg-[var(--bg-input)] border-2 border-[var(--gold)] flex items-center justify-center text-xl">
            <img src={`/img/classes/${classId}.svg`} alt="" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <div>
            <div className="card-name text-white font-bold text-lg leading-tight">{character.name}</div>
            <div className="card-sub text-[var(--text-muted)] text-sm mt-0.5">{primaryClass?.name || 'Unknown'} / {speciesName}</div>
          </div>
        </div>
      </div>
      <div className="card-actions flex border-t border-[var(--border)] text-xs font-bold tracking-wider uppercase">
        <button className="flex-1 py-2.5 bg-none border-none cursor-pointer text-[var(--text-muted)] border-r border-[var(--border)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)] transition-colors">
          View
        </button>
        <button className="flex-1 py-2.5 bg-none border-none cursor-pointer text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text)] transition-colors">
          Edit
        </button>
        <button className="flex-1 py-2.5 bg-none border-none cursor-pointer text-[var(--red)] hover:bg-[var(--bg-hover)] hover:text-[var(--red)] transition-colors delete" aria-label="Delete character">
          Delete
        </button>
      </div>
    </Card>
  );
}