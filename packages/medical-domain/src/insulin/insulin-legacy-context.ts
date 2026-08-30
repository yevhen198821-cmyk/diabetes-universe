import type { InsulinAdministrationContext } from '@diabetes-universe/types';

/**
 * Exact governed mapping for existing stored Russian demo context strings.
 *
 * Read-only compatibility adapter. Do not use this table to write `context`.
 */
export const INSULIN_LEGACY_ADMINISTRATION_CONTEXT_MAPPING = {
  'Перед едой': 'before_meal',
  'После еды': 'after_meal',
  Коррекция: 'correction',
  Базальный: 'basal',
  Другое: 'other',
} as const satisfies Readonly<Record<string, InsulinAdministrationContext>>;

export type InsulinLegacyContextMappingResult =
  | {
      readonly matched: true;
      readonly administrationContext: InsulinAdministrationContext;
    }
  | {
      readonly matched: false;
    };

/**
 * Maps a stored legacy `context` string through the exact governed table.
 *
 * Blank, partial, differently cased, and unknown values are unmatched.
 */
export function mapLegacyInsulinAdministrationContext(
  context: unknown,
): InsulinLegacyContextMappingResult {
  if (typeof context !== 'string') {
    return { matched: false };
  }

  if (
    !Object.prototype.hasOwnProperty.call(
      INSULIN_LEGACY_ADMINISTRATION_CONTEXT_MAPPING,
      context,
    )
  ) {
    return { matched: false };
  }

  return {
    matched: true,
    administrationContext:
      INSULIN_LEGACY_ADMINISTRATION_CONTEXT_MAPPING[
        context as keyof typeof INSULIN_LEGACY_ADMINISTRATION_CONTEXT_MAPPING
      ],
  };
}
