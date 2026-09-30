import { createHash } from 'node:crypto';

import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import { toServerSemanticEvent } from '@diabetes-universe/medical-domain';

export function createRequestFingerprint(event: SemanticTimelineEvent): string {
  const normalized = toServerSemanticEvent(event);
  // A replacer *array* is a whitelist at every nesting level, silently omitting
  // food snapshots, provenance and other nested semantic values. Sort objects
  // recursively instead; preserve array order and normal JSON undefined rules.
  const canonical = JSON.stringify(normalized, (_key, value: unknown) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.fromEntries(
        Object.entries(value).sort(([left], [right]) =>
          left < right ? -1 : left > right ? 1 : 0,
        ),
      );
    }
    return value;
  });
  // Legacy hashes are intentionally not accepted: they cannot authenticate
  // nested payloads. Existing keys fail closed rather than replay wrong data.
  return `v2:${createHash('sha256').update(canonical, 'utf8').digest('hex')}`;
}
