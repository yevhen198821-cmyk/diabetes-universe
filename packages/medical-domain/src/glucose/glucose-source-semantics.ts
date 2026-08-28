import type { EventProvenance } from '@diabetes-universe/types';
import type { TimelineEventSource } from '@diabetes-universe/types';

export interface GlucoseSourceDescriptor {
  readonly sourceIdentity: TimelineEventSource;
  readonly provenanceIdentity: string | null;
}

/**
 * Normalized provenance descriptor for glucose presentation.
 *
 * Free-text labels are not treated as canonical source identities.
 */
export function resolveGlucoseSourceDescriptor(
  source: TimelineEventSource,
  provenance?: EventProvenance,
): GlucoseSourceDescriptor {
  const provenanceIdentity =
    provenance?.externalRef?.trim() || provenance?.label?.trim() || null;

  return {
    provenanceIdentity,
    sourceIdentity: source,
  };
}
