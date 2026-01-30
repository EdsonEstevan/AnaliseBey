export function toJsonArray(value?: string[] | null): string {
  if (!value || value.length === 0) {
    return '[]';
  }
  return JSON.stringify(value);
}

export function ensureStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
    } catch (err) {
      return [];
    }
  }
  return [];
}
