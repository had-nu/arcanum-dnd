"use client"

import { useState } from 'react'
import { useLocation } from 'wouter'
import { useCharacters } from '@/hooks/useContent'

export function HomePage() {
  const [name, setName] = useState('')
  const { data: characters = [], isLoading } = useCharacters()
  const [, navigate] = useLocation()

  const handleCreate = () => {
    if (name.trim()) {
      navigate('/builder')
    }
  }

  return (
    <div className="name-section">
      <h2 className="sec-title">
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114-14 7 7 0 01-14 14z" clipRule="evenodd" />
        </svg>
        Character Name
      </h2>

      <div className="form-group" style={{ maxWidth: '400px' }}>
        <label className="form-label">Name your hero</label>
        <input
          type="text"
          className="form-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Kaelen Dawnbringer"
          autoFocus
        />
      </div>

      <div className="actions">
        <button className="btn btn-primary" onClick={handleCreate} disabled={!name.trim()}>
          Next
        </button>
      </div>

      {isLoading ? (
        <div>Loading saved characters...</div>
      ) : characters.length > 0 && (
        <div className="saved-chars-section">
          <div className="saved-chars-divider">
            <span>or load a saved character</span>
          </div>
          <div className="saved-chars-list">
            {characters.map((ch) => (
              <div
                key={ch.name}
                className="saved-char-row"
                onClick={() => navigate(`/characters/${ch.name}`)}
              >
                <div className="saved-char-info">
                  <div className="saved-char-name">{ch.name}</div>
                  <div className="saved-char-meta">
                    Level {ch.level} · {ch.classes} · {ch.species}
                  </div>
                </div>
                <div className="saved-char-arrow">➔</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}