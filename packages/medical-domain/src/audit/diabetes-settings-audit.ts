import type { TargetRangeSource } from '../types/diabetes-settings-enums';

/**
 * Audit resource types for diabetes settings changes.
 *
 * Wave 2B defines contracts only. Wave 2C services write append-only rows to
 * `medical_audit_events` using these identifiers.
 */
export const DIABETES_SETTINGS_AUDIT_RESOURCE_TYPES = {
  diabetesSettings: 'diabetes_settings',
  glucoseTargetProfile: 'glucose_target_profile',
} as const;

export type DiabetesSettingsAuditResourceType =
  (typeof DIABETES_SETTINGS_AUDIT_RESOURCE_TYPES)[keyof typeof DIABETES_SETTINGS_AUDIT_RESOURCE_TYPES];

export const DIABETES_SETTINGS_AUDIT_ACTIONS = {
  settingsUpdated: 'diabetes_settings.updated',
  targetRangeUpdated: 'glucose_target_profile.default_range.updated',
} as const;

export type DiabetesSettingsAuditAction =
  (typeof DIABETES_SETTINGS_AUDIT_ACTIONS)[keyof typeof DIABETES_SETTINGS_AUDIT_ACTIONS];

/**
 * Minimum audit detail payload for settings mutations (Wave 2A §18).
 */
export interface DiabetesSettingsAuditDetail {
  readonly field: string;
  readonly oldValue: unknown;
  readonly newValue: unknown;
  readonly source?: TargetRangeSource;
}

/**
 * Logical audit event shape consumed by Wave 2C when recording target changes.
 */
export interface DiabetesSettingsAuditEventInput {
  readonly subjectId: string;
  readonly actorAccountId: string;
  readonly resourceType: DiabetesSettingsAuditResourceType;
  readonly resourceId: string;
  readonly action: DiabetesSettingsAuditAction;
  readonly changedAt: string;
  readonly detail: DiabetesSettingsAuditDetail;
}
