import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { AppLocale, resources, SUPPORTED_LOCALES } from './resources';

export const LOCALE_STORAGE_KEY = 'finsavior_locale';
export const LOCALE_CHOSEN_KEY = 'finsavior_locale_chosen';

const COUNTRY_LOCALE_MAP: Record<string, AppLocale> = {
  BR: 'pt-BR', PT: 'pt-BR',
  US: 'en-US', GB: 'en-US', AU: 'en-US', CA: 'en-US', NZ: 'en-US', IE: 'en-US',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es',
  FR: 'fr', BE: 'fr', CH: 'fr',
  CN: 'zh-CN', TW: 'zh-CN', HK: 'zh-CN', SG: 'zh-CN',
  JP: 'ja',
  DE: 'de', AT: 'de',
  IT: 'it',
  KR: 'ko',
  IN: 'hi',
  SA: 'ar', AE: 'ar', EG: 'ar', MA: 'ar',
  ID: 'id',
};

function matchBrowserLocale(raw: string): AppLocale {
  const normalized = raw.replace('_', '-');
  const exact = SUPPORTED_LOCALES.find((l) => l.code === normalized);
  if (exact) return exact.code;

  const lang = normalized.split('-')[0].toLowerCase();
  const partial = SUPPORTED_LOCALES.find((l) => l.code.toLowerCase().startsWith(lang));
  if (partial) return partial.code;

  if (lang === 'pt') return 'pt-BR';
  if (lang === 'en') return 'en-US';
  if (lang === 'zh') return 'zh-CN';

  return 'en-US';
}

function detectCountryLocale(): AppLocale | null {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const region = locale.split('-')[1]?.toUpperCase();
    if (region && COUNTRY_LOCALE_MAP[region]) {
      return COUNTRY_LOCALE_MAP[region];
    }
  } catch {
    // ignore
  }
  return null;
}

export function detectInitialLocale(): AppLocale {
  const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as AppLocale | null;
  if (saved && resources[saved]) return saved;

  return detectCountryLocale()
    ?? matchBrowserLocale(navigator.language || 'en-US');
}

export function applyDocumentLocale(locale: AppLocale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
}

export async function setAppLocale(locale: AppLocale, userChosen = true) {
  await i18n.changeLanguage(locale);
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  if (userChosen) {
    localStorage.setItem(LOCALE_CHOSEN_KEY, 'true');
  }
  applyDocumentLocale(locale);
}

const initialLocale = detectInitialLocale();

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLocale,
  fallbackLng: 'pt-BR',
  interpolation: { escapeValue: false },
});

applyDocumentLocale(initialLocale);

export default i18n;
