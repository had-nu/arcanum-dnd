interface ClassPickerProps {
  classes: any[];
  value: Array<{ id: string; level: number; subclassId?: string }>;
  onChange: (value: Array<{ id: string; level: number; subclassId?: string }>) => void;
  totalLevel: number;
  onTotalLevelChange?: (level: number) => void;
  errors?: string;
}

export function ClassPicker({ classes, value, onChange, totalLevel, onTotalLevelChange, errors }: ClassPickerProps) {
  const updateClass = (index: number, field: string, val: any) => {
    const next = [...value];
    next[index] = { ...next[index], [field]: val };
    onChange(next);
  };

  const updateLevel = (index: number, level: number) => {
    const oldLevel = value[index].level;
    const diff = level - oldLevel;
    if (totalLevel + diff > 20 || level < 1) return;
    updateClass(index, 'level', level);
    onTotalLevelChange?.(totalLevel + diff);
  };

  const addClass = () => {
    if (totalLevel >= 20 || value.length >= 5) return;
    onChange([...value, { id: '', level: 1 }]);
  };

  const removeClass = (index: number) => {
    if (value.length <= 1) return;
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <label className="label mb-0">Classes</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-dnd-stone-600 dark:text-dnd-stone-400">
            Total Level: <strong className="text-dnd-stone-900 dark:text-dnd-stone-100">{totalLevel}</strong> / 20
          </span>
        </div>
      </div>

      {errors && <p className="mb-4 text-sm text-red-600">{errors}</p>}

      <div className="space-y-4">
        {value.map((cls, index) => {
          const classData = classes.find(c => c.id === cls.id);
          const canSubclass = classData?.subClasses?.length && cls.level >= (classData.subclassLevel || 3);

          return (
            <div key={index} className="card p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <select
                    value={cls.id}
                    onChange={e => updateClass(index, 'id', e.currentTarget.value)}
                    className="input"
                  >
                    <option value="">Select class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (d{c.hitDie})</option>
                    ))}
                  </select>

                  {classData && (
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-dnd-stone-600 dark:text-dnd-stone-400">Level</label>
                        <input
                          type="number"
                          min="1"
                          max={20 - (totalLevel - cls.level)}
                          value={cls.level}
                          onChange={e => updateLevel(index, parseInt(e.currentTarget.value) || 1)}
                          className="w-16 input text-center"
                        />
                      </div>

                      {canSubclass && (
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-dnd-stone-600 dark:text-dnd-stone-400">Subclass</label>
                          <select
                            value={cls.subclassId || ''}
                            onChange={e => updateClass(index, 'subclassId', e.currentTarget.value)}
                            className="input w-48"
                          >
                            <option value="">Select subclass</option>
                            {classData.subClasses.map((sc: { id: string; name: string }) => (
                              <option key={sc.id} value={sc.id}>{sc.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {classData.spellcaster && (
                        <span className="badge badge-class">Spellcaster</span>
                      )}
                    </div>
                  )}
                </div>

                {value.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeClass(index)}
                    className="p-2 text-dnd-stone-500 hover:text-red-600 hover:bg-dnd-stone-100 dark:hover:bg-dnd-stone-800 rounded-lg transition-colors"
                    aria-label={`Remove ${classData?.name || 'class'}`}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {totalLevel < 20 && value.length < 5 && (
          <button
            type="button"
            onClick={addClass}
            className="w-full btn-outline"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Another Class (Multiclass)
          </button>
        )}
      </div>
    </div>
  );
}