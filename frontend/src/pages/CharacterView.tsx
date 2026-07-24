import { useParams, Link, useLocation } from 'wouter';
import { Printer, ClipboardPen, Trash2, Download } from 'lucide-preact';

import { CharacterSheetPreview } from '@/components/character/CharacterSheetPreview';
import { Button } from '@/components/ui/Button';
import { useCharacter } from '@/hooks/useContent';
import { useDeleteCharacter } from '@/hooks/useContent';
import { useToast } from '@/components/ui/Toast';

export function CharacterView() {
  const [, navigate] = useLocation();
  const { name } = useParams<{ name: string }>();
  const { toast } = useToast();
  const { data: character, isLoading, error } = useCharacter(name || '');
  const deleteMutation = useDeleteCharacter();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this character?')) return;
    try {
      await deleteMutation.mutateAsync(name!);
      toast.success('Character deleted');
      navigate('/characters');
    } catch (err) {
      toast.error('Delete failed', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handlePrint = () => {
    setTimeout(() => window.print(), 100);
  };

  const handleDownload = () => {
    // YAML download would go here
    toast.info('YAML download coming soon');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-dnd-blood-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-dnd-stone-900 dark:text-dnd-stone-100 mb-2">
          Character Not Found
        </h2>
        <p className="text-dnd-stone-600 dark:text-dnd-stone-400 mb-4">
          The character "{name}" could not be found.
        </p>
        <Link href="/characters">
          <Button variant="primary">Back to Characters</Button>
        </Link>
      </div>
    );
  }

  const content = { 
    classes: [], species: [], backgrounds: [], 
    skills: [], spells: { cantrips: [], leveled: [] }, feats: {} 
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dnd-stone-900 dark:text-dnd-stone-100 font-condensed">
            {character.name}
          </h1>
          <p className="text-dnd-stone-600 dark:text-dnd-stone-400">
            Level {character.level} • {character.classes?.map((c: any) => c.name).join(' / ')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" /> YAML
          </Button>
          <Link href={`/builder?name=${encodeURIComponent(name!)}`}>
            <Button variant="secondary">
              <ClipboardPen className="h-4 w-4 mr-2" /> Edit
            </Button>
          </Link>
          <Button variant="danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      <CharacterSheetPreview character={character} content={content} />
    </div>
  );
}