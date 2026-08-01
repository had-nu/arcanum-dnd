import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/endpoints';
import { Card, Button, Input, ScrollIcon } from '@/shared/ui';

export function VaultPage() {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCharacters();
  }, []);

  async function loadCharacters() {
    try {
      const data = await api.listCharacters();
      setCharacters(data || []);
    } catch (error) {
      console.error('Failed to load characters:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = characters.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="characters-loading grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-6 bg-[var(--bg-elevated)] rounded w-3/4 mb-2" />
            <div className="h-4 bg-[var(--bg-elevated)] rounded w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <main id="main-content" className="vault-page">
      <div className="section-header flex items-center justify-between mb-8">
        <h2 className="section-title font-heading text-2xl text-[var(--text)]">My Characters</h2>
        <Button variant="primary" onClick={() => navigate('/builder/new')}>
          + New Character
        </Button>
      </div>

      <Input
        placeholder="Search characters..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6 max-w-md"
      />

      {filtered.length === 0 ? (
        <div className="empty-state text-center py-16">
          <div className="empty-icon mb-4 opacity-50"><ScrollIcon size={64} className="text-[var(--text-dim)]" /></div>
          <h3 className="font-heading text-xl text-[var(--text)] mb-2">No characters yet</h3>
          <p className="text-[var(--text-muted)] mb-6">Create your first hero to begin your adventure</p>
          <Button variant="primary" onClick={() => navigate('/builder/new')}>
            Create Character
          </Button>
        </div>
      ) : (
        <div className="characters-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((char) => (
            <CharacterCard key={char.name} character={char} onEdit={() => navigate(`/builder/${char.name}`)} />
          ))}
        </div>
      )}
      </main>
  );
}

function CharacterCard({ character, onEdit }: { character: any; onEdit: () => void }) {
  const totalLevel = character.level || 1;

  return (
    <Card onClick={onEdit} className="character-card">
      <div className="character-header flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
        <div className="character-name font-label text-lg text-[var(--text)]">{character.name}</div>
        <div className="character-delete">
          <button className="text-[var(--text-dim)] hover:text-[var(--red)] transition-colors p-1" onClick={(e) => e.stopPropagation()} aria-label="Delete character">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
      <div className="character-meta flex flex-wrap gap-2 mb-4">
        <span className="character-level tag tag-gold">Level {totalLevel}</span>
        <span className="character-species tag tag-green">{character.species || '—'}</span>
      </div>
      <div className="character-actions">
        <Button variant="primary" size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
          Edit
        </Button>
      </div>
    </Card>
  );
}