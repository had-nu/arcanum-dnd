import { QueryClient, QueryClientProvider } from '@tanstack/preact-query';
import { SignalProvider } from 'preact/signals';
import { Router } from 'wouter';
import { useEffect } from 'preact/hooks';

import { BuilderPage } from '@pages/BuilderPage';
import { CharactersPage } from '@pages/CharactersPage';
import { CharacterView } from '@pages/CharacterView';
import { NotFound } from '@pages/NotFound';
import { Header } from '@components/layout/Header';
import { Footer } from '@components/layout/Footer';
import { ToastContainer } from '@components/ui/ToastContainer';

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
    <SignalProvider>
      <QueryClientProvider client={queryClient}>
        <div class="min-h-screen flex flex-col">
          <Header onThemeToggle={toggleTheme} />
          <main class="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
            <Router>
              <BuilderPage path="/builder" />
              <CharactersPage path="/characters" />
              <CharacterView path="/characters/:name" />
              <NotFound path="*" />
            </Router>
          </main>
          <Footer />
          <ToastContainer />
        </div>
      </QueryClientProvider>
    </SignalProvider>
  );
}