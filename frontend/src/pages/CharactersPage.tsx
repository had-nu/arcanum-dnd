import { useState } from 'react';
import { Link } from 'wouter';
import { PlusIcon, Trash2Icon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { clsx } from 'clsx';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useCharacters } from '@/hooks/useContent';
import { useDeleteCharacter } from '@/hooks/useContent';
import { useToast } from '@/components/ui/Toast';

export function CharactersPage() {
  const { toast } = useToast();
  const { data: characters, isLoading, refetch } = useCharacters();
  const deleteMutation = useDeleteCharacter();
  
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'level' | 'updatedAt'>('updatedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = characters
    ?.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      const dir = sortDir === 'asc' ? 1 : -1;
      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return 1 * dir;
      return 0;
    });

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(name);
      toast.success('Character deleted');
      refetch();
    } catch (err) {
      toast.error('Delete failed', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleSort = (key: 'name' | 'level' | 'updatedAt') => {
    if (sortBy === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-dnd-blood-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dnd-stone-900 dark:text-dnd-stone-100 font-condensed">
            Your Characters
          </h1>
          <p className="text-dnd-stone-600 dark:text-dnd-stone-400">
            {characters?.length || 0} character{characters?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/builder">
          <Button>
            <PlusIcon className="h-4 w-4 mr-2" /> New Character
          </Button>
        </Link>
      </div>

      {characters && characters.length > 0 ? (
        <>
          <Card className="mb-4">
            <div className="p-4 space-y-3">
              <Input
                type="search"
                placeholder="Search characters..."
                value={search}
                onChange={e => setSearch(e.currentTarget.value)}
                className="max-w-xs"
              />
              <div className="flex items-center gap-4 text-sm text-dnd-stone-600 dark:text-dnd-stone-400">
                <span>Sort by:</span>
                {(['name', 'level', 'updatedAt'] as const).map(key => (
                  <button
                    key={key}
                    onClick={() => handleSort(key)}
                    className={clsx(
                      'flex items-center gap-1 hover:text-dnd-blood-600 dark:hover:text-dnd-blood-400 transition-colors',
                      sortBy === key && 'text-dnd-blood-600 dark:text-dnd-blood-400 font-medium'
                    )}
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                    {sortBy === key && (
                      sortDir === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            {filtered?.map(char => (
              <CharacterRow
                key={char.name}
                character={char}
                expanded={expanded === char.name}
                onToggle={() => setExpanded(expanded === char.name ? null : char.name)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      ) : (
        <Card className="text-center py-12">
          <PlusIcon className="h-16 w-16 mx-auto text-dnd-stone-300 dark:text-dnd-stone-600 mb-4" />
          <h3 className="text-lg font-semibold text-dnd-stone-900 dark:text-dnd-stone-100 mb-2">
            No characters yet
          </h3>
          <p className="text-dnd-stone-600 dark:text-dnd-stone-400 mb-6">
            Create your first character to get started.
          </p>
          <Link href="/builder">
            <Button size="lg">
              <PlusIcon className="h-5 w-5 mr-2" /> Create Character
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}

function CharacterRow({ 
  character, 
  expanded, 
  onToggle, 
  onDelete 
}: { 
  character: any; 
  expanded: boolean; 
  onToggle: () => void;
  onDelete: (name: string) => void;
}) {
  const classStr = character.classes || '—';
  const updated = character.updatedAt ? new Date(character.updatedAt).toLocaleDateString() : '—';

  return (
    <Card className={clsx('overflow-hidden transition-all', expanded && 'shadow-lg')}>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-dnd-stone-50 dark:hover:bg-dnd-stone-800/50"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-dnd-stone-900 dark:text-dnd-stone-100 truncate">
              {character.name}
            </h3>
            <span className="badge badge-class">{character.level}</span>
            <span className="badge badge-species">{character.species}</span>
            <span className="badge badge-background">{classStr}</span>
          </div>
          <p className="text-sm text-dnd-stone-500 dark:text-dnd-stone-400 mt-1">
            Updated {updated}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onDelete(character.name); }}
            className="p-2 text-dnd-stone-500 hover:text-red-600 hover:bg-dnd-stone-100 dark:hover:bg-dnd-stone-800 rounded-lg transition-colors"
            aria-label={`Delete ${character.name}`}
          >
            <Trash2Icon className="h-5 w-5" />
          </button>
          <ChevronDownIcon className={clsx('h-5 w-5 text-dnd-stone-400 transition-transform', expanded && 'rotate-180')} />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-dnd-stone-200 dark:border-dnd-stone-700 animate-slide-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-dnd-stone-200 dark:border-dnd-stone-700">
            <div>
              <p className="text-xs text-dnd-stone-500 dark:text-dnd-stone-400">Species</p>
              <p className="font-medium">{character.species}</p>
            </div>
            <div>
              <p className="text-xs text-dnd-stone-500 dark:text-dnd-stone-400">Background</p>
              <p className="font-medium">{character.backgroundName || character.backgroundId}</p>
            </div>
            <div>
              <p className="text-xs text-dnd-stone-500 dark:text-dnd-stone-400">Classes</p>
              <p className="font-medium text-sm">{classStr}</p>
            </div>
            <div>
              <p className="text-xs text-dnd-stone-500 dark:text-dnd-stone-400">Progression</p>
              <p className="font-medium capitalize">{character.progressionType}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}