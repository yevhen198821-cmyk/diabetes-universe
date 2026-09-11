import {
  createEnforcingMedicalApiRateLimiter,
  MemoryMedicalApiRateLimitCounterStore,
} from './medical-api-enforcing-rate-limiter';
import type {
  MedicalApiRateLimitDecision,
  MedicalApiRateLimitInput,
  MedicalApiRateLimiter,
} from './medical-api-rate-limit';
import {
  createPostgresMedicalApiRateLimitCounterStore,
  createPostgresMedicalApiRateLimitSql,
} from './medical-api-rate-limit-postgres-store';

function resolveRateLimitBackend(
  env: Record<string, string | undefined>,
): string {
  return env.MEDICAL_RATE_LIMIT_BACKEND?.trim().toLowerCase() ?? '';
}

function isMemoryBackend(backend: string): boolean {
  return (
    backend === 'process-local' ||
    backend === 'memory' ||
    backend === 'e2e-memory'
  );
}

export function isMemoryRateLimitBackendForbiddenInProduction(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return (
    isMemoryBackend(resolveRateLimitBackend(env)) &&
    env.VERCEL_ENV === 'production'
  );
}

const sharedMemoryStore = new MemoryMedicalApiRateLimitCounterStore();

export function createProcessLocalMedicalApiRateLimitAdapter(): MedicalApiRateLimiter {
  return createEnforcingMedicalApiRateLimiter(sharedMemoryStore);
}

export function resetProcessLocalMedicalApiRateLimitStoreForTests(): void {
  sharedMemoryStore.reset();
}

function createLazyPostgresMedicalApiRateLimitAdapter(
  databaseUrl: string,
): MedicalApiRateLimiter {
  let limiterPromise: Promise<MedicalApiRateLimiter> | null = null;

  const resolveLimiter = () => {
    limiterPromise ??= createPostgresMedicalApiRateLimitSql(databaseUrl).then(
      (sql) =>
        createEnforcingMedicalApiRateLimiter(
          createPostgresMedicalApiRateLimitCounterStore({ sql }),
        ),
    );
    return limiterPromise;
  };

  return {
    async check(
      input: MedicalApiRateLimitInput,
    ): Promise<MedicalApiRateLimitDecision> {
      try {
        const limiter = await resolveLimiter();
        return limiter.check(input);
      } catch {
        return { outcome: 'backend_unavailable' };
      }
    },
  };
}

export function createProductionMedicalApiRateLimitAdapter(
  env: Record<string, string | undefined> = process.env,
): MedicalApiRateLimiter | null {
  const backend = resolveRateLimitBackend(env);

  if (backend === 'postgres' || backend === 'neon') {
    const databaseUrl = env.MEDICAL_DATABASE_URL?.trim();
    if (!databaseUrl) {
      return null;
    }

    return createLazyPostgresMedicalApiRateLimitAdapter(databaseUrl);
  }

  if (isMemoryRateLimitBackendForbiddenInProduction(env)) {
    return null;
  }

  if (isMemoryBackend(backend)) {
    return createProcessLocalMedicalApiRateLimitAdapter();
  }

  return null;
}
