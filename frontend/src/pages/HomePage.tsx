"use client"

import { useLocation } from 'wouter'
import { useCharacters } from '@/hooks/useContent'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export function HomePage() {
  const { data: characters = [], isLoading } = useCharacters()
  const [, navigate] = useLocation()

  const handleLoadCharacter = (name: string) => {
    navigate(`/characters/${name}`)
  }

  const handleDeleteCharacter = (name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Delete "${name}"? This cannot be undone.`)) {
      // TODO: implement delete
      console.log('Delete character:', name)
    }
  }

  return (
    <div className="home-page">
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">D&D 2024 Character Builder</div>
            <h1 className="hero-title">
              <span className="hero-logo">
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114-14 7 7 0 01-14 14z" clipRule="evenodd" />
                </svg>
                Arcanum
              </span>
            </h1>
            <p className="hero-subtitle">
              Create, manage, and share D&D 5.5e characters with a modern 7-step builder.
            </p>
            <div className="hero-actions">
              <Button size="lg" onClick={() => navigate('/builder')} className="btn-hero-primary">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Character
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/characters')} className="btn-hero-secondary">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Load Character
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="feature-title">7-Step Wizard</h3>
              <p className="feature-desc">Guided creation from Name to Sheet with validation at each step</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 0l-.707.707M12 16h.01M12 8h.01" />
                </svg>
              </div>
              <h3 className="feature-title">Complete Spell System</h3>
              <p className="feature-desc">Full spell management with Warlock pact magic, subclass affinity, and prepared/known spells</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <h3 className="feature-title">Export & Share</h3>
              <p className="feature-desc">Export to YAML, print character sheets, or share via URL</p>
            </div>
          </div>
        </div>
      </section>

      <section className="recent-characters">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Your Characters</h2>
            <div className="section-actions">
              {characters.length > 0 && (
                <Button variant="ghost" onClick={() => navigate('/characters')}>
                  View All
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="characters-loading">
              <div className="skeleton-card"></div>
              <div className="skeleton-card"></div>
              <div className="skeleton-card"></div>
            </div>
          ) : characters.length > 0 ? (
            <div className="characters-grid">
              {characters.map((ch) => (
                <CharacterCard
                  key={ch.name}
                  character={ch}
                  onLoad={() => handleLoadCharacter(ch.name)}
                  onDelete={(e) => handleDeleteCharacter(ch.name, e)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <h3>No Characters Yet</h3>
              <p>Create your first hero to begin your adventure</p>
              <Button onClick={() => navigate('/builder')} className="mt-4">
                Create Your First Hero
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function CharacterCard({ character, onLoad, onDelete }: { character: any; onLoad: () => void; onDelete: (e: React.MouseEvent) => void }) {
  return (
    <Card className="character-card" onClick={onLoad}>
      <div className="character-header">
        <div className="character-name">{character.name}</div>
        <button
          className="character-delete"
          onClick={onDelete}
          aria-label={`Delete ${character.name}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v12m-6 0h12m-6 0h6" />
          </svg>
        </button>
      </div>
      <div className="character-meta">
        <span className="character-level">Level {character.level}</span>
        <span className="character-class">{character.classes}</span>
        <span className="character-species">{character.species}</span>
      </div>
      <div className="character-actions">
        <Button variant="primary" size="sm" className="w-full">
          Continue
        </Button>
      </div>
    </Card>
  )
}