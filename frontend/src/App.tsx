import { QueryClient, QueryClientProvider } from '@tanstack/preact-query';
import { Switch, Route } from 'wouter';
import { useEffect } from 'preact/hooks';

import { BuilderPage } from '@/pages/BuilderPage';
import { CharactersPage } from '@/pages/CharactersPage';
import { CharacterView } from '@/pages/CharacterView';
import { NotFound } from '@/pages/NotFound';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ToastProvider } from '@/components/ui/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <div class="min-h-screen flex flex-col">
          <Header onThemeToggle={toggleTheme} />
          <main class="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
            <Switch>
              <Route path="/builder" component={BuilderPage} />
              <Route path="/characters/:name" component={CharacterView} />
              <Route path="/characters" component={CharactersPage} />
              <Route path="*" component={NotFound} />
            </Switch>
          </main>
          <Footer />
        </div>
      </ToastProvider>
    </QueryClientProvider>
  );
}