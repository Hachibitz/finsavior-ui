import i18n from '../i18n';
import { translateKnownBackendMessage } from './backendMessages';

/**
 * Resolves an API error to a user-facing message in the current locale.
 * Backend errors may carry a machine-readable `errorCode` (e.g. PLAY_VERIFY_FAILED)
 * or Portuguese `msg` text that maps to known i18n keys.
 */
export function translateApiError(error: any, fallback?: string): string {
  const code = error?.errorCode || error?.data?.errorCode;
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
    error?.message;

  if (typeof raw === 'string' && raw.trim()) {
    return translateKnownBackendMessage(raw);
  }

  return fallback || i18n.t('errors.GENERIC');
}
