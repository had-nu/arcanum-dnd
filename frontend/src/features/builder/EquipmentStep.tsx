import { useBuilderStore } from '@/stores/builderStore';

export function EquipmentStep() {
  const { draft } = useBuilderStore();

  return (
    <div className="equipment-section">
      <h2 className="sec-title">Starting Equipment</h2>
      <div className="card-grid" id="equip-grid">
        {draft.classes.map((c: { id: string; level: number }) => (
          <div key={c.id} className="card variant-elevated">
            <h3 className="font-label font-bold text-base text-white mb-2">{c.id} Equipment</h3>
            <div className="card-tags flex flex-wrap gap-2 mt-3">
              <span className="tag tag-gold">Standard Pack</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-stone-400 text-center py-4">
        Equipment selection based on class coming soon
      </p>
    </div>
  );
}