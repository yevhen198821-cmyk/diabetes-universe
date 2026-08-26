import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPreviewMedicalDiagnosticsReport,
  isPreviewMedicalDiagnosticsEnabled,
} from './preview-medical-diagnostics.ts';
import { ensureMedicalApiRuntimeReady } from './ensure-medical-api-runtime.ts';
import {
  registerMedicalApiRateLimitBackendAdapter,
  resetMedicalApiRateLimiterForTests,
} from './medical-api-rate-limit.ts';
import { resetMedicalProductionRuntimeForTests } from './ensure-medical-production-runtime.ts';

test.afterEach(() => {
  delete process.env.VERCEL_ENV;
  delete process.env.MEDICAL_RATE_LIMIT_MODE;
  delete process.env.MEDICAL_RATE_LIMIT_BACKEND;
  registerMedicalApiRateLimitBackendAdapter(null);
  resetMedicalApiRateLimiterForTests();
  resetMedicalProductionRuntimeForTests();
});

test('preview medical diagnostics disabled outside preview runtime', () => {
  assert.equal(
    isPreviewMedicalDiagnosticsEnabled({ VERCEL_ENV: 'production' }),
    false,
  );
});

test('preview medical diagnostics reports production readiness after bootstrap', () => {
  process.env.VERCEL_ENV = 'preview';
  process.env.NODE_ENV = 'production';
  process.env.MEDICAL_RATE_LIMIT_MODE = 'distributed';
  process.env.MEDICAL_RATE_LIMIT_BACKEND = 'process-local';

  const before = buildPreviewMedicalDiagnosticsReport(process.env);
  assert.equal(
    before.medicalRuntime.capability,
    'UNAVAILABLE_MISSING_RATE_LIMITER',
  );
  assert.equal(before.medicalRuntime.adapterRegistered, false);

  ensureMedicalApiRuntimeReady(process.env);

  const after = buildPreviewMedicalDiagnosticsReport(process.env);
  assert.equal(after.medicalRuntime.adapterRegistered, true);
  assert.equal(after.medicalRuntime.capability, 'AVAILABLE');
});
