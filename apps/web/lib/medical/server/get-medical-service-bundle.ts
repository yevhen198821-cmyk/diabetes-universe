import {
  closeMedicalServiceBundle,
  createMedicalServiceBundle,
  resolveMedicalServiceEnvironment,
  type MedicalServiceBundle,
} from '@diabetes-universe/medical-service/server';

let cachedBundle: MedicalServiceBundle | null = null;
let cachedEnvironmentKey: string | null = null;

function environmentCacheKey(): string {
  const env = process.env;
  return [
    env.NODE_ENV,
    env.MEDICAL_DATABASE_MODE,
    env.MEDICAL_USE_PGLITE,
    env.MEDICAL_DATABASE_URL,
    env.MEDICAL_REVISION_TOKEN_SECRET,
    env.MEDICAL_LIST_CURSOR_SECRET,
  ].join('|');
}

export async function getMedicalServiceBundle(): Promise<MedicalServiceBundle> {
  const key = environmentCacheKey();

  if (cachedBundle && cachedEnvironmentKey === key) {
    return cachedBundle;
  }

  if (cachedBundle) {
    await closeMedicalServiceBundle(cachedBundle);
  }

  const environment = resolveMedicalServiceEnvironment(process.env);
  cachedBundle = await createMedicalServiceBundle(environment);
  cachedEnvironmentKey = key;
  return cachedBundle;
}

export async function resetMedicalServiceBundleForTests(): Promise<void> {
  if (cachedBundle) {
    await closeMedicalServiceBundle(cachedBundle);
  }
  cachedBundle = null;
  cachedEnvironmentKey = null;
}
