import { clsx } from 'clsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

interface FeatSelectorProps {
  feats: Record<string, any>;
  value: string[];
  onChange: (value: string[]) => void;
}

export function FeatSelector({ feats, value, onChange }: FeatSelectorProps) {
  const featList = Object.values(feats);

  const toggle = (featId: string) => {
    const next = value.includes(featId)
      ? value.filter(id => id !== featId)
      : [...value, featId];
    onChange(next);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Feats</CardTitle>
        <CardDescription>Select feats for your character</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-dnd-stone-600 dark:text-dnd-stone-400">
          {value.length} feat{value.length !== 1 ? 's' : ''} selected
        </div>

        <div className="max-h-96 overflow-y-auto scrollbar-thin grid gap-2">
          {featList.map(feat => (
            <label
              key={feat.id}
              className={clsx(
                'flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                value.includes(feat.id)
                  ? 'bg-dnd-gold-50 dark:bg-dnd-gold-900/30 border-dnd-gold-300'
                  : 'bg-white dark:bg-dnd-stone-800 border-dnd-stone-200 dark:border-dnd-stone-700 hover:border-dnd-stone-300'
              )}
            >
              <input
                type="checkbox"
                checked={value.includes(feat.id)}
                onChange={() => toggle(feat.id)}
                className="w-4 h-4 mt-0.5 rounded border-dnd-stone-300 text-dnd-gold-600 focus:ring-dnd-gold-500"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{feat.name}</div>
                {feat.description && (
                  <div className="text-sm text-dnd-stone-500 dark:text-dnd-stone-400 mt-1 line-clamp-2">
                    {feat.description}
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}