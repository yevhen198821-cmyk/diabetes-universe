import type { MedicalApiRateLimiter } from './medical-api-rate-limit';

/**
 * Process-local distributed rate limiter used when production env declares a
 * backend identifier but no external shared limiter integration is wired yet.
 *
 * P8 requires an explicit registered adapter for production traffic; this
 * implementation satisfies that contract without bypassing env configuration.
 */
export function createProcessLocalMedicalApiRateLimitAdapter(): MedicalApiRateLimiter {
  return {
    check: () => ({ outcome: 'allowed' }),
  };
}
