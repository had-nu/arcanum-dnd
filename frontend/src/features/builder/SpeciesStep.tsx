import { useContentStore } from '@/stores/contentStore';
import { useBuilderStore } from '@/stores/builderStore';
import { Button, Card, CardTitle, CardMeta, DnaIcon, XIcon } from '@/shared/ui';

export function SpeciesStep() {
  const { draft, setSpecies } = useBuilderStore();
  const { species } = useContentStore();

  if (!draft.speciesId) {
    return (
      <div className="species-section">
        <h2 className="sec-title">Choose Species</h2>
        <div className="class-picker" id="species-picker">
          <div className="picker-header mb-4">
            <input
              type="text"
              placeholder="Search species..."
              className="w-full px-3 py-2 bg-stone-900 border border-stone-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="card-grid" id="species-picker-list">
            {species.map((sp) => (
              <Card
                key={sp.id!}
                onClick={() => setSpecies(sp.id!)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <DnaIcon size={24} className="text-stone-400" />
                  <CardTitle>{sp.name}</CardTitle>
                </div>
                <CardMeta>{sp.size} · {sp.speed} ft · {sp.variants?.length || 0} variants</CardMeta>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const sp = species.find((s) => s.id === draft.speciesId);

  return (
    <div className="species-section">
      <h2 className="sec-title">Species: {sp?.name}</h2>
      <div className="selected-species-row bg-stone-900/50 border border-stone-700 rounded-lg p-4">
        <div className="selected-species-hdr flex items-start justify-between mb-4">
          <div>
            <div className="selected-species-name font-label text-lg text-white">{sp?.name}</div>
            <div className="selected-species-meta flex gap-2 mt-1">
              <span className="tag tag-gold">{sp?.size}</span>
              <span className="tag tag-green">{sp?.speed} ft</span>
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={() => setSpecies('')}><XIcon size={14} /></Button>
        </div>
        <div className="selected-species-body">
          <CardMeta className="mb-4">{sp?.name} - {sp?.size}, {sp?.speed} ft speed</CardMeta>
          {sp?.variants?.length && (
            <div className="species-variant-section mb-4">
              <label className="block text-sm font-medium text-stone-300 mb-1">Variant / Subspecies</label>
              <select
                value={draft.speciesVariant || ''}
                onChange={(e) => setSpecies(sp!.id!, e.target.value || undefined)}
                className="w-full px-3 py-2 bg-stone-900 border border-stone-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Base {sp.name}</option>
                {sp.variants?.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}