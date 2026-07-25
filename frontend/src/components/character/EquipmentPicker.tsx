import { clsx } from 'clsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

interface EquipmentPack {
  id: string;
  name: string;
  items: string[];
}

const PACKS: Record<string, EquipmentPack[]> = {
  barbarian: [
    { id: 'dungeoneers', name: "Dungeoneer's Pack", items: ['Backpack', 'Crowbar', 'Hammer', '10 pitons', '10 torches', 'Tinderbox', '10 days rations', 'Waterskin', '50ft hempen rope'] },
    { id: 'explorers', name: "Explorer's Pack", items: ['Backpack', 'Bedroll', 'Mess kit', 'Tinderbox', '10 torches', '10 days rations', 'Waterskin', '50ft hempen rope'] },
  ],
  bard: [
    { id: 'explorers', name: "Explorer's Pack", items: ['Backpack', 'Bedroll', 'Mess kit', 'Tinderbox', '10 torches', '10 days rations', 'Waterskin', '50ft hempen rope'] },
    { id: 'scholars', name: "Scholar's Pack", items: ['Backpack', 'Book of lore', 'Ink bottle', 'Quill', 'Little knife', 'Common clothes', 'Belt pouch with 10gp'] },
  ],
  cleric: [
    { id: 'explorers', name: "Explorer's Pack", items: ['Backpack', 'Bedroll', 'Mess kit', 'Tinderbox', '10 torches', '10 days rations', 'Waterskin', '50ft hempen rope'] },
    { id: 'scholars', name: "Scholar's Pack", items: ['Backpack', 'Book of lore', 'Ink bottle', 'Quill', 'Little knife', 'Common clothes', 'Belt pouch with 10gp'] },
  ],
  druid: [
    { id: 'explorers', name: "Explorer's Pack", items: ['Backpack', 'Bedroll', 'Mess kit', 'Tinderbox', '10 torches', '10 days rations', 'Waterskin', '50ft hempen rope'] },
    { id: 'scholars', name: "Scholar's Pack", items: ['Backpack', 'Book of lore', 'Ink bottle', 'Quill', 'Little knife', 'Common clothes', 'Belt pouch with 10gp'] },
  ],
  fighter: [
    { id: 'dungeoneers', name: "Dungeoneer's Pack", items: ['Backpack', 'Crowbar', 'Hammer', '10 pitons', '10 torches', 'Tinderbox', '10 days rations', 'Waterskin', '50ft hempen rope'] },
    { id: 'explorers', name: "Explorer's Pack", items: ['Backpack', 'Bedroll', 'Mess kit', 'Tinderbox', '10 torches', '10 days rations', 'Waterskin', '50ft hempen rope'] },
  ],
  monk: [
    { id: 'dungeoneers', name: "Dungeoneer's Pack", items: ['Backpack', 'Crowbar', 'Hammer', '10 pitons', '10 torches', 'Tinderbox', '10 days rations', 'Waterskin', '50ft hempen rope'] },
    { id: 'explorers', name: "Explorer's Pack", items: ['Backpack', 'Bedroll', 'Mess kit', 'Tinderbox', '10 torches', '10 days rations', 'Waterskin', '50ft hempen rope'] },
  ],
  paladin: [
    { id: 'dungeoneers', name: "Dungeoneer's Pack", items: ['Backpack', 'Crowbar', 'Hammer', '10 pitons', '10 torches', 'Tinderbox', '10 days rations', 'Waterskin', '50ft hempen rope'] },
    { id: 'explorers', name: "Explorer's Pack", items: ['Backpack', 'Bedroll', 'Mess kit', 'Tinderbox', '10 torches', '10 days rations', 'Waterskin', '50ft hempen rope'] },
  ],
  ranger: [
    { id: 'dungeoneers', name: "Dungeoneer's Pack", items: ['Backpack', 'Crowbar', 'Hammer', '10 pitons', '10 torches', 'Tinderbox', '10 days rations', 'Waterskin', '50ft hempen rope'] },
    { id: 'explorers', name: "Explorer's Pack", items: ['Backpack', 'Bedroll', 'Mess kit', 'Tinderbox', '10 torches', '10 days rations', 'Waterskin', '50ft hempen rope'] },
  ],
  rogue: [
    { id: 'dungeoneers', name: "Dungeoneer's Pack", items: ['Backpack', 'Crowbar', 'Hammer', '10 pitons', '10 torches', 'Tinderbox', '10 days rations', 'Waterskin', '50ft hempen rope'] },
    { id: 'explorers', name: "Explorer's Pack", items: ['Backpack', 'Bedroll', 'Mess kit', 'Tinderbox', '10 torches', '10 days rations', 'Waterskin', '50ft hempen rope'] },
  ],
  sorcerer: [
    { id: 'dungeoneers', name: "Dungeoneer's Pack", items: ['Backpack', 'Crowbar', 'Hammer', '10 pitons', '10 torches', 'Tinderbox', '10 days rations', 'Waterskin', '50ft hempen rope'] },
    { id: 'explorers', name: "Explorer's Pack", items: ['Backpack', 'Bedroll', 'Mess kit', 'Tinderbox', '10 torches', '10 days rations', 'Waterskin', '50ft hempen rope'] },
  ],
  warlock: [
    { id: 'scholars', name: "Scholar's Pack", items: ['Backpack', 'Book of lore', 'Ink bottle', 'Quill', 'Little knife', 'Common clothes', 'Belt pouch with 10gp'] },
    { id: 'dungeoneers', name: "Dungeoneer's Pack", items: ['Backpack', 'Crowbar', 'Hammer', '10 pitons', '10 torches', 'Tinderbox', '10 days rations', 'Waterskin', '50ft hempen rope'] },
  ],
  wizard: [
    { id: 'scholars', name: "Scholar's Pack", items: ['Backpack', 'Book of lore', 'Ink bottle', 'Quill', 'Little knife', 'Common clothes', 'Belt pouch with 10gp'] },
    { id: 'explorers', name: "Explorer's Pack", items: ['Backpack', 'Bedroll', 'Mess kit', 'Tinderbox', '10 torches', '10 days rations', 'Waterskin', '50ft hempen rope'] },
  ],
};

