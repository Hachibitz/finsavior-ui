/**
 * Verifies every locale has exactly the same key set as pt-BR (the reference).
 * Run with: node --experimental-strip-types scripts/check-i18n.ts
 */
import { resources } from '../i18n/resources.ts';

const flat = (obj: Record<string, unknown>, prefix = ''): string[] =>
  Object.entries(obj).flatMap(([k, v]) =>
    v !== null && typeof v === 'object' ? flat(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`]
  );

const base = new Set(flat((resources as any)['pt-BR'].translation));
let issues = 0;

for (const [locale, bundle] of Object.entries(resources as Record<string, any>)) {
  const keys = new Set(flat(bundle.translation));
  const missing = [...base].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !base.has(k));
  if (missing.length) {
    console.log(`${locale} MISSING: ${missing.join(', ')}`);
    issues++;
  }
  if (extra.length) {
    console.log(`${locale} EXTRA: ${extra.join(', ')}`);
    issues++;
  }
}

console.log(issues === 0 ? 'ALL LOCALES CONSISTENT' : `${issues} locale issue(s) found`);
process.exit(issues === 0 ? 0 : 1);
