"use client"

import { useCallback } from 'react'
import { useLocation } from 'wouter'
import { Header } from '@/components/layout/Header'
import { StepsNav } from '@/components/layout/StepsNav'
import { ToastContainer } from '@/components/ui/Toast'
import { useBuilderStore } from '@/stores/builderStore'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [pathname] = useLocation()
  const { step, completedSteps } = useBuilderStore()
  
  const handleThemeToggle = useCallback(() => {
    const isDark = document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [])
  
  const isBuilderPage = pathname === '/builder'
  const isCharactersPage = pathname === '/characters' || pathname.startsWith('/characters/')
  
  return (
    <div className="app-container">
      <Header onThemeToggle={handleThemeToggle} />
      
      {isBuilderPage && (
        <StepsNav 
          currentStep={step}
          completedSteps={completedSteps}
        />
      )}
      {isCharactersPage && (
        <StepsNav 
          currentStep="name"
          completedSteps={[]}
        />
      )}
      
      <main className="main-content">
        <div className="container">
          {children}
        </div>
      </main>
      
      <ToastContainer />
    </div>
  )
}