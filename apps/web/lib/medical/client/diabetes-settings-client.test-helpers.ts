import type { DiabetesSettingsClientErrorKind } from './diabetes-settings-types';

export { DiabetesSettingsClientError } from './diabetes-settings-types';

export function readMedicalApiErrorKind(
  status: number,
): DiabetesSettingsClientErrorKind {
  if (status === 401) {
    return 'unauthorized';
  }

  if (status === 412) {
    return 'revision_conflict';
  }

  if (status === 428) {
    return 'precondition_required';
  }

  if (status === 429) {
    return 'rate_limited';
  }

  if (status === 422) {
    return 'validation';
  }

  if (status >= 500) {
    return 'server';
  }

  return 'server';
}
