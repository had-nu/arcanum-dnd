import { useState } from 'react';
import type { ClassFeatureEntry } from '@/types/api';
import { strip5eMarkup } from '@/shared/lib/strip5eMarkup';

interface FeatureRendererProps {
  feature: ClassFeatureEntry;
  isUnlocked: boolean;
  level: number;
}

export function FeatureRenderer({ feature, isUnlocked, level }: FeatureRendererProps) {
  const [expanded, setExpanded] = useState(isUnlocked);

  const canExpand = isUnlocked && feature.entries && feature.entries.length > 0;

  return (
    <div
      className={`feature-row border rounded-lg overflow-hidden transition-colors ${
        isUnlocked ? 'border-stone-700 bg-stone-800/30' : 'border-stone-700/50 bg-stone-800/10 opacity-60'
      }`}
    >
      <button
        type="button"
        onClick={() => canExpand && setExpanded(!expanded)}
        className={`feature-header w-full flex items-center gap-3 p-3 text-left ${
          canExpand ? 'cursor-pointer hover:bg-stone-700/30' : 'cursor-default'
        }`}
      >
        <span className="feat-level-badge shrink-0 px-2 py-1 bg-stone-700 rounded text-xs font-mono text-stone-300">
          Lv.{level}
        </span>
        <span className={`feat-name flex-1 font-heading text-sm ${isUnlocked ? 'text-white' : 'text-stone-400'}`}>
          {feature.name}
        </span>
        {isUnlocked ? (
          <span className="feat-unlocked text-green-500 shrink-0 text-xs">Unlocked</span>
        ) : (
          <span className="feat-locked text-stone-500 shrink-0 text-xs">Locked</span>
        )}
        {canExpand && (
          <span className={`shrink-0 text-stone-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        )}
      </button>

      {expanded && canExpand && (
        <div className="feature-body px-3 pb-3">
          <div className="max-w-none text-stone-300 text-xs leading-relaxed space-y-2">
            <EntryRenderer entries={feature.entries} />
          </div>
        </div>
      )}
    </div>
  );
}

interface EntryRendererProps {
  entries: unknown[];
}

function EntryRenderer({ entries }: EntryRendererProps) {
  if (!entries || entries.length === 0) return null;

  return (
    <>
      {entries.map((entry, i) => {
        if (typeof entry === 'string') {
          const cleaned = strip5eMarkup(entry);
          if (!cleaned) return null;
          if (cleaned.startsWith('*') && cleaned.endsWith('*')) {
            return <p key={i} className="italic text-stone-400">{cleaned.slice(1, -1)}</p>;
          }
          return <p key={i} className="last:mb-0">{cleaned}</p>;
        }

        if (typeof entry === 'object' && entry !== null) {
          const e = entry as Record<string, unknown>;

          switch (e.type) {
            case 'entries':
              return <NamedEntryRenderer key={i} entry={e} />;
            case 'list':
              return <ListRenderer key={i} entry={e} />;
            case 'table':
              return <TableRenderer key={i} entry={e} />;
            case 'options':
              return <OptionsRenderer key={i} entry={e} />;
            case 'refClassFeature':
            case 'refFeature':
              return <p key={i} className="italic text-stone-400">See: {String(e.classFeature ?? e.feature ?? '')}</p>;
            case 'refOptionalFeature':
              return <p key={i} className="text-amber-400/80 italic">{String(e.optionalfeature ?? '').split('|')[0]}</p>;
            case 'abilityDc':
              return <p key={i} className="text-amber-400 text-xs">Spell save DC: {formatAttributes(e.attributes)}</p>;
            case 'abilityAttackMod':
              return <p key={i} className="text-amber-400 text-xs">Spell attack modifier: {formatAttributes(e.attributes)}</p>;
            case 'ability':
              return null;
            case 'inset':
              return <InsetRenderer key={i} entry={e} />;
            case 'quote':
              return <QuoteRenderer key={i} entry={e} />;
            default:
              return <FallbackEntryRenderer key={i} entry={e} />;
          }
        }

        return null;
      })}
    </>
  );
}

function formatAttributes(attr: unknown): string {
  if (Array.isArray(attr)) return attr.join(', ').toUpperCase();
  return String(attr ?? '');
}

function NamedEntryRenderer({ entry }: { entry: Record<string, unknown> }) {
  const rawName = entry.name as string | undefined;
  const name = rawName ? strip5eMarkup(rawName) : undefined;
  const subEntries = entry.entries as unknown[] | undefined;

  return (
    <div className="last:mb-0">
      {name && <h4 className="font-medium text-amber-300 mb-0.5 text-xs">{name}</h4>}
      {subEntries && (
        <div className="space-y-1">
          <EntryRenderer entries={subEntries} />
        </div>
      )}
    </div>
  );
}

function ListRenderer({ entry }: { entry: Record<string, unknown> }) {
  const items = entry.items as unknown[] | undefined;
  if (!items) return null;

  return (
    <ul className="list-disc list-inside space-y-0.5">
      {items.map((item, i) => (
        <li key={i}>
          {typeof item === 'string' ? (
            strip5eMarkup(item)
          ) : typeof item === 'object' && item !== null ? (
            <EntryRenderer entries={[item as Record<string, unknown>]} />
          ) : (
            String(item)
          )}
        </li>
      ))}
    </ul>
  );
}

function TableRenderer({ entry }: { entry: Record<string, unknown> }) {
  const headers = entry.headers as string[] | undefined;
  const rows = entry.rows as unknown[][] | undefined;
  if (!headers || !rows) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse border border-stone-600">
        {typeof entry.caption === 'string' && (
          <caption className="text-stone-400 text-xs py-1 italic">{entry.caption}</caption>
        )}
        <thead>
          <tr className="bg-stone-700/50">
            {headers.map((h, i) => (
              <th key={i} className="px-2 py-1 border border-stone-600 text-stone-200 font-medium text-left">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-stone-800/30' : ''}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-2 py-1 border border-stone-600 text-stone-300">
                  {typeof cell === 'object' && cell !== null
                    ? <EntryRenderer entries={[cell as Record<string, unknown>]} />
                    : strip5eMarkup(String(cell ?? ''))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OptionsRenderer({ entry }: { entry: Record<string, unknown> }) {
  const subEntries = entry.entries as unknown[] | undefined;
  if (!subEntries) return null;

  return (
    <div className="space-y-1">
      <EntryRenderer entries={subEntries} />
    </div>
  );
}

function InsetRenderer({ entry }: { entry: Record<string, unknown> }) {
  const rawName = entry.name as string | undefined;
  const name = rawName ? strip5eMarkup(rawName) : undefined;
  const subEntries = entry.entries as unknown[] | undefined;

  return (
    <div className="p-3 bg-stone-800/60 border-l-4 border-amber-600 rounded-r-md">
      {name && <h4 className="font-medium text-amber-400 mb-0.5 text-xs">{name}</h4>}
      {subEntries && (
        <div className="space-y-1">
          <EntryRenderer entries={subEntries} />
        </div>
      )}
    </div>
  );
}

function QuoteRenderer({ entry }: { entry: Record<string, unknown> }) {
  const subEntries = entry.entries as unknown[] | undefined;
  const by = entry.by as string | undefined;

  return (
    <blockquote className="border-l-4 border-stone-500 pl-4 italic text-stone-400">
      {subEntries && <EntryRenderer entries={subEntries} />}
      {by && <footer className="text-xs text-stone-500 mt-1 not-italic">— {by}</footer>}
    </blockquote>
  );
}

function FallbackEntryRenderer({ entry }: { entry: Record<string, unknown> }) {
  const text = entry.text ?? entry.name;
  if (entry.entries) {
    return (
      <div>
        {typeof text === 'string' && <p className="mb-1">{strip5eMarkup(text)}</p>}
        <EntryRenderer entries={entry.entries as unknown[]} />
      </div>
    );
  }
  if (typeof text === 'string') {
    const cleaned = strip5eMarkup(text);
    if (cleaned) return <p>{cleaned}</p>;
  }
  return null;
}
