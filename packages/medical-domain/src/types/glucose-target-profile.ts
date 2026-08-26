import type { MedicalRevision } from './medical-revision';
import type { GlucoseTargetRange } from './glucose-target-range';

/**
 * Subject-scoped glucose target profile (Wave 2).
 *
 * Wave 2 implements only `defaultRange`. Future `segments[]` are intentionally
 * omitted from this contract until a later wave requires them.
 */
export interface GlucoseTargetProfile {
  readonly profileId: string;
  readonly subjectId: string;
  readonly defaultRange: GlucoseTargetRange | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly revision: MedicalRevision;
}
