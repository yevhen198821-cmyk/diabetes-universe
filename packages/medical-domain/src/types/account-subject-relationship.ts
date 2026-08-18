import type {
  AccountSubjectRelationshipStatus,
  AccountSubjectRelationshipType,
} from './lifecycle';

export interface AccountSubjectRelationship {
  readonly relationshipId: string;
  readonly accountId: string;
  readonly subjectId: string;
  readonly relationshipType: AccountSubjectRelationshipType;
  readonly status: AccountSubjectRelationshipStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}
