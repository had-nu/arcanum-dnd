export function strip5eMarkup(text: string): string {
  return text.replace(/\{@(\w+)([^}]*)\}/g, (_match, tag, args) => {
    const parts = args.trim().split('|');
    const label = parts[0] || '';

    switch (tag) {
      case 'i':
        return `*${label}*`;
      case 'b':
        return `**${label}**`;
      case 'scaledice':
        return label || 'dice';
      case 'dice':
        return label || 'd20';
      case 'dc':
        return `DC ${label}`;
      case 'hit':
        return `+${label}`;
      case 'damage':
        return label;
      case 'spell':
        return parts[0] || '';
      case 'item':
        return parts[0] || '';
      case 'feat':
      case '5etools':
        return parts[0] || '';
      case 'skill':
        return parts[0] || '';
      case 'condition':
        return parts[0] || '';
      case 'status':
        return parts[0] || '';
      case 'sense':
        return parts[0] || '';
      case 'variantrule':
        return parts[0] || '';
      case 'book':
        return parts[0] || '';
      case 'filter':
        return parts[0] || '';
      case 'creature':
        return parts[0] || '';
      case 'adventure':
        return parts[0] || '';
      case 'class':
        return parts[0] || '';
      case 'table':
        return parts[0] || '';
      default:
        return label;
    }
  });
}

export function strip5eInline(entry: unknown): unknown {
  if (typeof entry === 'string') {
    return strip5eMarkup(entry);
  }
  if (Array.isArray(entry)) {
    return entry.map(strip5eInline);
  }
  if (entry && typeof entry === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(entry as Record<string, unknown>)) {
      if (k === 'entries' || k === 'items') {
        result[k] = strip5eInline(v);
      } else if (typeof v === 'string') {
        result[k] = strip5eMarkup(v);
      } else {
        result[k] = v;
      }
    }
    return result;
  }
  return entry;
}
