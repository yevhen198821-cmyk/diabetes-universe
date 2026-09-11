import {
  isMedicalApiRateLimitAdapterRegistered,
  isMedicalApiRateLimitProductionReady,
  registerMedicalApiRateLimitBackendAdapter,
} from './medical-api-rate-limit';
import { createProductionMedicalApiRateLimitAdapter } from './medical-api-rate-limit-production-adapter';

let productionRuntimeInitialized = false;

export function ensureMedicalProductionRuntimeReady(
  env: Record<string, string | undefined> = process.env,
): void {
  if (productionRuntimeInitialized) {
    return;
  }

  if (!isMedicalApiRateLimitProductionReady(env)) {
    return;
  }

  if (isMedicalApiRateLimitAdapterRegistered()) {
    productionRuntimeInitialized = true;
    return;
  }

  const adapter = createProductionMedicalApiRateLimitAdapter(env);
  if (adapter) {
    registerMedicalApiRateLimitBackendAdapter(adapter);
  }

  productionRuntimeInitialized = true;
}

export function resetMedicalProductionRuntimeForTests(): void {
  productionRuntimeInitialized = false;
}
