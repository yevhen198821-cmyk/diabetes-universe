export type MedicalSubjectStatus = 'active' | 'retired';

/**
 * V1 application-supported relationship types for provisioning APIs.
 * Caregiver/clinician types are intentionally not provisioned in this wave.
 */
export type SupportedAccountSubjectRelationshipType = 'self';

/**
 * Persistence-extensible relationship label stored as TEXT in PostgreSQL.
 * Partial unique indexes scope only `self` active rows so future types are not blocked.
 */
export type AccountSubjectRelationshipType = string;

export type AccountSubjectRelationshipStatus = 'active' | 'revoked';

export type MedicalEventLifecycleState = 'active' | 'deleted';

export type MedicalOutboxStatus = 'pending' | 'published' | 'failed';

export type MedicalAuditOutcome = 'success' | 'denied' | 'error';
