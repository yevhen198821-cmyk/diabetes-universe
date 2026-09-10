import assert from 'node:assert/strict';
import test from 'node:test';
import { ensureMedicalE2eRuntimeReady } from './ensure-medical-e2e-runtime.ts';
import {
  ensureMedicalProductionRuntimeReady,
  resetMedicalProductionRuntimeForTests,
} from './ensure-medical-production-runtime.ts';
import {
  isMedicalApiRateLimitAdapterRegistered,
  registerMedicalApiRateLimitBackendAdapter,
} from './medical-api-rate-limit.ts';

test('production ignores accidental e2e flag throughout limiter initialization', () => {
  for (const NODE_ENV of ['production', 'test', 'development']) {
    registerMedicalApiRateLimitBackendAdapter(null);
    resetMedicalProductionRuntimeForTests();
    const env = {
      NODE_ENV,
      VERCEL_ENV: 'production',
      AUTH_RUNTIME_ENV: 'e2e',
      MEDICAL_RATE_LIMIT_MODE: 'distributed',
      MEDICAL_RATE_LIMIT_BACKEND: 'e2e-memory',
    };
    ensureMedicalE2eRuntimeReady(env);
    ensureMedicalProductionRuntimeReady(env);
    assert.equal(isMedicalApiRateLimitAdapterRegistered(), false);
  }
});
