import { useEffect, useState } from 'react';
import { useContentStore } from '@/stores/contentStore';
import { useBuilderStore } from '@/stores/builderStore';
import { useWizardUIStore } from '@/stores/wizardUIStore';
import { api } from '@/api/endpoints';
import { ClassCard } from './ClassCard';
import { SpellManager } from './SpellManager';
import { ClassGlyph, LevelSelect, Button, Tabs, TabList, Tab, TabPanel, XIcon, FeatureRenderer } from '@/shared/ui';
import type { ClassFeatureEntry } from '@/types/api';

export function ClassStep() {
  const { draft, addClass, setClassLevel, removeClass, setSubclass, preview } = useBuilderStore();
  const { classes: allClasses } = useContentStore();
  const { activeClassTab, setActiveClassTab } = useWizardUIStore();
  const [featuresMap, setFeaturesMap] = useState<Record<string, ClassFeatureEntry[]>>({});
  const [subclassFeaturesMap, setSubclassFeaturesMap] = useState<Record<string, ClassFeatureEntry[]>>({});

  const currentClass = draft.classes[0];
  const classDef = currentClass ? allClasses.find((c) => c.id === currentClass.id) : null;
  const isSpellcaster = classDef?.spellcaster;

  // Track previous subclass selection to clear stale features when changed
  const prevKeyRef = { current: '' };

  useEffect(() => {
    for (const c of draft.classes) {
      if (!featuresMap[c.id]) {
        api.getFeatures(c.id).then((res) => {
          setFeaturesMap((prev) => ({ ...prev, [c.id]: res.features }));
        }).catch(() => {});
      }
    }
  }, [draft.classes.map((c) => c.id).join(',')]);

  useEffect(() => {
    for (const c of draft.classes) {
      if (!c.subclassId) {
        // Clear subclass features if subclassId removed
        const prevKey = prevKeyRef.current;
        if (prevKey) {
          setSubclassFeaturesMap(prev => {
            const newMap = { ...prev };
            delete newMap[prevKey];
            return newMap;
          });
          prevKeyRef.current = '';
        }
        continue;
      }

      const key = c.id + '-' + c.subclassId;
      
      if (!subclassFeaturesMap[key]) {
        api.getFeatures(c.id, c.subclassId).then((res) => {
          setSubclassFeaturesMap((prev) => ({ ...prev, [key]: res.subclassFeatures ?? [] }));
        }).catch(() => {});
        
        // Update previous key to track changes
        prevKeyRef.current = key;
      } else if (prevKeyRef.current !== key) {
        // Update previous key if subclass selection changes
        prevKeyRef.current = key;
      }
    }
  }, [draft.classes]);

  const totalLevel = draft.classes.reduce((sum: number, c: { level: number }) => sum + c.level, 0);
  const hitDice = draft.classes.map((c: { id: string; level: number }) => {
    const cd = allClasses.find((cl) => cl.id === c.id);
    const hd = cd?.hitDie ? parseInt(cd.hitDie.replace('d', '')) : 8;
    return `${c.level}d${hd}`;
  }).join(' + ');

  const calculateHP = (classId: string, level: number, con: number): number => {
    const cd = allClasses.find((c) => c.id === classId);
    if (!cd) return 0;
    const hitDie = cd.hitDie ? parseInt(cd.hitDie.replace('d', '')) : 8;
    const conMod = Math.floor((con - 10) / 2);
    if (level === 1) return hitDie + conMod;
    const avgHD = Math.floor(hitDie / 2) + 1;
    return hitDie + conMod + (level - 1) * (avgHD + conMod);
  };

  return (
    <div className="space-y-6">
      {draft.classes.length === 0 ? (
        <div className="class-picker">
          <h2 className="sec-title">Choose Class</h2>
          <div className="card-grid">
            {[...allClasses].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')).map((c) => (
              <ClassCard
                key={c.id}
                classData={c}
                onClick={addClass}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="selected-classes space-y-4">
          {draft.classes.map((c: { id: string; level: number; subclassId?: string }) => {
            const cd = allClasses.find((cl) => cl.id === c.id);
            const className = cd?.name ?? c.id;
            const subLvl = cd?.subclassLevel || 3;
            const showSubclass = c.level >= subLvl && (cd?.subClasses?.length || 0) > 0;
            const subClass = cd?.subClasses?.find((sc) => sc.id === c.subclassId);

            return (
            <div key={c.id} className="selected-class-row bg-[var(--bg-surface)]/50 border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="selected-class-hdr p-4 border-b border-[var(--border)] flex flex-wrap items-center gap-4">
                <div className="selected-class-name flex items-center gap-3">
                  <ClassGlyph classId={c.id} size="md" />
                  <span className="font-label text-lg text-[var(--text)]">{className}</span>
                </div>
                <div className="selected-class-sub flex items-center gap-2">
                  <span className="text-[var(--text-muted)]">Level</span>
                  <LevelSelect level={c.level} onChange={(lvl) => setClassLevel(c.id, lvl)} />
                </div>
                <div className="selected-class-hp flex items-center gap-2">
                  <span className="text-[var(--text-muted)]">HP</span>
                  <strong className="text-[var(--text)] text-xl">{calculateHP(c.id, c.level, draft.abilityScores.CON)}</strong>
                  <span className="hp-detail text-[var(--text-dim)] text-sm">({cd?.hitDie} + CON)</span>
                </div>
                <Button variant="danger" size="sm" onClick={() => removeClass(c.id)} aria-label="Remove class"><XIcon size={14} /></Button>
              </div>

                <div className="selected-class-body p-4">
                  <Tabs defaultTab={activeClassTab} onTabChange={(tab) => setActiveClassTab(tab as any)}>
                    <TabList>
                      <Tab value="features">Features</Tab>
                      {isSpellcaster && <Tab value="spells">Spells</Tab>}
                      {showSubclass && <Tab value="optional-features">Optional Features</Tab>}
                    </TabList>

                    <TabPanel value="features">
                      <div className="selected-class-features space-y-2">
                        {(() => {
                          const entries = featuresMap[c.id]?.length
                            ? featuresMap[c.id]
                            : (cd?.features?.map((f) => ({
                                classId: c.id,
                                name: f.name,
                                level: f.level,
                                entries: [],
                              }) as ClassFeatureEntry) ?? []);
                          return entries.map((f, i) => (
                            <FeatureRenderer
                              key={f.name + '-' + f.level + '-' + i}
                              feature={f}
                              isUnlocked={f.level <= c.level}
                              level={f.level}
                            />
                          ));
                        })()}

                        {showSubclass && (
                          <div className="subclass-select-row pt-4 border-t border-[var(--border)]">
                            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">Subclass</label>
                            <select
                              value={c.subclassId || ''}
                              onChange={(e) => setSubclass(c.id, e.target.value)}
                              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text)] rounded-[var(--radius)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:border-transparent min-h-[44px]"
                            >
                              <option value="">-- Choose --</option>
                              {cd?.subClasses?.map((sc) => (
                                <option key={sc.id} value={sc.id}>{sc.name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {c.subclassId && subClass && (
                          <div className="subclass-section mt-4 pt-4 border-t border-[var(--border)]">
                            <div className="subclass-desc-box mb-3 p-3 bg-[var(--bg-elevated)]/50 rounded-[var(--radius)] border border-[var(--border)]">
                              <div className="subclass-desc-title font-label text-[var(--gold)] mb-1">{subClass.name}</div>
                              <div className="subclass-desc-text text-[var(--text-muted)]">{subClass.description}</div>
                            </div>
                            <h4 className="font-heading text-xs text-[var(--gold)] mb-2">Subclass Features</h4>
                            <div className="space-y-2">
                              {(subclassFeaturesMap[c.id + '-' + c.subclassId] ?? []).map((f, i) => (
                                <FeatureRenderer
                                  key={f.name + '-' + f.level + '-' + i}
                                  feature={f}
                                  isUnlocked={f.level <= c.level}
                                  level={f.level}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabPanel>

                    {isSpellcaster && (
                      <TabPanel value="spells">
                        <SpellManager classData={c} classDef={cd!} preview={preview} />
                      </TabPanel>
                    )}

                    {showSubclass && (
                      <TabPanel value="optional-features">
                        <div className="text-[var(--text-muted)] text-center py-8">
                          Optional features coming soon (feats, fighting styles, etc.)
                        </div>
                      </TabPanel>
                    )}
                  </Tabs>
                </div>
              </div>
            );
          })}

          {draft.classes.length < 2 && (
            <div className="add-class-section text-center pt-4">
              <Button className="btn-add-class" onClick={() => useWizardUIStore.getState().setActiveStep('class')}>
                + Add Another Class
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="preview-stats mt-6 p-4 bg-[var(--bg-surface)]/50 border border-[var(--border)] rounded-[var(--radius-lg)]">
        <h3 className="font-label text-[var(--gold)] mb-3">Live Preview (from /build)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-3xl font-heading text-[var(--text)]">{preview?.level || totalLevel}</div>
            <div className="text-[var(--text-muted)] text-sm">Level</div>
          </div>
          <div>
            <div className="text-3xl font-heading text-[var(--text)]">{preview?.hp?.max || '—'}</div>
            <div className="text-[var(--text-muted)] text-sm">Max HP</div>
          </div>
          <div>
            <div className="text-3xl font-heading text-[var(--text)]">{preview?.ac || '—'}</div>
            <div className="text-[var(--text-muted)] text-sm">AC</div>
          </div>
          <div>
            <div className="text-3xl font-heading text-[var(--text)]">{hitDice}</div>
            <div className="text-[var(--text-muted)] text-sm">Hit Dice</div>
          </div>
        </div>
      </div>
    </div>
  );
}