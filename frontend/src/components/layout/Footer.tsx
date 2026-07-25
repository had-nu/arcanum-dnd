import { Dices, ExternalLink, BookOpen } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-dnd-stone-200 dark:border-dnd-stone-700 bg-dnd-parchment-50 dark:bg-dnd-stone-950">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-dnd-stone-600 dark:text-dnd-stone-400">
          <div className="flex items-center gap-3">
            <Dices className="h-5 w-5 text-dnd-blood-600 dark:text-dnd-blood-400" />
            <span className="font-display font-bold text-dnd-stone-900 dark:text-dnd-stone-100">Arcanum</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/had-nu/arcanum-dnd" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-dnd-blood-600 dark:hover:text-dnd-blood-400 transition-colors">
              <ExternalLink className="h-4 w-4" />
              <span>GitHub</span>
            </a>
            <a href="https://dnd.wizards.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-dnd-blood-600 dark:hover:text-dnd-blood-400 transition-colors">
              <BookOpen className="h-4 w-4" />
              <span>D&D 5.5e SRD</span>
            </a>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-dnd-stone-500 dark:text-dnd-stone-500">
          Built with Go, React, TypeScript, and Tailwind CSS. Not affiliated with Wizards of the Coast.
        </p>
      </div>
    </footer>
  );
}