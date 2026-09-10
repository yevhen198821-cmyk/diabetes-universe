export type MedicalApiRateLimitClass =
  'adoption' | 'medical-events' | 'other' | 'settings';

export interface MedicalApiRateLimitPolicy {
  readonly limit: number;
  readonly rateClass: MedicalApiRateLimitClass;
  readonly retryAfterSeconds: number;
  readonly windowSeconds: number;
}

const WINDOW_SECONDS = 60;

const LIMITS = {
  adoption: { mutation: 20, read: 60 },
  'medical-events': { mutation: 60, read: 180 },
  other: { mutation: 30, read: 90 },
  settings: { mutation: 30, read: 120 },
} as const;

export function classifyMedicalApiPath(path: string): MedicalApiRateLimitClass {
  if (
    path.includes('/diabetes-settings') ||
    path.includes('/glucose-target-profile')
  ) {
    return 'settings';
  }

  if (path.includes('/medical-events')) {
    return 'medical-events';
  }

  if (path.includes('/adoption-sessions')) {
    return 'adoption';
  }

  return 'other';
}

export function resolveMedicalApiRateLimitPolicy(input: {
  readonly operation: 'mutation' | 'read';
  readonly path: string;
}): MedicalApiRateLimitPolicy {
  const rateClass = classifyMedicalApiPath(input.path);
  const limit = LIMITS[rateClass][input.operation];

  return {
    limit,
    rateClass,
    retryAfterSeconds: WINDOW_SECONDS,
    windowSeconds: WINDOW_SECONDS,
  };
}
