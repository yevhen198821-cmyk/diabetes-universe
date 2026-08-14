export type MedicalSubjectStatus = 'active' | 'retired';

export type AccountSubjectRelationshipType = 'self';

export type AccountSubjectRelationshipStatus = 'active' | 'revoked';

export type MedicalEventLifecycleState = 'active' | 'deleted';

export type MedicalOutboxStatus = 'pending' | 'published' | 'failed';

export type MedicalAuditOutcome = 'success' | 'denied' | 'error';
