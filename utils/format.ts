/**
 * Shared formatting helpers. Centralized so currency/date rendering stays
 * consistent across screens (previously each component formatted ad hoc, e.g.
 * `toFixed(0)` dropped the decimals on the bills list).
 */

const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats a numeric value as Brazilian currency without rounding, e.g. 1888 -> "R$ 1.888,00". */
export const formatCurrency = (value: number | null | undefined): string => {
  const safe = Number.isFinite(value as number) ? (value as number) : 0;
  return `R$ ${BRL_FORMATTER.format(safe)}`;
};

/** Formats only the number part (no "R$" prefix). */
export const formatAmount = (value: number | null | undefined): string => {
  const safe = Number.isFinite(value as number) ? (value as number) : 0;
  return BRL_FORMATTER.format(safe);
};

const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

/**
 * Returns a short "dd/MM" day label for a bill date, preferring the real
 * purchase date when available. Returns null when no day-level info exists
 * (e.g. only a "Jun 2026" billing month is known).
 */
export const formatDayLabel = (purchaseDate?: string | null, fallbackDate?: string | null): string | null => {
  const source = purchaseDate || fallbackDate;
  if (!source) return null;

  // ISO date (yyyy-MM-dd[ ...])
  const iso = source.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}`;

  // "Jun 2026" style has no day -> nothing meaningful to show
  const monthYear = source.match(/^([A-Za-z]{3,})\s+\d{4}$/);
  if (monthYear) return null;

  const d = new Date(source);
  if (!isNaN(d.getTime())) {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
  return null;
};

/**
 * Formats a date as "dd MMM" (pt-BR), preferring the real purchase date. Parses
 * ISO dates as local time to avoid the timezone off-by-one that `new Date('yyyy-MM-dd')`
 * (UTC midnight) would cause in negative-offset zones.
 */
export const formatShortDate = (purchaseDate?: string | null, fallbackDate?: string | null): string => {
  const source = purchaseDate || fallbackDate || '';
  if (!source) return '';

  let d: Date;
  const iso = source.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  } else {
    d = new Date(source);
  }
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};
