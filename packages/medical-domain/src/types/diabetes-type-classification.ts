import type {
  DiabetesTypeCategory,
  DiabetesTypeSource,
} from './diabetes-settings-enums';

/**
 * Informational self-reported diabetes type metadata (Wave 2).
 *
 * Not a clinical diagnosis record. Does not infer targets or therapy behavior.
 */
export interface DiabetesTypeClassification {
  readonly category: DiabetesTypeCategory;
  readonly otherDescriptor?: string | null;
  readonly source: DiabetesTypeSource;
}
