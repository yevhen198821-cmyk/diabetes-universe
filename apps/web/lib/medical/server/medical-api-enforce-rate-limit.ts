import {
  getMedicalApiRateLimiter,
  type MedicalApiRateLimitInput,
} from './medical-api-rate-limit';
import { medicalApiErrorResponse } from './medical-api-error';

function operationFromMethod(method: string): 'read' | 'mutation' {
  return method === 'GET' || method === 'HEAD' ? 'read' : 'mutation';
}

export async function enforceMedicalApiRateLimit(
  scopeAccountId: string,
  request: Request,
  correlationId: string,
): Promise<Response | null> {
  const limiter = getMedicalApiRateLimiter();
  const decision = await limiter.check({
    accountId: scopeAccountId,
    operation: operationFromMethod(request.method),
    path: new URL(request.url).pathname,
  } satisfies MedicalApiRateLimitInput);

  if (decision.outcome === 'allowed') {
    return null;
  }

  if (decision.outcome === 'backend_unavailable') {
    return medicalApiErrorResponse(
      503,
      'SERVICE_UNAVAILABLE',
      'The medical API is temporarily unavailable.',
      correlationId,
    );
  }

  const retryAfterSeconds = decision.retryAfterSeconds ?? 60;
  return medicalApiErrorResponse(
    429,
    'RATE_LIMITED',
    'Too many requests. Retry later.',
    correlationId,
    null,
    {
      'Retry-After': String(retryAfterSeconds),
    },
  );
}
