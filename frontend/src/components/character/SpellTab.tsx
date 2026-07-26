"use client"

import { useState, useMemo } from 'react'
import { useBuilderStore, builderStore } from '@/stores/builderStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { SpellEntry } from '@/types/api'

interface SpellTabProps {
  classData: any
  classDef: any
  spells: SpellEntry[]
}

function checkRecommended(spell: SpellEntry, classData: any): boolean {
  const subclassId = classData.subclassId
  if (!subclassId) return false
  
  const affinities: Record<string, { schools: string[] }> = {
    'draconic': { schools: ['evocation'] },
    'wild-magic': { schools: ['transmutation', 'enchantment'] },
    'fiend': { schools: ['evocation', 'conjuration'] },
    'great-old-one': { schools: ['enchantment', 'divination'] },
    'hexblade': { schools: ['abjuration', 'evocation'] },
    'celestial': { schools: ['abjuration', 'evocation', 'divination'] },
    'undead': { schools: ['necromancy', 'evocation'] },
    'genie': { schools: ['evocation', 'conjuration'] },
    'archfey': { schools: ['enchantment', 'illusion'] },
    'fathomless': { schools: ['conjuration', 'evocation', 'transmutation'] },
  }

  const affinity = affinities[subclassId]
  if (!affinity) return false
  return affinity.schools.includes(spell.school)
}

export function SpellTab({ classData, classDef, spells }: SpellTabProps) {
  const {
    classSpellIds: allClassSpellIds,
  } = useBuilderStore()

  const [searchQuery, setSearchQuery] = useState('')

  const isWarlock = classDef?.id === 'warlock'
  const classSpellIds = allClassSpellIds[classDef.id] || []
  const maxKnown = getMaxSpellsKnown(classDef.id, classData.level)
  const maxCantrips = getCantripsKnown(classDef.id, classData.level)
  const pickedCantrips = classSpellIds.filter(id => {
    const spell = spells.find(s => s.id === id)
    return spell && spell.level === 0
  }).length

  if (isWarlock) {
    return (
      <div className="class-body-spells">
        <div className="warlock-known-counter">
          <span className="counter-label">Spells Known: </span>
          <span className="counter-value">
            <strong>{classSpellIds.length}</strong> of <strong>{maxKnown}</strong>
          </span>
          <span className="counter-hint">(Cantrips: {pickedCantrips}/{maxCantrips})</span>
        </div>

        <SpellKnownSection
          classData={classData}
          classDef={classDef}
          spells={spells}
          classSpellIds={classSpellIds}
        />

        <details className="class-spell-details" open>
          <summary className="class-spell-summary">Available Spells</summary>
          <div className="class-spell-picker">
            <div className="picker-search">
              <Input
                placeholder="Search spells..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <SpellPoolBase
              spells={spells}
              classSpellIds={classSpellIds}
              classDef={classDef}
              classData={classData}
              searchQuery={searchQuery}
            />
            <div className="warlock-prep-note">
              <strong>Preparation:</strong> Warlocks do not prepare spells daily. All spells listed above
              (Subclass + Known) are always available to cast with Pact slots.
            </div>
          </div>
        </details>
      </div>
    )
  }

  return (
    <div className="class-body-spells">
      <div className="class-spells-selected-summary">
        Selected: <strong>{classSpellIds.length}</strong> spells
      </div>

      <details className="class-spell-details" open>
        <summary className="class-spell-summary">Available Spells</summary>
        <div className="class-spell-picker">
          <div className="picker-search">
            <Input
              placeholder="Search spells..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <SpellPoolBase
            spells={spells}
            classSpellIds={classSpellIds}
            classDef={classDef}
            classData={classData}
            searchQuery={searchQuery}
          />
        </div>
      </details>
    </div>
  )
}

