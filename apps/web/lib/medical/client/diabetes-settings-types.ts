import type {
  DiabetesTypeClassification,
  GlucoseDisplayUnit,
  GlucoseTargetRange,
} from '@diabetes-universe/medical-domain';

export interface DiabetesSettingsResource {
  readonly configured: boolean;
  readonly settingsId: string | null;
  readonly subjectId: string;
  readonly glucoseDisplayUnit: GlucoseDisplayUnit | null;
  readonly diabetesType: DiabetesTypeClassification;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
  readonly revision: string;
}

export interface GlucoseTargetProfileResource {
  readonly configured: boolean;
  readonly profileId: string | null;
  readonly subjectId: string;
  readonly defaultRange: GlucoseTargetRange | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
  readonly revision: string;
}

export type DiabetesSettingsClientErrorKind =
  | 'network'
  | 'unauthorized'
  | 'validation'
  | 'revision_conflict'
  | 'precondition_required'
  | 'rate_limited'
  | 'server';

export class DiabetesSettingsClientError extends Error {
  readonly kind: DiabetesSettingsClientErrorKind;

  constructor(kind: DiabetesSettingsClientErrorKind, message: string) {
    super(message);
    this.name = 'DiabetesSettingsClientError';
    this.kind = kind;
  }
}
