import type { AccountSubjectRelationship } from '@diabetes-universe/medical-domain';

import type { MedicalSubjectRepository } from '@diabetes-universe/medical-persistence/server';

export interface MedicalSubjectService {
  provisionSelfSubject(accountId: string): Promise<AccountSubjectRelationship>;
  findActiveSelfRelationship(
    accountId: string,
  ): Promise<AccountSubjectRelationship | null>;
}

export function createMedicalSubjectService(
  repository: MedicalSubjectRepository,
): MedicalSubjectService {
  return {
    provisionSelfSubject(accountId: string) {
      return repository.provisionSelfSubject(accountId);
    },
    findActiveSelfRelationship(accountId: string) {
      return repository.findActiveSelfRelationship(accountId);
    },
  };
}