// Helper components
function SpellKnownSection({
  classData,
  classDef,
  spells,
  classSpellIds,
}: { classData: any; classDef: any; spells: SpellEntry[]; classSpellIds: string[] }) {
  const knownByLevel = classSpellIds
    .map((id: string) => spells.find((s: SpellEntry) => s.id === id))
    .filter((spell): spell is SpellEntry => spell !== undefined)
    .reduce((acc: Record<string, SpellEntry[]>, spell: SpellEntry) => {
      const key = spell.level === 0 ? 'Cantrips' : `${spell.level}${getOrdinalSuffix(spell.level)} Level`
      if (!acc[key]) acc[key] = []
      acc[key].push(spell)
      return acc
    }, {} as Record<string, SpellEntry[]>)

  return (
    <div className="class-spells-selected">
      <div className="spell-known-section">
        <div className="spell-section-header">
          Known Spells
          <span className="section-sub">
            {classSpellIds.length} of {getMaxSpellsKnown(classDef.id, classData.level)}
            (cantrips: {classSpellIds.filter((id: string) => spells.find((s: SpellEntry) => s.id === id)?.level === 0).length}/{getCantripsKnown(classDef.id, classData.level)})
          </span>
        </div>
        {Object.entries(knownByLevel).map(([level, levelSpells]) => (
          <div key={level} className="spell-level-group">
            <div className="spell-level-header">{level} ({levelSpells.length}/{getMaxForLevel(level, classDef.id, classData.level)})</div>
            {levelSpells.map((spell: SpellEntry) => (
              <div key={spell.id} className="picked-row">
                <div className="picked-row-icon">
                  <img src={`/img/spell-schools/${spell.school}.png`} alt={spell.school} width={20} height={20} />
                </div>
                <div className="picked-row-info">
                  <div className="picked-row-name">{spell.name}</div>
                  <div className="picked-row-meta">{spell.school} · {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}</div>
                </div>
                <Button
                  className="picked-row-remove"
                  variant="ghost"
                  size="sm"
                  onClick={() => builderStore.getState().toggleSpell(classDef.id, spell.id)}
                >
                  ✕
                </Button>
              </div>
            ))}
            {levelSpells.length === 0 && (
              <div className="empty-state">No spells selected. Choose from Available Spells below.</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function SpellPoolBase({
  spells,
  classSpellIds,
  classDef,
  classData,
  searchQuery,
}: { spells: SpellEntry[]; classSpellIds: string[]; classDef: any; classData: any; searchQuery: string }) {
  const filteredSpells = useMemo(() => {
    return spells.filter((spell: SpellEntry) => {
      const matchesSearch = spell.name.toLowerCase().includes(searchQuery.toLowerCase())
      const maxLevel = getMaxSpellLevel(classDef.id, classData.level)
      const canLearnByLevel = spell.level <= maxLevel
      return matchesSearch && canLearnByLevel
    })
  }, [spells, searchQuery, classDef.id, classData.level])

  const spellsByLevel = useMemo(() => {
    const grouped: Record<string, SpellEntry[]> = {}
    filteredSpells.forEach((spell: SpellEntry) => {
      const key = spell.level === 0 ? 'Cantrips' : `${spell.level}${getOrdinalSuffix(spell.level)} Level`
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(spell)
    })
    return grouped
  }, [filteredSpells])

  return (
    <div className="spell-pool-base">
      {Object.entries(spellsByLevel).map(([level, levelSpells]) => (
        <div key={level} className="spell-level-group">
          <div className="spell-level-header">
            {level} ({levelSpells.filter((s: SpellEntry) => classSpellIds.includes(s.id)).length}/{getMaxForLevel(level, classDef.id, classData.level)})
          </div>
          {levelSpells.map((spell: SpellEntry) => (
            <SpellPickerRow
              key={spell.id}
              spell={spell}
              isKnown={classSpellIds.includes(spell.id)}
              isRecommended={checkRecommended(spell, classData)}
              isWarlock={false}
              canLearn={spell.level <= getMaxSpellLevel(classDef.id, classData.level)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function SpellPickerRow({
  spell,
  isKnown,
  isRecommended,
  isWarlock,
  canLearn,
}: { spell: SpellEntry; isKnown: boolean; isRecommended: boolean; isWarlock: boolean; canLearn: boolean }) {
  return (
    <div
      className={`picker-row spell-picker-row class-spell-picker-row ${isKnown ? 'selected' : ''} ${!canLearn ? 'disabled' : ''} ${isRecommended ? 'recommended' : ''} ${isWarlock ? 'class-spell' : ''}`}
      data-name={spell.name.toLowerCase()}
    >
      <div className="picker-row-icon">
        <img
          src={`/img/spell-schools/${spell.school}.png`}
          alt={spell.school}
          width={28}
          height={28}
          onError={(e) => e.currentTarget.style.display = 'none'}
        />
      </div>
      <div className="picker-row-info">
        <div className="picker-row-name">{spell.name}</div>
        <div className="picker-row-meta">
          {spell.school} · {spell.time} · {spell.range}
          {spell.concentration && ' · Concentration'}
          {spell.ritual && ' · Ritual'}
        </div>
      </div>
      {isRecommended && (
        <div className="picker-row-badge" title="Subclass affinity">
          Recommended
        </div>
      )}
      {isWarlock && <div className="picker-row-badge class-spell-badge" title="Warlock spell">Warlock</div>}
      <div className="picker-row-arrow">
        {isKnown ? '✓' : !canLearn ? '⚠' : '+'}
      </div>
    </div>
  )
}

// Helper functions
function getMaxSpellsKnown(classId: string, level: number): number {
  if (classId === 'warlock') {
    const known: Record<number, number> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 10, 11: 11, 12: 11, 13: 12, 14: 12, 15: 13, 16: 13, 17: 14, 18: 14, 19: 15, 20: 15 }
    return known[level] || 2
  }
  return 0
}

function getCantripsKnown(classId: string, level: number): number {
  if (classId === 'warlock') {
    const cantrips: Record<number, number> = { 1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 4, 11: 4, 12: 4, 13: 4, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4, 20: 4 }
    return cantrips[level] || 2
  }
  return 0
}

function getMaxSpellLevel(classId: string, level: number): number {
  if (classId === 'warlock') {
    const pactMagic: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4, 9: 5, 10: 5, 11: 5, 12: 5, 13: 5, 14: 5, 15: 5, 17: 5, 19: 5, 20: 5 }
    return pactMagic[level] || 1
  }
  return Math.floor((level + 1) / 2)
}

function getMaxForLevel(level: string, classId: string, charLevel: number): number {
  const levelNum = level === 'Cantrips' ? 0 : parseInt(level)
  return levelNum === 0 ? getCantripsKnown(classId, charLevel) : 2
}

function getOrdinalSuffix(n: number): string {
  if (n === 1) return 'st'
  if (n === 2) return 'nd'
  if (n === 3) return 'rd'
  return 'th'
}

