import i18n from '../i18n';
import { translateKnownBackendMessage } from './backendMessages';

/**
 * Resolves an API error to a user-facing message in the current locale.
 * Backend errors may carry a machine-readable `errorCode` (e.g. PLAY_VERIFY_FAILED)
 * or Portuguese `msg` text that maps to known i18n keys.
 */
export function translateApiError(error: any, fallback?: string): string {
  const code =
    error?.errorCode ||
    error?.data?.errorCode ||
    mapNativeBillingErrorCode(error);

  if (code) {
    const key = `errors.${code}`;
    if (i18n.exists(key)) {
      return i18n.t(key);
    }
  }

  const raw =
    error?.data?.msg ||
    error?.data?.message ||
    error?.response?.data?.msg ||
    error?.message ||
    error?.code;

  if (typeof raw === 'string' && raw.trim()) {
    const mapped = mapNativeBillingErrorCode({ message: raw, code: raw });
    if (mapped) {
      const key = `errors.${mapped}`;
      if (i18n.exists(key)) return i18n.t(key);
    }
    return translateKnownBackendMessage(raw);
  }

  return fallback || i18n.t('errors.GENERIC');
}

function mapNativeBillingErrorCode(error: any): string | undefined {
  if (!error) return undefined;
  const parts = [error.errorCode, error.message, error.code, error?.error?.message, error?.error?.code]
    .filter((value): value is string => typeof value === 'string')
    .join(' ');
  if (!parts) return undefined;
  if (
    parts.includes('PLAY_BILLING_UNAVAILABLE') ||
    parts.includes('BILLING_SETUP_FAILED') ||
    parts.includes('Billing is not available') ||
    parts.includes('Billing service unavailable')
  ) {
    return 'PLAY_BILLING_UNAVAILABLE';
  }
  if (
    parts.includes('não está configurada para faturamento') ||
    parts.includes('not configured for billing') ||
    parts.includes('DEVELOPER_ERROR')
  ) {
    return 'PLAY_APP_BILLING_NOT_CONFIGURED';
  }
  return undefined;
}
