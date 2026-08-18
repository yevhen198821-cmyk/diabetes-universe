import type { MedicalSubjectStatus } from './lifecycle';

export interface MedicalSubject {
  readonly subjectId: string;
  readonly subjectKind: 'person';
  readonly status: MedicalSubjectStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}
