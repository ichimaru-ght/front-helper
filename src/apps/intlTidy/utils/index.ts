import { config } from '..';

export const flattenLanguageJson = (input: any, prefix: string[] = []): Record<string, string> => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const out: Record<string, string> = {};
  Object.entries(input).forEach(([k, v]) => {
    const nextPrefix = [...prefix, k];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flattenLanguageJson(v, nextPrefix));
      return;
    }
    const key = getFlattenKey(nextPrefix);
    if (!key) return;
    out[key] = typeof v === 'string' ? v : String(v ?? '');
  });
  return out;
};

export const getFlattenKey = (segments: string[]) => config.prefix + segments.filter(Boolean).join('_');
