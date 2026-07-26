"use client"

import { useEffect, useState } from 'react'

interface HeaderProps {
  onThemeToggle: () => void
}

export function Header({ onThemeToggle }: HeaderProps) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = saved === 'dark' || (!saved && prefersDark)
    setIsDark(dark)
    if (dark) document.documentElement.classList.add('dark')
  }, [])

  const handleThemeToggle = () => {
    const newDark = !isDark
    setIsDark(newDark)
    localStorage.setItem('theme', newDark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', newDark)
    onThemeToggle()
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="logo">
          <div className="logo-icon"></div>
          <span className="logo-text">Arcanum</span>
        </div>
        <span className="header-sub">D&D 2024 Character Builder</span>
        <button
          onClick={handleThemeToggle}
          className="btn btn-sm"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m9-7v-1m0 16v1M5 8h2a1 1 0 100 0-2-2H5a1 1 0 00-2 2h2z"/>
            </svg>
          </> : <>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9 9 0 0012 21a9 9 0 0011-9z"/>
            </svg>
          </>}
        </button>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-dnd-stone-200 dark:border-dnd-stone-700 bg-dnd-parchment-50 dark:bg-dnd-stone-950">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-dnd-stone-600 dark:text-dnd-stone-400">
          <div className="flex items-center gap-3">
            <div className="text-dnd-blood-600 dark:text-dnd-blood-400">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 11-14 0 7 7 0 0114 0zM9 10a1 1 0 000 2h6a1 1 0 100-2H9z"/>
              </svg>
            </div>
            <span className="font-bold text-dnd-stone-900 dark:text-dnd-stone-100">Arcanum</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/had-nu/arcanum-dnd" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-dnd-blood-600 dark:hover:text-dnd-blood-400 transition-colors">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 20"/>
              </svg>
              <span>GitHub</span>
            </a>
            <a href="https://dnd.wizards.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-dnd-blood-600 dark:hover:text-dnd-blood-400 transition-colors">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C17.168 5.477 18.754 5 20.5 5c1.746 0 3.332.477 4.5 1.253v13C21.832 18.477 20.246 18 19.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
              <span>D&D 5.5e SRD</span>
            </a>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-dnd-stone-500 dark:text-dnd-stone-500">
          Built with Go, React, TypeScript, and Tailwind CSS. Not affiliated with Wizards of the Coast.
        </p>
      </div>
    </footer>
  )
}