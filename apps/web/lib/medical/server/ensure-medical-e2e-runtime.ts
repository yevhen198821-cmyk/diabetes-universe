import { registerMedicalApiRateLimitBackendAdapter } from './medical-api-rate-limit';

let e2eRuntimeInitialized = false;

export function ensureMedicalE2eRuntimeReady(
  env: Record<string, string | undefined> = process.env,
): void {
  if (e2eRuntimeInitialized || env.AUTH_RUNTIME_ENV !== 'e2e') {
    return;
  }

  registerMedicalApiRateLimitBackendAdapter({
    check: () => ({ outcome: 'allowed' }),
  });
  e2eRuntimeInitialized = true;
}
