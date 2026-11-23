import i18n from './index';

/** BCP-47 tag used by Intl APIs from the active app locale. */
export function intlLocale(): string {
  const lang = i18n.language || 'pt-BR';
  if (lang === 'pt-BR') return 'pt-BR';
  if (lang === 'en-US') return 'en-US';
  if (lang === 'zh-CN') return 'zh-CN';
  return lang;
}

export function formatMonthYear(yyyyMM: string): string {
  const [y, m] = yyyyMM.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString(intlLocale(), { month: 'long', year: 'numeric' });
}

export function formatMonthShort(date: Date): string {
  return date.toLocaleString(intlLocale(), { month: 'short' }).replace('.', '');
}

export function formatCurrency(value: number, currencyCode?: string): string {
  const locale = intlLocale();
  const currency =
    currencyCode ||
    (locale.startsWith('pt') ? 'BRL' : locale.startsWith('en') ? 'USD' : 'BRL');
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(intlLocale(), { day: '2-digit', month: 'short' });
}

export function formatPurchaseDate(value?: string | null): string | null {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (date.getFullYear() !== Number(match[1]) || date.getMonth() !== Number(match[2]) - 1 || date.getDate() !== Number(match[3])) return null;
  return date.toLocaleDateString(intlLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Whisper / OpenAI language code from app locale. */
export function whisperLanguageCode(): string {
  const lang = i18n.language || 'pt-BR';
  if (lang.startsWith('pt')) return 'pt';
  if (lang.startsWith('en')) return 'en';
  if (lang.startsWith('es')) return 'es';
  if (lang.startsWith('fr')) return 'fr';
  if (lang.startsWith('de')) return 'de';
  if (lang.startsWith('it')) return 'it';
  if (lang.startsWith('ja')) return 'ja';
  if (lang.startsWith('ko')) return 'ko';
  if (lang.startsWith('zh')) return 'zh';
  if (lang.startsWith('hi')) return 'hi';
  if (lang.startsWith('ar')) return 'ar';
  if (lang.startsWith('id')) return 'id';
  return 'en';
}
