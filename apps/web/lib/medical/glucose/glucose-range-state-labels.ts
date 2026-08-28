import type {
  LocalizationPlatform,
  TranslationKey,
} from '@diabetes-universe/i18n';
import type {
  GlucoseDataQualityState,
  GlucoseRangeState,
} from '@diabetes-universe/medical-domain';

function asTranslationKey(value: string): TranslationKey {
  return value as TranslationKey;
}

const GLUCOSE_RANGE_TRANSLATION_KEYS = {
  above_range: asTranslationKey('timeline.glucose.range.above'),
  below_range: asTranslationKey('timeline.glucose.range.below'),
  in_range: asTranslationKey('timeline.glucose.range.in'),
} as const satisfies Partial<Record<GlucoseRangeState, TranslationKey>>;

/**
 * Resolves a localized range label relative to the user's configured target.
 *
 * Returns null when range is unknown or technical quality suppresses confident
 * range presentation.
 */
export function resolveGlucoseRangeStateLabel(
  localization: LocalizationPlatform,
  rangeState: GlucoseRangeState,
  dataQualityState: GlucoseDataQualityState,
): string | null {
  if (dataQualityState !== 'valid' || rangeState === 'unknown') {
    return null;
  }

  const key =
    GLUCOSE_RANGE_TRANSLATION_KEYS[
      rangeState as keyof typeof GLUCOSE_RANGE_TRANSLATION_KEYS
    ];

  if (!key) {
    return null;
  }

  return localization.translate({ key }).value;
}
