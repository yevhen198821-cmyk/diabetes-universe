import {
  isMedicalApiRateLimitAdapterRegistered,
  isMedicalApiRateLimitProductionReady,
  registerMedicalApiRateLimitBackendAdapter,
  resolveMedicalApiRateLimitMode,
} from './medical-api-rate-limit';

export {
  isMedicalApiRateLimitAdapterRegistered,
  registerMedicalApiRateLimitBackendAdapter,
} from './medical-api-rate-limit';

export type MedicalApiRuntimeCapability =
  'AVAILABLE' | 'UNAVAILABLE_MISSING_RATE_LIMITER' | 'TEST_DEV_ONLY';

function isProductionRuntime(env: Record<string, string | undefined>): boolean {
  return (
    env.NODE_ENV === 'production' || env.MEDICAL_API_PRODUCTION_GATE === '1'
  );
}

export function resolveMedicalApiRuntimeCapability(
  env: Record<string, string | undefined> = process.env,
): MedicalApiRuntimeCapability {
  const mode = resolveMedicalApiRateLimitMode(env);
  const productionReady = isMedicalApiRateLimitProductionReady(env);
  const adapterRegistered = isMedicalApiRateLimitAdapterRegistered();

  if (isProductionRuntime(env)) {
    return productionReady && adapterRegistered
      ? 'AVAILABLE'
      : 'UNAVAILABLE_MISSING_RATE_LIMITER';
  }

  if (mode === 'disabled' || mode === 'test') {
    return 'TEST_DEV_ONLY';
  }

  if (productionReady) {
    return 'AVAILABLE';
  }

  return 'UNAVAILABLE_MISSING_RATE_LIMITER';
}

export function isMedicalApiProductionTrafficAllowed(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const capability = resolveMedicalApiRuntimeCapability(env);
  return capability === 'AVAILABLE' || capability === 'TEST_DEV_ONLY';
}
