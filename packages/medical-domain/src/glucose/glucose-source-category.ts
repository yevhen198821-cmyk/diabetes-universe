import type { EventProvenance } from '@diabetes-universe/types';
import type { TimelineEventSource } from '@diabetes-universe/types';

/**
 * Normalized glucose source categories used for product recency policy lookup.
 *
 * Vendor identities (Libre, Dexcom, etc.) belong in provenance metadata, not
 * here.
 */
export type GlucoseSourceCategory =
  | 'manual'
  | 'cgm'
  | 'blood_glucose_meter'
  | 'health_platform'
  | 'import'
  | 'other';

export interface NormalizeGlucoseSourceCategoryInput {
  readonly source: TimelineEventSource;
  readonly provenance?: EventProvenance;
  readonly explicitCategory?: GlucoseSourceCategory;
}

function readProvenanceLabel(
  provenance: EventProvenance | undefined,
): string | null {
  const label = provenance?.label?.trim().toLowerCase();

  if (label && label.length > 0) {
    return label;
  }

  return null;
}

/**
 * Maps runtime timeline source metadata to a normalized glucose source category.
 *
 * Unrecognized or ambiguous runtime sources resolve to `other` (conservative).
 */
export function normalizeGlucoseSourceCategory(
  input: NormalizeGlucoseSourceCategoryInput,
): GlucoseSourceCategory {
  if (input.explicitCategory) {
    return input.explicitCategory;
  }

  switch (input.source) {
    case 'manual':
      return 'manual';
    case 'import':
      return 'import';
    case 'demo':
      return 'other';
    case 'device': {
      const label = readProvenanceLabel(input.provenance);

      if (label?.includes('cgm')) {
        return 'cgm';
      }

      if (
        label?.includes('meter') ||
        label?.includes('glucometer') ||
        label?.includes('blood glucose')
      ) {
        return 'blood_glucose_meter';
      }

      if (
        label?.includes('health') ||
        label?.includes('apple') ||
        label?.includes('connect')
      ) {
        return 'health_platform';
      }

      return 'other';
    }
    default:
      return 'other';
  }
}
