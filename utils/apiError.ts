import i18n from '../i18n';

/**
 * Resolves an API error to a user-facing message in the current locale.
 * Backend errors carry a machine-readable `errorCode` (e.g. PLAY_VERIFY_FAILED)
 * that maps to the `errors.*` i18n namespace; the backend `msg` (Portuguese)
 * is only used as fallback for codes the frontend doesn't know yet.
 */
export function translateApiError(error: any, fallback?: string): string {
  const code = error?.errorCode || error?.data?.errorCode;
  if (code) {
    const key = `errors.${code}`;
    if (i18n.exists(key)) {
      return i18n.t(key);
    }
    if (error?.data?.msg) {
      return error.data.msg;
    }
  }
  return error?.data?.msg || error?.message || fallback || i18n.t('errors.GENERIC');
}
