import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon, Dices } from 'lucide-react';

interface HeaderProps {
  onThemeToggle: () => void;
}

export function Header({ onThemeToggle }: HeaderProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved === 'dark' || (!saved && prefersDark);
    setIsDark(dark);
    if (dark) document.documentElement.classList.add('dark');
  }, []);

  const handleThemeToggle = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newDark);
    onThemeToggle();
  };

  return (
    <header className="sticky top-0 z-40 bg-dnd-parchment-100/95 dark:bg-dnd-stone-900/95 backdrop-blur-sm border-b border-dnd-stone-200 dark:border-dnd-stone-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={handleThemeToggle}
              className="p-2 rounded-lg text-dnd-stone-600 hover:bg-dnd-stone-200 dark:text-dnd-stone-400 dark:hover:bg-dnd-stone-800 transition-colors"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
            <a href="/" className="flex items-center gap-2" aria-label="Arcanum Home">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-dnd-blood-600 text-white shadow-lg">
                <Dices className="h-6 w-6" />
              </div>
              <div className="hidden sm:block">
                <span className="font-display font-bold text-xl text-dnd-stone-900 dark:text-dnd-stone-100">Arcanum</span>
                <span className="block font-condensed text-xs text-dnd-stone-500 dark:text-dnd-stone-400 -mt-0.5">D&D 2024 Character Builder</span>
              </div>
            </a>
          </div>
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            <a href="/builder" className="px-3 py-1.5 text-sm font-medium text-dnd-stone-600 dark:text-dnd-stone-400 hover:text-dnd-blood-600 dark:hover:text-dnd-blood-400 rounded-lg transition-colors">
              Builder
            </a>
            <a href="/characters" className="px-3 py-1.5 text-sm font-medium text-dnd-stone-600 dark:text-dnd-stone-400 hover:text-dnd-blood-600 dark:hover:text-dnd-blood-400 rounded-lg transition-colors">
              Characters
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}