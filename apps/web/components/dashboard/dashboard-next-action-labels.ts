import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';
import type { NextStep } from '@diabetes-universe/types';

import type { DashboardNextActionMessage } from './dashboard-next-action-model';

export interface DashboardNextActionLabels {
  readonly emptyDescription: string;
  readonly emptyTitle: string;
  readonly errorDescription: string;
  readonly errorTitle: string;
  readonly loading: string;
}

export type NextActionReadyPresentationKeys = Readonly<{
  actionLabelKey: string;
  descriptionKey?: string;
  messageKey: string;
}>;

export type NextActionInformationalPresentationKeys = Readonly<{
  descriptionKey?: string;
  messageKey: string;
}>;

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

const DASHBOARD_NEXT_ACTION_TRANSLATION_KEYS = {
  action: asTranslationKey('dashboard.nextAction.action'),
  description: asTranslationKey('dashboard.nextAction.description'),
  emptyDescription: asTranslationKey('dashboard.nextAction.empty.description'),
  emptyTitle: asTranslationKey('dashboard.nextAction.empty.title'),
  errorDescription: asTranslationKey('dashboard.nextAction.error.description'),
  errorTitle: asTranslationKey('dashboard.nextAction.error.title'),
  fallbackDescription: asTranslationKey(
    'dashboard.nextAction.fallback.description',
  ),
  fallbackTitle: asTranslationKey('dashboard.nextAction.fallback.title'),
  loading: asTranslationKey('dashboard.nextAction.loading'),
  title: asTranslationKey('dashboard.nextAction.title'),
} as const;

function translateDashboardNextActionKey(
  localization: LocalizationPlatform,
  key: TranslationKey,
): string {
  return localization.translate({ key }).value;
}

/**
 * Resolves localized Dashboard Next Action block labels from the platform runtime.
 */
export function resolveDashboardNextActionLabels(
  localization: LocalizationPlatform,
): DashboardNextActionLabels {
  return {
    emptyDescription: translateDashboardNextActionKey(
      localization,
      DASHBOARD_NEXT_ACTION_TRANSLATION_KEYS.emptyDescription,
    ),
    emptyTitle: translateDashboardNextActionKey(
      localization,
      DASHBOARD_NEXT_ACTION_TRANSLATION_KEYS.emptyTitle,
    ),
    errorDescription: translateDashboardNextActionKey(
      localization,
      DASHBOARD_NEXT_ACTION_TRANSLATION_KEYS.errorDescription,
    ),
    errorTitle: translateDashboardNextActionKey(
      localization,
      DASHBOARD_NEXT_ACTION_TRANSLATION_KEYS.errorTitle,
    ),
    loading: translateDashboardNextActionKey(
      localization,
      DASHBOARD_NEXT_ACTION_TRANSLATION_KEYS.loading,
    ),
  };
}

/**
 * Resolves a ready-state NextStep from quick-add presentation keys.
 * Requires actionLabelKey — never returns CTA-less ready content.
 */
export function resolveNextActionReadyStep(
  localization: LocalizationPlatform,
  presentation: NextActionReadyPresentationKeys,
): NextStep {
  return {
    actionLabel: translateDashboardNextActionKey(
      localization,
      asTranslationKey(presentation.actionLabelKey),
    ),
    description: presentation.descriptionKey
      ? translateDashboardNextActionKey(
          localization,
          asTranslationKey(presentation.descriptionKey),
        )
      : '',
    title: translateDashboardNextActionKey(
      localization,
      asTranslationKey(presentation.messageKey),
    ),
  };
}

/**
 * Resolves informational (non-CTA) presentation from none/navigate keys.
 */
export function resolveNextActionInformationalContent(
  localization: LocalizationPlatform,
  presentation: NextActionInformationalPresentationKeys,
): DashboardNextActionMessage {
  return {
    description: presentation.descriptionKey
      ? translateDashboardNextActionKey(
          localization,
          asTranslationKey(presentation.descriptionKey),
        )
      : undefined,
    title: translateDashboardNextActionKey(
      localization,
      asTranslationKey(presentation.messageKey),
    ),
  };
}

export function resolveDashboardNextActionEmptyContent(
  localization: LocalizationPlatform,
): DashboardNextActionMessage {
  const labels = resolveDashboardNextActionLabels(localization);

  return {
    description: labels.emptyDescription,
    title: labels.emptyTitle,
  };
}

export function resolveDashboardNextActionErrorContent(
  localization: LocalizationPlatform,
): DashboardNextActionMessage {
  const labels = resolveDashboardNextActionLabels(localization);

  return {
    description: labels.errorDescription,
    title: labels.errorTitle,
  };
}

export const dashboardNextActionTranslationKeys =
  DASHBOARD_NEXT_ACTION_TRANSLATION_KEYS;
