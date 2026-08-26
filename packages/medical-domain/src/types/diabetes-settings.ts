import type { MedicalRevision } from './medical-revision';
import type { GlucoseDisplayUnit } from './diabetes-settings-enums';
import type { DiabetesTypeClassification } from './diabetes-type-classification';

/**
 * Subject-scoped diabetes configuration (Wave 2).
 *
 * Transitional database state: `glucoseDisplayUnit: null` means the subject has
 * not yet explicitly chosen a display unit. Wave 2D/2E must resolve this before
 * manual glucose entry. This is not a product-valid steady state for glucose entry.
 */
export interface DiabetesSettings {
  readonly settingsId: string;
  readonly subjectId: string;
  readonly glucoseDisplayUnit: GlucoseDisplayUnit | null;
  readonly diabetesType: DiabetesTypeClassification;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly revision: MedicalRevision;
}