const DEFAULT_PACKS: EquipmentPack[] = [
  { id: 'dungeoneers', name: "Dungeoneer's Pack", items: ['Backpack', 'Crowbar', 'Hammer', '10 pitons', '10 torches', 'Tinderbox', '10 days rations', 'Waterskin', '50ft hempen rope'] },
  { id: 'explorers', name: "Explorer's Pack", items: ['Backpack', 'Bedroll', 'Mess kit', 'Tinderbox', '10 torches', '10 days rations', 'Waterskin', '50ft hempen rope'] },
];

interface EquipmentPickerProps {
  classId: string;
  value: string[];
  onChange: (value: string[]) => void;
}

export function EquipmentPicker({ classId, value, onChange }: EquipmentPickerProps) {
  const packs = classId ? (PACKS[classId] || DEFAULT_PACKS) : DEFAULT_PACKS;
  const selected = value[0] || '';

  const selectPack = (packId: string) => {
    onChange([packId]);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Starting Equipment</CardTitle>
        <CardDescription>Choose your starting equipment pack</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {packs.map((pack) => (
            <button
              key={pack.id}
              onClick={() => selectPack(pack.id)}
              className={clsx(
                'w-full text-left p-4 rounded-xl border transition-all duration-150',
                selected === pack.id
                  ? 'bg-dnd-gold-50 dark:bg-dnd-gold-900/30 border-dnd-gold-400 dark:border-dnd-gold-600 shadow-sm'
                  : 'bg-white dark:bg-dnd-stone-800 border-dnd-stone-200 dark:border-dnd-stone-700 hover:border-dnd-stone-300 dark:hover:border-dnd-stone-600'
              )}
            >
              <div className="font-medium text-dnd-stone-900 dark:text-dnd-stone-100 mb-2">
                {pack.name}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {pack.items.map((item, i) => (
                  <span
                    key={i}
                    className={clsx(
                      'text-xs px-2 py-0.5 rounded-full',
                      selected === pack.id
                        ? 'bg-dnd-gold-100 dark:bg-dnd-gold-900/50 text-dnd-gold-800 dark:text-dnd-gold-300'
                        : 'bg-dnd-stone-100 dark:bg-dnd-stone-700 text-dnd-stone-600 dark:text-dnd-stone-400'
                    )}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
