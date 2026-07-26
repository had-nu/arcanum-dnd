"use client"

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Switch, Route } from 'wouter'
import { useEffect } from 'react'
import { HomePage } from '@/pages/HomePage'
import { BuilderPage } from '@/pages/BuilderPage'
import { CharactersPage } from '@/pages/CharactersPage'
import { CharacterView } from '@/pages/CharacterView'
import { NotFound } from '@/pages/NotFound'
import { AppShell } from '@/components/layout/AppShell'
import { ToastProvider } from '@/components/ui/Toast'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppShell>
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/builder" component={BuilderPage} />
            <Route path="/characters/:name" component={CharacterView} />
            <Route path="/characters" component={CharactersPage} />
            <Route path="*" component={NotFound} />
          </Switch>
        </AppShell>
      </ToastProvider>
    </QueryClientProvider>
  )
}