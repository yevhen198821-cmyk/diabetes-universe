import type { InsulinPreparationId } from '@diabetes-universe/types';

/**
 * Presentation grouping chrome derived from a known catalogue entry.
 *
 * This is not a persisted event field, clinical classification, therapy role,
 * or recommendation.
 */
export type InsulinPresentationGrouping =
  'rapid_acting' | 'long_acting' | 'unspecified';

export const INSULIN_PREPARATION_OTHER_ID =
  'insulin.prep.other' as const satisfies InsulinPreparationId;

export const INSULIN_PREPARATION_IDS = [
  'insulin.prep.aspart_novorapid',
  'insulin.prep.aspart_fiasp',
  'insulin.prep.lispro_humalog',
  'insulin.prep.glulisine_apidra',
  'insulin.prep.glargine_lantus',
  'insulin.prep.degludec_tresiba',
  INSULIN_PREPARATION_OTHER_ID,
] as const satisfies readonly InsulinPreparationId[];

export const INSULIN_PREPARATION_ID_SET: ReadonlySet<InsulinPreparationId> =
  new Set(INSULIN_PREPARATION_IDS);

const INSULIN_PRESENTATION_GROUPING_BY_ID = {
  'insulin.prep.aspart_novorapid': 'rapid_acting',
  'insulin.prep.aspart_fiasp': 'rapid_acting',
  'insulin.prep.lispro_humalog': 'rapid_acting',
  'insulin.prep.glulisine_apidra': 'rapid_acting',
  'insulin.prep.glargine_lantus': 'long_acting',
  'insulin.prep.degludec_tresiba': 'long_acting',
  'insulin.prep.other': 'unspecified',
} as const satisfies Record<InsulinPreparationId, InsulinPresentationGrouping>;

export function isInsulinPreparationId(
  value: unknown,
): value is InsulinPreparationId {
  return (
    typeof value === 'string' &&
    INSULIN_PREPARATION_ID_SET.has(value as InsulinPreparationId)
  );
}

/**
 * Resolves catalogue presentation grouping from a preparation identity.
 *
 * Missing or unknown runtime IDs resolve to `unspecified`. Display text is
 * never consulted.
 */
export function resolveInsulinPresentationGrouping(
  preparationId: unknown,
): InsulinPresentationGrouping {
  if (!isInsulinPreparationId(preparationId)) {
    return 'unspecified';
  }

  return INSULIN_PRESENTATION_GROUPING_BY_ID[preparationId];
}
