import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';
import type { TimelineEventSource } from '@diabetes-universe/types';

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

const MEDICAL_SOURCE_KEYS = {
  device: asTranslationKey('dashboard.lastGlucose.source.device'),
  import: asTranslationKey('dashboard.lastGlucose.source.import'),
  manual: asTranslationKey('dashboard.lastGlucose.source.manual'),
} as const;

export function resolveDashboardMedicalEventSourceLabel(
  localization: LocalizationPlatform,
  source: TimelineEventSource | undefined,
): string | null {
  if (!source || source === 'demo') {
    return null;
  }

  const key = MEDICAL_SOURCE_KEYS[source as keyof typeof MEDICAL_SOURCE_KEYS];

  if (!key) {
    return null;
  }

  return localization.translate({ key }).value;
}
