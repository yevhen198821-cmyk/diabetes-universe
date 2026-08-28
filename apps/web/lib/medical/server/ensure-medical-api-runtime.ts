import { ensureMedicalE2eRuntimeReady } from './ensure-medical-e2e-runtime';
import { ensureMedicalProductionRuntimeReady } from './ensure-medical-production-runtime';

export function ensureMedicalApiRuntimeReady(
  env: Record<string, string | undefined> = process.env,
): void {
  ensureMedicalE2eRuntimeReady(env);
  ensureMedicalProductionRuntimeReady(env);
}
