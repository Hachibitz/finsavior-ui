import type { TFunction } from 'i18next';
import i18n from '../i18n';

/** Built-in category ids shipped with the app (seed + backend defaults). */
export const SYSTEM_CATEGORY_IDS = new Set([
  'housing',
  'food',
  'energy',
  'water',
  'internet',
  'transport',
  'health',
  'education',
  'personal_care',
  'entertainment',
  'insurance',
  'pets',
  'subscriptions',
  'shopping',
  'services',
  'utilities',
  'salary',
  'freelance',
  'projects',
  'investments',
  'savings',
  'others',
]);

function normalizeCategoryId(id: string): string {
  return id.trim().toLowerCase().replace(/\s+/g, '_');
}

/**
 * Resolves a category label for display. System categories use i18n keys;
 * user-created categories use the stored name from the API.
 */
export function getCategoryLabel(
  category: { id: string; name?: string } | string,
  t: TFunction
): string {
  const id = typeof category === 'string' ? category : category.id;
  const storedName = typeof category === 'string' ? undefined : category.name;
  const normalized = normalizeCategoryId(id);

  if (SYSTEM_CATEGORY_IDS.has(normalized)) {
    const key = `categories.defaults.${normalized}`;
    if (i18n.exists(key)) {
      return t(key);
    }
  }

  if (storedName?.trim()) {
    return storedName;
  }

  return id;
}
