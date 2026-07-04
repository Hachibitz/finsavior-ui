import i18n from '../i18n';

/** Maps known backend Portuguese messages to i18n keys (auth, WhatsApp, signup, etc.). */
const BACKEND_MESSAGE_RULES: [RegExp, string][] = [
  [/apenas para usuários de planos pagos/i, 'errors.WHATSAPP_PAID_ONLY'],
  [/funcionalidade para usuários assinantes/i, 'errors.WHATSAPP_SUBSCRIBERS_ONLY'],
  [/erro ao desabilitar integração com whatsapp/i, 'errors.WHATSAPP_DISABLE_ERROR'],
  [/limite de \d+ mensagens via whatsapp/i, 'errors.WHATSAPP_MESSAGE_LIMIT'],
  [/whatsapp está desabilitada/i, 'errors.WHATSAPP_DISABLED'],
  [/email já cadastrado/i, 'register.errors.emailTaken'],
  [/email inválido/i, 'register.errors.emailInvalid'],
  [/emails não conferem/i, 'register.errors.emailMismatch'],
  [/usuário já cadastrado/i, 'register.errors.usernameTaken'],
  [/usuário precisa ter 4 ou mais/i, 'register.errors.usernameMinLength'],
  [/usuário não pode conter símbolos/i, 'register.errors.usernameNoSymbols'],
  [/nome precisa ter 2 ou mais/i, 'register.errors.firstNameMinLength'],
  [/nome não pode conter símbolos/i, 'register.errors.firstNameNoSymbols'],
  [/sobrenome precisa ter 2 ou mais/i, 'register.errors.lastNameMinLength'],
  [/sobrenome não pode conter símbolos/i, 'register.errors.lastNameNoSymbols'],
  [/as senhas não coincidem/i, 'register.errors.passwordMismatch'],
  [/critérios da senha não atendidos/i, 'register.errors.passwordCriteria'],
  [/token inválido|token expirado|token já utilizado/i, 'passwordRecovery.resetError'],
  [/usuário não encontrado|email não encontrado/i, 'passwordRecovery.sendError'],
  [/limite de importações/i, 'import.limitReached'],
  [/saldo insuficiente|insufficient fscoins/i, 'import.insufficientBalance'],
  [/password_required/i, 'import.protectedPdf'],
];

export function translateKnownBackendMessage(message: string): string {
  if (!message) return message;
  const lines = message.split(/[\n,]/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return message;

  const translated = lines.map((line) => {
    for (const [pattern, key] of BACKEND_MESSAGE_RULES) {
      if (pattern.test(line) && i18n.exists(key)) {
        return i18n.t(key);
      }
    }
    return line;
  });

  return translated.join('\n');
}

export type SignupField =
  | 'email'
  | 'emailConfirmation'
  | 'username'
  | 'firstName'
  | 'lastName'
  | 'password'
  | 'passwordConfirmation';

const SIGNUP_FIELD_RULES: [SignupField, RegExp][] = [
  ['email', /email já cadastrado|email inválido/i],
  ['username', /usuário já cadastrado|usuário precisa ter|usuário não pode conter/i],
  ['firstName', /nome precisa ter|nome não pode conter/i],
  ['lastName', /sobrenome precisa ter|sobrenome não pode conter/i],
  ['emailConfirmation', /emails não conferem/i],
  ['passwordConfirmation', /as senhas não coincidem/i],
  ['password', /critérios da senha não atendidos/i],
];

export function parseSignupFieldErrors(message: string): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!message) return errors;

  message
    .split(/[\n,]/)
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((line) => {
      for (const [field, pattern] of SIGNUP_FIELD_RULES) {
        if (pattern.test(line)) {
          errors[field] = translateKnownBackendMessage(line);
          break;
        }
      }
    });

  return errors;
}
