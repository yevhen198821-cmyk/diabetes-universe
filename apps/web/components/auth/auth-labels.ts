import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

function translate(localization: LocalizationPlatform, key: string): string {
  return localization.translate({ key: asTranslationKey(key) }).value;
}

export interface AuthSignInLabels {
  readonly continue: string;
  readonly description: string;
  readonly disclaimer: string;
  readonly emailHint: string;
  readonly emailLabel: string;
  readonly orEmail: string;
  readonly passkey: string;
  readonly passkeyError: string;
  readonly passkeyPending: string;
  readonly returnToApp: string;
  readonly sending: string;
  readonly title: string;
}

export interface AuthCheckEmailLabels {
  readonly requestAgain: string;
  readonly returnToApp: string;
  readonly spamHint: string;
  readonly title: string;
  readonly withAddress: string;
  readonly withoutAddress: string;
}

export interface AuthErrorLabels {
  readonly backToSignIn: string;
  readonly continueWithoutSignIn: string;
  readonly description: string;
  readonly title: string;
}

export function resolveAuthSignInLabels(
  localization: LocalizationPlatform,
): AuthSignInLabels {
  return {
    continue: translate(localization, 'account.auth.signIn.continue'),
    description: translate(localization, 'account.auth.signIn.description'),
    disclaimer: translate(localization, 'account.auth.signIn.disclaimer'),
    emailHint: translate(localization, 'account.auth.signIn.emailHint'),
    emailLabel: translate(localization, 'account.auth.signIn.emailLabel'),
    orEmail: translate(localization, 'account.auth.signIn.orEmail'),
    passkey: translate(localization, 'account.auth.signIn.passkey'),
    passkeyError: translate(localization, 'account.auth.signIn.passkeyError'),
    passkeyPending: translate(
      localization,
      'account.auth.signIn.passkeyPending',
    ),
    returnToApp: translate(localization, 'account.auth.signIn.returnToApp'),
    sending: translate(localization, 'account.auth.signIn.sending'),
    title: translate(localization, 'account.auth.signIn.title'),
  };
}

export function resolveAuthCheckEmailLabels(
  localization: LocalizationPlatform,
): AuthCheckEmailLabels {
  return {
    requestAgain: translate(
      localization,
      'account.auth.checkEmail.requestAgain',
    ),
    returnToApp: translate(localization, 'account.auth.checkEmail.returnToApp'),
    spamHint: translate(localization, 'account.auth.checkEmail.spamHint'),
    title: translate(localization, 'account.auth.checkEmail.title'),
    withAddress: translate(localization, 'account.auth.checkEmail.withAddress'),
    withoutAddress: translate(
      localization,
      'account.auth.checkEmail.withoutAddress',
    ),
  };
}

export function resolveAuthErrorLabels(
  localization: LocalizationPlatform,
): AuthErrorLabels {
  return {
    backToSignIn: translate(localization, 'account.auth.error.backToSignIn'),
    continueWithoutSignIn: translate(
      localization,
      'account.auth.error.continueWithoutSignIn',
    ),
    description: translate(localization, 'account.auth.error.description'),
    title: translate(localization, 'account.auth.error.title'),
  };
}
