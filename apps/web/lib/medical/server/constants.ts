export const MEDICAL_API_VERSION = 'v1';
export const MEDICAL_EVENTS_BASE_PATH = '/api/v1/medical/me/medical-events';
export const MEDICAL_CREATE_OPERATION_SCOPE = 'medical_event.create';
export const MEDICAL_IDEMPOTENCY_HEADER = 'idempotency-key';
export const MEDICAL_MAX_REQUEST_BYTES = 65_536;
export const MEDICAL_MAX_IDEMPOTENCY_KEY_LENGTH = 128;
export const MEDICAL_IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;
export const MEDICAL_ADOPTION_BASE_PATH =
  '/api/v1/medical/me/adoption-sessions';
export const MEDICAL_ADOPTION_OPERATION_SCOPE = 'adoption.import';
export const MEDICAL_DIABETES_SETTINGS_BASE_PATH =
  '/api/v1/medical/me/diabetes-settings';
export const MEDICAL_GLUCOSE_TARGET_PROFILE_BASE_PATH =
  '/api/v1/medical/me/glucose-target-profile';
