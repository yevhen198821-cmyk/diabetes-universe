export interface MedicalApiRateLimitInput {
  readonly accountId: string;
  readonly operation: 'read' | 'mutation';
  readonly path: string;
}

export interface MedicalApiRateLimitDecision {
  readonly allowed: boolean;
  readonly retryAfterSeconds?: number;
}

export interface MedicalApiRateLimiter {
  check(input: MedicalApiRateLimitInput): MedicalApiRateLimitDecision;
}

export type MedicalApiRateLimitMode = 'disabled' | 'test' | 'distributed';

const DEFAULT_RETRY_AFTER_SECONDS = 60;

class PassthroughMedicalApiRateLimiter implements MedicalApiRateLimiter {
  check(): MedicalApiRateLimitDecision {
    return { allowed: true };
  }
}

class FailClosedMedicalApiRateLimiter implements MedicalApiRateLimiter {
  check(): MedicalApiRateLimitDecision {
    return { allowed: false, retryAfterSeconds: DEFAULT_RETRY_AFTER_SECONDS };
  }
}

class TestMedicalApiRateLimiter implements MedicalApiRateLimiter {
  private readonly blockedAccounts = new Set<string>();
  private readonly blockedOperations = new Map<
    string,
    Set<'read' | 'mutation'>
  >();

  blockAccount(accountId: string, operation?: 'read' | 'mutation'): void {
    this.blockedAccounts.add(accountId);
    if (operation) {
      const operations =
        this.blockedOperations.get(accountId) ?? new Set<'read' | 'mutation'>();
      operations.add(operation);
      this.blockedOperations.set(accountId, operations);
    }
  }

  reset(): void {
    this.blockedAccounts.clear();
    this.blockedOperations.clear();
  }

  check(input: MedicalApiRateLimitInput): MedicalApiRateLimitDecision {
    if (!this.blockedAccounts.has(input.accountId)) {
      return { allowed: true };
    }

    const operations = this.blockedOperations.get(input.accountId);
    if (operations && operations.size > 0 && !operations.has(input.operation)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      retryAfterSeconds: DEFAULT_RETRY_AFTER_SECONDS,
    };
  }
}

let configuredRateLimiter: MedicalApiRateLimiter | null = null;
let configuredMode: MedicalApiRateLimitMode | null = null;
let testOverrideLimiter: MedicalApiRateLimiter | null = null;
const testRateLimiter = new TestMedicalApiRateLimiter();

export function resolveMedicalApiRateLimitMode(
  env: Record<string, string | undefined> = process.env,
): MedicalApiRateLimitMode {
  const configured = env.MEDICAL_RATE_LIMIT_MODE?.trim().toLowerCase();

  if (configured === 'test') {
    if (env.NODE_ENV !== 'test') {
      return 'distributed';
    }
    return 'test';
  }

  if (configured === 'distributed') {
    return 'distributed';
  }

  return 'disabled';
}

export function getMedicalApiRateLimiter(
  env: Record<string, string | undefined> = process.env,
): MedicalApiRateLimiter {
  if (testOverrideLimiter) {
    return testOverrideLimiter;
  }

  const mode = resolveMedicalApiRateLimitMode(env);

  if (configuredRateLimiter && configuredMode === mode) {
    return configuredRateLimiter;
  }

  configuredMode = mode;

  if (mode === 'test') {
    configuredRateLimiter = testRateLimiter;
    return configuredRateLimiter;
  }

  if (mode === 'distributed') {
    configuredRateLimiter = new FailClosedMedicalApiRateLimiter();
    return configuredRateLimiter;
  }

  configuredRateLimiter = new PassthroughMedicalApiRateLimiter();
  return configuredRateLimiter;
}

export function resetMedicalApiRateLimiterForTests(): void {
  configuredRateLimiter = null;
  configuredMode = null;
  testRateLimiter.reset();
}

export function setMedicalApiRateLimiterForTests(
  limiter: MedicalApiRateLimiter | null,
): void {
  testOverrideLimiter = limiter;
}

export function blockMedicalApiRateLimitForTests(
  accountId: string,
  operation?: 'read' | 'mutation',
): void {
  process.env.MEDICAL_RATE_LIMIT_MODE = 'test';
  resetMedicalApiRateLimiterForTests();
  testRateLimiter.blockAccount(accountId, operation);
}

export function isMedicalApiRateLimitProductionReady(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return resolveMedicalApiRateLimitMode(env) === 'distributed'
    ? Boolean(env.MEDICAL_RATE_LIMIT_BACKEND?.trim())
    : false;
}
