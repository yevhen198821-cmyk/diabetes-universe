import type { MedicalApiRuntimeCapability } from './medical-api-runtime-readiness';
import {
  isMedicalApiRateLimitAdapterRegistered,
  isMedicalApiRateLimitProductionReady,
} from './medical-api-rate-limit';
import { resolveMedicalApiRuntimeCapability } from './medical-api-runtime-readiness';

type EnvPresence = 'MISSING' | 'SET';

function envPresence(name: string, env: NodeJS.ProcessEnv): EnvPresence {
  const value = env[name]?.trim();
  return value ? 'SET' : 'MISSING';
}

export interface PreviewMedicalDiagnosticsReport {
  readonly medicalRuntime: Readonly<{
    readonly capability: MedicalApiRuntimeCapability;
    readonly rateLimitMode: string | null;
    readonly rateLimitBackend: EnvPresence;
    readonly rateLimitProductionReady: boolean;
    readonly adapterRegistered: boolean;
    readonly revisionTokenSecret: EnvPresence;
    readonly listCursorSecret: EnvPresence;
    readonly databaseUrl: EnvPresence;
    readonly databaseMode: string | null;
  }>;
}

export function buildPreviewMedicalDiagnosticsReport(
  env: NodeJS.ProcessEnv = process.env,
): PreviewMedicalDiagnosticsReport {
  return {
    medicalRuntime: {
      capability: resolveMedicalApiRuntimeCapability(env),
      rateLimitMode: env.MEDICAL_RATE_LIMIT_MODE?.trim() ?? null,
      rateLimitBackend: envPresence('MEDICAL_RATE_LIMIT_BACKEND', env),
      rateLimitProductionReady: isMedicalApiRateLimitProductionReady(env),
      adapterRegistered: isMedicalApiRateLimitAdapterRegistered(),
      revisionTokenSecret: envPresence('MEDICAL_REVISION_TOKEN_SECRET', env),
      listCursorSecret: envPresence('MEDICAL_LIST_CURSOR_SECRET', env),
      databaseUrl: envPresence('MEDICAL_DATABASE_URL', env),
      databaseMode: env.MEDICAL_DATABASE_MODE?.trim() ?? null,
    },
  };
}

export function isPreviewMedicalDiagnosticsEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.VERCEL_ENV === 'preview';
}
