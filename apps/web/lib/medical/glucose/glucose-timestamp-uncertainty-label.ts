import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';
import type { GlucoseDataQualityState } from '@diabetes-universe/medical-domain';

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

const TIMESTAMP_UNCERTAINTY_KEY = asTranslationKey(
  'timeline.glucose.timestamp.check',
);

export function resolveGlucoseTimestampUncertaintyLabel(
  localization: LocalizationPlatform,
  dataQualityState: GlucoseDataQualityState,
): string | null {
  if (dataQualityState !== 'questionable') {
    return null;
  }

  return localization.translate({ key: TIMESTAMP_UNCERTAINTY_KEY }).value;
}
