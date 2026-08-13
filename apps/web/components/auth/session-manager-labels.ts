import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';

export interface SessionManagerLabels {
  readonly back: string;
  readonly cancel: string;
  readonly confirmRevokeAllConfirm: string;
  readonly confirmRevokeAllDescription: string;
  readonly confirmRevokeAllTitle: string;
  readonly confirmRevokeOneConfirm: string;
  readonly confirmRevokeOneDescriptionTemplate: string;
  readonly confirmRevokeOneTitle: string;
  readonly confirmRevokeOthersConfirm: string;
  readonly confirmRevokeOthersDescription: string;
  readonly confirmRevokeOthersTitle: string;
  readonly currentBadge: string;
  readonly description: string;
  readonly emptyOthers: string;
  readonly errorGeneric: string;
  readonly expires: string;
  readonly freshAuthAction: string;
  readonly freshAuthMessage: string;
  readonly passkeysLink: string;
  readonly revokeAll: string;
  readonly revokeAllPending: string;
  readonly revokeOne: string;
  readonly revokeOnePending: string;
  readonly revokeOthers: string;
  readonly revokeOthersPending: string;
  readonly signOut: string;
  readonly signOutPending: string;
  readonly signedIn: string;
  readonly success: string;
  readonly title: string;
}

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

const SESSION_MANAGER_TRANSLATION_KEYS = {
  back: asTranslationKey('account.security.sessions.back'),
  cancel: asTranslationKey('common.actions.cancel'),
  confirmRevokeAllConfirm: asTranslationKey(
    'account.security.sessions.confirmRevokeAll.confirm',
  ),
  confirmRevokeAllDescription: asTranslationKey(
    'account.security.sessions.confirmRevokeAll.description',
  ),
  confirmRevokeAllTitle: asTranslationKey(
    'account.security.sessions.confirmRevokeAll.title',
  ),
  confirmRevokeOneConfirm: asTranslationKey(
    'account.security.sessions.confirmRevokeOne.confirm',
  ),
  confirmRevokeOneDescriptionTemplate: asTranslationKey(
    'account.security.sessions.confirmRevokeOne.description',
  ),
  confirmRevokeOneTitle: asTranslationKey(
    'account.security.sessions.confirmRevokeOne.title',
  ),
  confirmRevokeOthersConfirm: asTranslationKey(
    'account.security.sessions.confirmRevokeOthers.confirm',
  ),
  confirmRevokeOthersDescription: asTranslationKey(
    'account.security.sessions.confirmRevokeOthers.description',
  ),
  confirmRevokeOthersTitle: asTranslationKey(
    'account.security.sessions.confirmRevokeOthers.title',
  ),
  currentBadge: asTranslationKey('account.security.sessions.currentBadge'),
  description: asTranslationKey('account.security.sessions.description'),
  emptyOthers: asTranslationKey('account.security.sessions.emptyOthers'),
  errorGeneric: asTranslationKey('account.security.sessions.error.generic'),
  expires: asTranslationKey('account.security.sessions.expires'),
  freshAuthAction: asTranslationKey(
    'account.security.sessions.freshAuth.action',
  ),
  freshAuthMessage: asTranslationKey(
    'account.security.sessions.freshAuth.message',
  ),
  passkeysLink: asTranslationKey('account.security.sessions.passkeysLink'),
  revokeAll: asTranslationKey('account.security.sessions.revokeAll'),
  revokeAllPending: asTranslationKey(
    'account.security.sessions.revokeAllPending',
  ),
  revokeOne: asTranslationKey('account.security.sessions.revokeOne'),
  revokeOnePending: asTranslationKey(
    'account.security.sessions.revokeOnePending',
  ),
  revokeOthers: asTranslationKey('account.security.sessions.revokeOthers'),
  revokeOthersPending: asTranslationKey(
    'account.security.sessions.revokeOthersPending',
  ),
  signOut: asTranslationKey('account.security.sessions.signOut'),
  signOutPending: asTranslationKey('account.security.sessions.signOutPending'),
  signedIn: asTranslationKey('account.security.sessions.signedIn'),
  success: asTranslationKey('account.security.sessions.success'),
  title: asTranslationKey('account.security.sessions.title'),
} as const;

function translateSessionManagerKey(
  localization: LocalizationPlatform,
  key: TranslationKey,
): string {
  return localization.translate({ key }).value;
}

export function resolveSessionManagerLabels(
  localization: LocalizationPlatform,
): SessionManagerLabels {
  return {
    back: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.back,
    ),
    cancel: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.cancel,
    ),
    confirmRevokeAllConfirm: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.confirmRevokeAllConfirm,
    ),
    confirmRevokeAllDescription: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.confirmRevokeAllDescription,
    ),
    confirmRevokeAllTitle: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.confirmRevokeAllTitle,
    ),
    confirmRevokeOneConfirm: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.confirmRevokeOneConfirm,
    ),
    confirmRevokeOneDescriptionTemplate: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.confirmRevokeOneDescriptionTemplate,
    ),
    confirmRevokeOneTitle: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.confirmRevokeOneTitle,
    ),
    confirmRevokeOthersConfirm: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.confirmRevokeOthersConfirm,
    ),
    confirmRevokeOthersDescription: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.confirmRevokeOthersDescription,
    ),
    confirmRevokeOthersTitle: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.confirmRevokeOthersTitle,
    ),
    currentBadge: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.currentBadge,
    ),
    description: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.description,
    ),
    emptyOthers: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.emptyOthers,
    ),
    errorGeneric: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.errorGeneric,
    ),
    expires: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.expires,
    ),
    freshAuthAction: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.freshAuthAction,
    ),
    freshAuthMessage: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.freshAuthMessage,
    ),
    passkeysLink: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.passkeysLink,
    ),
    revokeAll: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.revokeAll,
    ),
    revokeAllPending: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.revokeAllPending,
    ),
    revokeOne: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.revokeOne,
    ),
    revokeOnePending: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.revokeOnePending,
    ),
    revokeOthers: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.revokeOthers,
    ),
    revokeOthersPending: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.revokeOthersPending,
    ),
    signOut: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.signOut,
    ),
    signOutPending: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.signOutPending,
    ),
    signedIn: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.signedIn,
    ),
    success: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.success,
    ),
    title: translateSessionManagerKey(
      localization,
      SESSION_MANAGER_TRANSLATION_KEYS.title,
    ),
  };
}

export function formatRevokeOneConfirmationDescription(
  template: string,
  clientLabel: string,
): string {
  return template.replace('{clientLabel}', clientLabel);
}

export const sessionManagerTranslationKeys = SESSION_MANAGER_TRANSLATION_KEYS;
