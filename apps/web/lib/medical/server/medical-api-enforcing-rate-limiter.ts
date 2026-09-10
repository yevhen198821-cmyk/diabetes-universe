import { deriveMedicalApiRateLimitBucketKey } from './medical-api-rate-limit-key';
import type {
  MedicalApiRateLimitDecision,
  MedicalApiRateLimitInput,
  MedicalApiRateLimiter,
} from './medical-api-rate-limit';
import { resolveMedicalApiRateLimitPolicy } from './medical-api-rate-limit-policy';

export interface MedicalApiRateLimitCounterStore {
  increment(
    bucketKey: string,
    windowStartEpochSeconds: number,
  ): Promise<number>;
}

interface MemoryRateLimitBucket {
  count: number;
  windowStartEpochSeconds: number;
}

export class MemoryMedicalApiRateLimitCounterStore implements MedicalApiRateLimitCounterStore {
  private readonly buckets = new Map<string, MemoryRateLimitBucket>();

  increment(
    bucketKey: string,
    windowStartEpochSeconds: number,
  ): Promise<number> {
    const existing = this.buckets.get(bucketKey);

    if (
      !existing ||
      existing.windowStartEpochSeconds !== windowStartEpochSeconds
    ) {
      this.buckets.set(bucketKey, {
        count: 1,
        windowStartEpochSeconds,
      });
      return Promise.resolve(1);
    }

    existing.count += 1;
    return Promise.resolve(existing.count);
  }

  reset(): void {
    this.buckets.clear();
  }
}

export function createEnforcingMedicalApiRateLimiter(
  store: MedicalApiRateLimitCounterStore,
  options?: {
    readonly now?: () => number;
    readonly onBackendFailure?: 'fail-closed';
  },
): MedicalApiRateLimiter {
  const now = options?.now ?? Date.now;

  return {
    async check(
      input: MedicalApiRateLimitInput,
    ): Promise<MedicalApiRateLimitDecision> {
      const policy = resolveMedicalApiRateLimitPolicy(input);
      const nowMs = now();
      const windowStartEpochSeconds =
        Math.floor(nowMs / 1000 / policy.windowSeconds) * policy.windowSeconds;
      const bucketKey = deriveMedicalApiRateLimitBucketKey(input);

      let count: number;
      try {
        count = await store.increment(bucketKey, windowStartEpochSeconds);
      } catch {
        return { outcome: 'backend_unavailable' };
      }

      if (count <= policy.limit) {
        return { outcome: 'allowed' };
      }

      const retryAfterSeconds = Math.max(
        1,
        windowStartEpochSeconds +
          policy.windowSeconds -
          Math.floor(nowMs / 1000),
      );

      return {
        outcome: 'rate_limited',
        retryAfterSeconds,
      };
    },
  };
}

export function createEnforcingMemoryMedicalApiRateLimitAdapter(): MedicalApiRateLimiter {
  return createEnforcingMedicalApiRateLimiter(
    new MemoryMedicalApiRateLimitCounterStore(),
  );
}
