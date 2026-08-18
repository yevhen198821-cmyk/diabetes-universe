import { createHash } from 'node:crypto';

import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import { toServerSemanticEvent } from '@diabetes-universe/medical-domain';

export function createRequestFingerprint(event: SemanticTimelineEvent): string {
  const normalized = toServerSemanticEvent(event);
  const canonical = JSON.stringify(normalized, Object.keys(normalized).sort());
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}
