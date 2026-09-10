import { createHash } from 'node:crypto';

import { classifyMedicalApiPath } from './medical-api-rate-limit-policy';

export function deriveMedicalApiRateLimitBucketKey(input: {
  readonly accountId: string;
  readonly operation: 'mutation' | 'read';
  readonly path: string;
}): string {
  const rateClass = classifyMedicalApiPath(input.path);
  const material = `${input.accountId}\n${rateClass}\n${input.operation}`;

  return createHash('sha256').update(material).digest('hex');
}
