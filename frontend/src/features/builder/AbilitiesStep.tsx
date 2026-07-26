import { useBuilderStore } from '@/stores/builderStore';

const abilities = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const;
const abilityNames: Record<string, string> = {
  STR: 'Strength', DEX: 'Dexterity', CON: 'Constitution',
  INT: 'Intelligence', WIS: 'Wisdom', CHA: 'Charisma',
};

function getMod(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function pointBuyCost(score: number): number {
  if (score <= 13) return score - 8;
  if (score === 14) return 7;
  if (score === 15) return 9;
  return 0;
}

interface PoolChip {
  value: number;
  available: boolean;
  cost?: number;
}

export function AbilitiesStep() {
  const { draft, setAbilityScore, setAbilityMethod } = useBuilderStore();

  const methods = [
    { id: 'standard', name: 'Standard Array', desc: '15, 14, 13, 12, 10, 8' },
    { id: 'point-buy', name: 'Point Buy', desc: '27 points to spend' },
    { id: 'roll', name: 'Roll 4d6', desc: 'Drop lowest die' },
  ] as const;

  const getPoolChips = (): PoolChip[] => {
    if (draft.abilityMethod === 'standard') {
      return [15, 14, 13, 12, 10, 8].map((v) => ({
        value: v,
        available: !Object.values(draft.abilityScores).includes(v),
      }));
    }
    if (draft.abilityMethod === 'point-buy') {
      return Array.from({ length: 15 }, (_, i) => i + 8).map((v) => ({
        value: v,
        available: true,
        cost: pointBuyCost(v),
      }));
    }
    return [];
  };

  const assignFromPool = (value: number) => {
    const firstEmpty = abilities.find((ab) => draft.abilityScores[ab] === 10);
    if (firstEmpty) setAbilityScore(firstEmpty, value);
  };

  const unassignAbility = (ab: typeof abilities[number]) => {
    setAbilityScore(ab, 10);
  };

  return (
    <div className="abilities-section">
      <h2 className="sec-title">Ability Scores</h2>
      <div className="method-tabs flex gap-2 mb-6 flex-wrap">
        {methods.map((m) => (
          <button
            key={m.id}
            onClick={() => setAbilityMethod(m.id)}
            className={`px-4 py-3 rounded-lg border-2 text-left transition-colors ${
              draft.abilityMethod === m.id
                ? 'border-red-600 bg-red-600/10'
                : 'border-stone-700 hover:border-red-600/50'
            }`}
          >
            <div className="font-label font-medium text-white">{m.name}</div>
            <div className="text-sm text-stone-400">{m.desc}</div>
          </button>
        ))}
      </div>

      <div className="ability-assign grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="ability-pool">
          <div className="pool-label font-label text-stone-300 mb-3">Available Scores</div>
          <div className="pool-chips flex flex-wrap gap-2" id="pool-chips">
            {getPoolChips().map(({ value, available, cost }, i) => (
              <button
                key={i}
                className={`pool-chip px-3 py-2 rounded-md font-mono text-lg transition-colors ${
                  available
                    ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30 hover:bg-amber-500/30 cursor-pointer'
                    : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                }`}
                onClick={() => available && assignFromPool(value)}
                disabled={!available}
              >
                {value}
                {cost !== undefined && <span className="ml-1 text-xs text-stone-400">({cost})</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="ability-slots grid grid-cols-2 gap-3">
          {abilities.map((ab) => (
            <div key={ab} className="ability-slot bg-stone-800/50 border border-stone-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-label text-white">{abilityNames[ab]}</span>
                {draft.abilityScores[ab] !== 10 && (
                  <button
                    onClick={() => unassignAbility(ab)}
                    className="text-stone-500 hover:text-red-500 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="text-4xl font-bold font-heading text-white text-center">
                {draft.abilityScores[ab]}
              </div>
              <div className="text-center text-stone-400 mt-1">{getMod(draft.abilityScores[ab])}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}