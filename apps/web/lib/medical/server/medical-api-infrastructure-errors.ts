import { MedicalServiceUnavailableError } from '@diabetes-universe/medical-domain';

const TRANSIENT_ERROR_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
  '57P01',
  '57P02',
  '57P03',
  '08000',
  '08003',
  '08006',
  '53300',
]);

const TRANSIENT_ERROR_PATTERNS = [
  'connection terminated',
  'connection refused',
  'connect timeout',
  'timeout exceeded',
  'too many connections',
  'server closed the connection',
  'cannot connect',
  'service unavailable',
];

export function isTransientInfrastructureError(error: unknown): boolean {
  if (error instanceof MedicalServiceUnavailableError) {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const code =
    'code' in error && typeof error.code === 'string' ? error.code : null;
  if (code && TRANSIENT_ERROR_CODES.has(code)) {
    return true;
  }

  const message = error.message.toLowerCase();
  return TRANSIENT_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}
