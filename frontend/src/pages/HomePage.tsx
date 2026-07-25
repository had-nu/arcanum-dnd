import { Link } from 'wouter';
import { PlusIcon, SwordsIcon, BookOpenIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useCharacters } from '@/hooks/useContent';
import { builderStore } from '@stores/builderStore';

export function HomePage() {
  const { data: characters } = useCharacters();

  const handleNewCharacter = () => {
    builderStore.getState().reset();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4 py-8">
        <div className="flex items-center justify-center w-20 h-20 mx-auto rounded-2xl bg-dnd-blood-600 text-white shadow-xl shadow-dnd-blood-600/30">
          <SwordsIcon className="h-10 w-10" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-dnd-stone-900 dark:text-dnd-stone-100 font-display">
            Arcanum
          </h1>
          <p className="text-lg text-dnd-stone-600 dark:text-dnd-stone-400 mt-2">
            D&D 2024 Character Builder
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/builder">
          <Card className="group cursor-pointer hover:shadow-lg hover:border-dnd-blood-300 dark:hover:border-dnd-blood-700 transition-all duration-200" onClick={handleNewCharacter}>
            <div className="p-6 flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-dnd-blood-100 dark:bg-dnd-blood-900/30 text-dnd-blood-600 dark:text-dnd-blood-400 group-hover:bg-dnd-blood-600 group-hover:text-white transition-colors">
                <PlusIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-dnd-stone-900 dark:text-dnd-stone-100">New Character</h3>
                <p className="text-sm text-dnd-stone-500 dark:text-dnd-stone-400">Start creating a new character</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/characters">
          <Card className="group cursor-pointer hover:shadow-lg hover:border-dnd-gold-300 dark:hover:border-dnd-gold-700 transition-all duration-200">
            <div className="p-6 flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-dnd-gold-100 dark:bg-dnd-gold-900/30 text-dnd-gold-600 dark:text-dnd-gold-400 group-hover:bg-dnd-gold-600 group-hover:text-white transition-colors">
                <BookOpenIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-dnd-stone-900 dark:text-dnd-stone-100">Character Vault</h3>
                <p className="text-sm text-dnd-stone-500 dark:text-dnd-stone-400">
                  {characters?.length || 0} saved character{(characters?.length || 0) !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {characters && characters.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-dnd-stone-500 dark:text-dnd-stone-400 uppercase tracking-wider">
            Recent Characters
          </h2>
          {characters.slice(0, 5).map(char => (
            <Link key={char.name} href={`/characters/${encodeURIComponent(char.name)}`}>
              <Card className="cursor-pointer hover:shadow-md transition-all duration-150">
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-dnd-stone-900 dark:text-dnd-stone-100">{char.name}</h3>
                    <p className="text-sm text-dnd-stone-500 dark:text-dnd-stone-400">
                      Level {char.level} &middot; {char.classes} &middot; {char.species}
                    </p>
                  </div>
                  <span className="text-dnd-stone-400 dark:text-dnd-stone-500">&#10132;</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
