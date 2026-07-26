import { useEffect } from 'react'
import { useSearchParams, useLocation } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import { useBuilderStore, builderStore, getBuilderRequest } from '@/stores/builderStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SpellTab } from '@/components/character/SpellTab'

const steps = [
  { id: 'name', label: 'Name' },
  { id: 'class', label: 'Class' },
  { id: 'background', label: 'Background' },
  { id: 'species', label: 'Species' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'sheet', label: 'Sheet' },
]

export function BuilderPage() {
  const [searchParams] = useSearchParams()
  const [, ] = useLocation()

  const {
    step,
    name,
    setStep,
    setName,
    classes,
    removeClass,
    setClassLevel,
    setClassTab,
    setSubclass,
    backgroundId,
    setBackgroundId,
    speciesId,
    setSpeciesId,
    abilityScores,
    setAbilityScores,
  } = useBuilderStore()

  const { data: content, isLoading: contentLoading } = useQuery({
    queryKey: ['content'],
    queryFn: async () => {
      const response = await fetch('/api/content')
      if (!response.ok) throw new Error('Failed to fetch content')
      return response.json()
    },
    staleTime: 1000 * 60 * 5,
  })

  const { data: spellsData = { spells: [] }, isLoading: spellsLoading } = useQuery({
    queryKey: ['spells'],
    queryFn: async () => {
      const response = await fetch('/api/spells')
      if (!response.ok) throw new Error('Failed to fetch spells')
      return response.json()
    },
    staleTime: 1000 * 60 * 5,
  })

  const currentStepIndex = steps.findIndex(s => s.id === step)

  const canProceed = () => {
    switch (step) {
      case 'name': return name.trim()
      case 'class': return classes.length > 0
      case 'background': return !!backgroundId
      case 'species': return !!speciesId
      case 'abilities': return Object.values(abilityScores).every(v => typeof v === 'number' && v > 0)
      case 'equipment': return classes.length > 0
      case 'sheet': return true
      default: return false
    }
  }

  const goToStep = (targetStep: string) => {
    if (targetStep === step) return
    if (targetStep === 'class' && !canProceed()) return
    setStep(targetStep as any)
    window.scrollTo(0, 0)
  }

  useEffect(() => {
    const savedName = searchParams.get('name')
    const savedClasses = searchParams.get('classes')
    const savedBackground = searchParams.get('background')
    const savedSpecies = searchParams.get('species')

    if (savedName) setName(savedName)
    if (savedClasses) {
        try {
          const parsed = JSON.parse(savedClasses)
          builderStore.setState({ classes: parsed })
        } catch (e) {
          console.error('Failed to parse classes from URL:', e)
        };
      }
    if (savedBackground) setBackgroundId(savedBackground)
    if (savedSpecies) setSpeciesId(savedSpecies)
  }, [searchParams, setName, setBackgroundId, setSpeciesId])

  const renderStepsNav = () => (
    <nav className="steps-bar" aria-label="Character creation steps">
      <div className="container steps-inner">
        {steps.map((s, index) => {
          const isCompleted = index < currentStepIndex
          const isActive = s.id === step
          const isAccessible = index <= currentStepIndex + 1

          return (
            <button
              key={s.id}
              className={`step ${isCompleted ? 'done' : ''} ${isActive ? 'active' : ''}`}
              onClick={() => isAccessible && goToStep(s.id)}
              disabled={!isAccessible}
              aria-current={isActive ? 'step' : undefined}
            >
              {s.label}
            </button>
          )
        })}
      </div>
    </nav>
  )

  if (contentLoading || spellsLoading) {
    return <div className="loading">Loading content...</div>
  }

  return (
    <div className="builder-page">
      {renderStepsNav()}

      <main className="main-content">
        <div className="container">
          {step === 'name' && renderNameStep()}
          {step === 'class' && renderClassStep()}
          {step === 'background' && renderBackgroundStep()}
          {step === 'species' && renderSpeciesStep()}
          {step === 'abilities' && renderAbilitiesStep()}
          {step === 'equipment' && renderEquipmentStep()}
          {step === 'sheet' && renderSheetStep()}
        </div>
      </main>
    </div>
  )

  function renderNameStep() {
    return (
      <div className="name-section">
        <h2 className="sec-title">Character Name</h2>

        <div className="form-group" style={{ maxWidth: '400px' }}>
          <label className="form-label">Name your hero</label>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Kaelen Dawnbringer"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && canProceed() && goToStep('class')}
          />
        </div>

        <div className="actions">
          <Button variant="primary" onClick={() => goToStep('class')} disabled={!canProceed()}>
            Next
          </Button>
        </div>
      </div>
    )
  }

  function renderClassStep() {
    if (!content) return <div>Loading...</div>

    const classData = content.classes || []

    if (classes.length === 0) {
      return (
        <div className="class-section">
          <h2 className="sec-title">Choose Class</h2>

          <div className="class-picker">
            <div className="picker-header">
              <div className="picker-search">
                <Input placeholder="Search classes..." onChange={() => {}} />
              </div>
            </div>
            <div className="picker-list" id="picker-list">
              {classData.map((c: any) => (
                <div
                  key={c.id}
                  className="picker-row"
                  onClick={() => openClassPopup(c)}
                >
                  <div className="picker-row-icon">
                    <img
                      src={`/img/classes/${c.id}.svg`}
                      alt={c.name}
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none' }}
                    />
                  </div>
                  <div className="picker-row-info">
                    <div className="picker-row-name">{c.name}</div>
                    <div className="picker-row-meta">
                      Player's Handbook · HD d{c.hitDie} · {c.spellcaster ? 'Spellcaster' : 'Martial'}
                    </div>
                  </div>
                  <div className="picker-row-arrow">➔</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div>
        <div className="class-section">
        <div className="selected-classes">
          {classes.map((c, idx) => {
            const cd = classData.find((cl: any) => cl.id === c.id)
            const subLvl = cd?.subclassLevel || 3
            const showSubclass = c.level >= subLvl && cd?.subClasses?.length
            const subClass = cd?.subClasses?.find((sc: any) => sc.id === c.subclassId)

            return (
              <div key={c.id} className="selected-class-row">
                <div className="selected-class-hdr">
                  <div className="selected-class-name">
                    <img
                      className="class-icon"
                      src={`/img/classes/${c.id}.svg`}
                      alt=""
                      onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                    {cd?.name}
                  </div>
                  <div className="selected-class-sub">
                    Level{' '}
                    <select
                      className="class-level-select"
                      value={c.level}
                      onChange={(e) => setClassLevel(idx, parseInt(e.target.value))}
                    >
                      {Array.from({ length: 20 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                  <div className="selected-class-hp">
                    HP{' '}
                    <strong>{calculateHP(c.id, c.level)}</strong>{' '}
                    <span className="hp-detail">(d{cd?.hitDie} + CON)</span>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => removeClass(idx)}>✕</Button>
                </div>

                <div className="selected-class-body">
                  <div className="class-body-tabs">
                    <button
                      className={`class-tab ${c.classTab === 'features' ? 'active' : ''}`}
                      onClick={() => setClassTab(idx, 'features')}
                    >
                      Features
                    </button>
                    {cd?.spellcaster && (
                      <button
                        className={`class-tab ${c.classTab === 'spells' ? 'active' : ''}`}
                        onClick={() => setClassTab(idx, 'spells')}
                      >
                        Spells
                      </button>
                    )}
                  </div>

{c.classTab === 'spells' && (
                      <SpellTab
                        classData={c}
                        classDef={cd}
                        spells={spellsData?.spells || []}
                      />
                    )}

                  {c.classTab === 'features' && (
                    <div className="selected-class-features">
                      {cd?.features?.map((f: any) => (
                        <div
                          key={`${f.name}-${f.level}`}
                          className={`class-feature-row ${f.level > c.level ? 'locked' : ''} ${f.subclass ? 'subclass-feature' : ''}`}
                        >
                          <span className="feat-level-badge">Lv.{f.level}</span>
                          <span className="feat-name">{f.name}</span>
                          {f.subclass && c.subclassId && (
                            <span className="subclass-badge">{subClass?.name}</span>
                          )}
                          {f.subclass && !c.subclassId && c.level >= (cd?.subclassLevel || 3) && (
                            <span className="subclass-badge pending">Choose Subclass</span>
                          )}
                          {f.level <= c.level ? (
                            <span className="feat-unlocked">✓</span>
                          ) : (
                            <span className="feat-locked">🔒</span>
                          )}
                        </div>
                      ))}

                      {showSubclass && (
                        <div className="subclass-select-row">
                          <label className="form-label">Subclass</label>
                          <select
                            className="form-input subclass-select"
                            value={c.subclassId || ''}
                            onChange={(e) => setSubclass(idx, e.target.value)}
                          >
                            <option value="">-- Choose --</option>
                            {cd?.subClasses?.map((sc: any) => (
                              <option key={sc.id} value={sc.id}>{sc.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {c.subclassId && subClass && (
                        <div className="subclass-desc-box">
                          <div className="subclass-desc-title">{subClass.name}</div>
                          <div className="subclass-desc-text">{subClass.description}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {classes.length < 2 && (
            <div className="add-class-section">
              <Button className="btn-add-class" onClick={() => setStep('class')}>
                + Add Another Class
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="actions">
        <Button onClick={() => goToStep('name')}>Back</Button>
        <Button variant="primary" onClick={() => goToStep('background')} disabled={!canProceed()}>
          Next
        </Button>
      </div>
    </div>
  );
  }

  function renderBackgroundStep() {
    if (!content) return <div>Loading...</div>

    const backgrounds = content.backgrounds || []

    if (!backgroundId) {
      return (
        <div className="bg-section">
          <h2 className="sec-title">Choose Background</h2>
          <div className="class-picker" id="bg-picker">
            <div className="picker-header">
              <div className="picker-search">
                <Input placeholder="Search backgrounds..." />
              </div>
            </div>
            <div className="picker-list" id="bg-picker-list">
              {backgrounds.map((bg: any) => (
                <div
                  key={bg.id}
                  className="picker-row"
                  onClick={() => setBackgroundId(bg.id)}
                >
                  <div className="picker-row-icon">📤</div>
                  <div className="picker-row-info">
                    <div className="picker-row-name">{bg.name}</div>
                    <div className="picker-row-meta">Feat: {bg.feat}</div>
                  </div>
                  <div className="picker-row-arrow">➔</div>
                </div>
              ))}
            </div>
          </div>
          <div className="actions">
            <Button onClick={() => goToStep('class')}>Back</Button>
            <Button variant="primary" disabled>Next</Button>
          </div>
        </div>
      )
    }

    const bg = backgrounds.find((b: any) => b.id === backgroundId)

    return (
      <div className="bg-section">
        <div className="selected-bg-row">
          <div className="selected-bg-hdr">
            <div className="selected-bg-name">{bg?.name}</div>
            <div className="selected-bg-meta">
              <span className="tag tag-gold">Feat: {bg?.feat}</span>
            </div>
            <Button variant="danger" size="sm" onClick={() => setBackgroundId('')}>✕</Button>
          </div>
          <div className="selected-bg-body">
            <div className="bg-detail-section">
              <div className="bg-detail-desc">{bg?.description}</div>
              {bg?.feature && (
                <div className="bg-feature-box">
                  <div className="bg-feature-name">{bg.feature}</div>
                  <div className="bg-feature-desc">{bg.featureDesc}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="actions">
          <Button onClick={() => goToStep('class')}>Back</Button>
          <Button variant="primary" onClick={() => goToStep('species')}>Next</Button>
        </div>
      </div>
    )
  }

  function renderSpeciesStep() {
    if (!content) return <div>Loading...</div>

    const species = content.species || []

    if (!speciesId) {
      return (
        <div className="species-section">
          <h2 className="sec-title">Choose Species</h2>
          <div className="class-picker" id="species-picker">
            <div className="picker-header">
              <div className="picker-search">
                <Input placeholder="Search species..." />
              </div>
            </div>
            <div className="picker-list" id="species-picker-list">
              {species.map((sp: any) => (
                <div
                  key={sp.id}
                  className="picker-row"
                  onClick={() => setSpeciesId(sp.id)}
                >
                  <div className="picker-row-icon">
                    <img src={`/img/species/${sp.id}.webp`} alt={sp.name} onError={(e) => e.currentTarget.style.display = 'none'} />
                  </div>
                  <div className="picker-row-info">
                    <div className="picker-row-name">{sp.name}</div>
                    <div className="picker-row-meta">{sp.size} · {sp.speed} ft · {sp.variants?.length || 0} variants</div>
                  </div>
                  <div className="picker-row-arrow">➔</div>
                </div>
              ))}
            </div>
          </div>
          <div className="actions">
            <Button onClick={() => goToStep('background')}>Back</Button>
            <Button variant="primary" disabled>Next</Button>
          </div>
        </div>
      )
    }

    const sp = species.find((s: any) => s.id === speciesId)

    return (
      <div className="species-section">
        <div className="selected-species-row">
          <div className="selected-species-hdr">
            <div className="selected-species-name">{sp?.name}</div>
            <div className="selected-species-meta">
              <span className="tag tag-gold">{sp?.size}</span>
              <span className="tag tag-green">{sp?.speed} ft</span>
            </div>
            <Button variant="danger" size="sm" onClick={() => setSpeciesId('')}>✕</Button>
          </div>
          <div className="selected-species-body">
            <div className="species-detail-desc">{sp?.description}</div>
            {sp?.variants?.length && (
              <div className="species-variant-section">
                <label className="form-label">Variant / Subspecies</label>
                <select className="form-input species-select" value={sp.variants[0]?.id || ''}>
                  <option value="">Base {sp.name}</option>
                  {sp.variants?.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
            )}
            <div className="species-traits-section">
              <h3 className="bg-section-title">Species Traits</h3>
              <div className="species-traits-list">
                {sp?.traits?.map((t: string, i: number) => (
                  <div key={i} className="species-trait">{t}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="actions">
          <Button onClick={() => goToStep('background')}>Back</Button>
          <Button variant="primary" onClick={() => goToStep('abilities')}>Next</Button>
        </div>
      </div>
    )
  }

  function renderAbilitiesStep() {
    return (
      <div className="abilities-section">
        <h2 className="sec-title">Ability Scores</h2>
        <div className="method-tabs">
          <button
            className={`method-tab ${abilityScores.method === 'standard' ? 'active' : ''}`}
            onClick={() => setAbilityScores({ ...abilityScores, method: 'standard' })}
          >
            <div className="method-name">Standard Array</div>
            <div className="method-desc">15, 14, 13, 12, 10, 8</div>
          </button>
          <button
            className={`method-tab ${abilityScores.method === 'point-buy' ? 'active' : ''}`}
            onClick={() => setAbilityScores({ ...abilityScores, method: 'point-buy' })}
          >
            <div className="method-name">Point Buy</div>
            <div className="method-desc">27 points to spend</div>
          </button>
          <button
            className={`method-tab ${abilityScores.method === 'roll' ? 'active' : ''}`}
            onClick={() => setAbilityScores({ ...abilityScores, method: 'roll' })}
          >
            <div className="method-name">Roll 4d6</div>
            <div className="method-desc">Drop lowest die</div>
          </button>
        </div>

        <div className="ability-assign">
          <div className="ability-pool">
            <div className="pool-label">Available Scores (click to assign)</div>
            <div className="pool-chips" id="pool-chips">
              {getPoolChips().map((val, i) => (
                <div
                  key={i}
                  className={`pool-chip ${val.available ? 'available' : 'used'}`}
                  onClick={() => val.available && assignFromPool(val.value)}
                >
                  {val.value}
                </div>
              ))}
            </div>
          </div>
          <div className="ability-slots">
            {['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map((ab) => (
              <div key={ab} className="ability-slot">
                <img className="ability-icon" src={`/img/abilities/${ab.toLowerCase()}.svg`} alt={ab} />
                <div className="ability-slot-info">
                  <div className="ability-slot-name">{getAbilityName(ab)}</div>
                  <div className="ability-slot-value">{abilityScores[ab] || '—'}</div>
                  <div className="ability-slot-mod">{abilityScores[ab] ? formatMod(Number(abilityScores[ab])) : ''}</div>
                </div>
                {abilityScores[ab] && (
                  <Button variant="danger" size="sm" onClick={() => unassignAbility(ab)}>✕</Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="actions">
          <Button onClick={() => goToStep('species')}>Back</Button>
          <Button variant="primary" onClick={() => goToStep('equipment')} disabled={!canProceed()}>
            Next
          </Button>
        </div>
      </div>
    )
  }

  function renderEquipmentStep() {
    return (
      <div className="equipment-section">
        <h2 className="sec-title">Starting Equipment</h2>
        <div className="card-grid" id="equip-grid">
          {classes.map(c => {
            const packs = getClassPacks(c.id)
            return (
              <div key={c.id} className="card">
                <div className="card-title">{c.id} Equipment</div>
                <div className="card-tags">
                  {packs.map(p => <span key={p} className="tag tag-gold">{p}</span>)}
                </div>
              </div>
            )
          })}
        </div>
        <div className="actions">
          <Button onClick={() => goToStep('abilities')}>Back</Button>
          <Button variant="primary" onClick={() => goToStep('sheet')}>Next</Button>
        </div>
      </div>
    )
  }

  function renderSheetStep() {
    return (
      <div className="sheet-step">
        <h2 className="sec-title">Character Sheet</h2>
        <p>Character sheet preview coming soon...</p>
        <div className="actions">
          <Button onClick={() => goToStep('equipment')}>Back</Button>
          <Button variant="primary" onClick={handleSubmit}>Save Character</Button>
        </div>
      </div>
    )
  }

  function openClassPopup(classData: any) {
    builderStore.getState().setClasses([...classes, { ...classData, level: 1, classTab: 'features' }])
  }

  function calculateHP(classId: string, level: number) {
    const cd = content?.classes?.find((c: any) => c.id === classId)
    if (!cd) return 0
    const conMod = Math.floor((abilityScores.CON - 10) / 2)
    if (level === 1) return cd.hitDie + conMod
    const avgHD = Math.floor(cd.hitDie / 2) + 1
    return cd.hitDie + conMod + (level - 1) * (avgHD + conMod)
  }

  function getPoolChips() {
    if (abilityScores.method === 'standard') {
      return [15, 14, 13, 12, 10, 8].map(v => ({
        value: v,
        available: !Object.values(abilityScores).includes(v)
      }))
    }
    if (abilityScores.method === 'roll') {
      return (abilityScores.rolledScores || []).map((v: number, i: number) => ({
        value: v,
        available: !abilityScores.assignedRolls?.includes(i)
      }))
    }
    return []
  }

  function assignFromPool(value: number) {
    const firstEmpty = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].find(ab => !abilityScores[ab])
    if (firstEmpty) {
      setAbilityScores({ ...abilityScores, [firstEmpty]: value })
    }
  }

  function unassignAbility(ab: string) {
    const newScores = { ...abilityScores }
    delete newScores[ab]
    setAbilityScores(newScores)
  }

  function getAbilityName(ab: string) {
    const names: Record<string, string> = {
      STR: 'Strength', DEX: 'Dexterity', CON: 'Constitution',
      INT: 'Intelligence', WIS: 'Wisdom', CHA: 'Charisma'
    }
    return names[ab] || ab
  }

  function formatMod(v: number) {
    const mod = Math.floor((v - 10) / 2)
    return mod >= 0 ? `+${mod}` : `${mod}`
  }

  function getClassPacks(_classId: string) {
    return ['Standard Pack']
  }

  function handleSubmit() {
    const request = getBuilderRequest()
    console.log('Submit character:', request)
  }
}