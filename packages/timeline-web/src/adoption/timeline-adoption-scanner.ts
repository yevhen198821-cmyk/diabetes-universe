import type { SemanticTimelineEvent } from '@diabetes-universe/types';
import {
  IN_MEMORY_TIMELINE_REPOSITORY_MAX_QUERY_LIMIT,
  type TimelineRepository,
} from '@diabetes-universe/timeline';

import type { IndexedDbTimelineAdoptionAcknowledgement } from '../persistence/indexeddb/timeline-indexeddb-schema';

export type TimelineAdoptionScanClassification =
  | 'eligible'
  | 'already_adopted'
  | 'quarantined'
  | 'excluded_demo'
  | 'unsupported';

export interface TimelineAdoptionScanItem {
  readonly localEventId: string;
  readonly classification: TimelineAdoptionScanClassification;
  readonly event?: SemanticTimelineEvent;
  readonly reason?: string;
}

export interface TimelineAdoptionScannerInput {
  readonly repository: TimelineRepository;
  readonly isAcknowledged: (localEventId: string) => boolean | Promise<boolean>;
  readonly limit?: number;
}

export async function scanTimelineForAdoption(
  input: TimelineAdoptionScannerInput,
): Promise<readonly TimelineAdoptionScanItem[]> {
  const pageLimit =
    input.limit ?? IN_MEMORY_TIMELINE_REPOSITORY_MAX_QUERY_LIMIT;
  const results: TimelineAdoptionScanItem[] = [];
  let cursor: string | undefined;

  while (true) {
    const queryResult = await input.repository.queryEvents({
      limit: pageLimit,
      order: 'occurredAt-asc',
      ...(cursor ? { cursor } : {}),
    });

    for (const event of queryResult.events) {
      const localEventId = event.id;

      if (event.source === 'demo') {
        results.push({
          localEventId,
          classification: 'excluded_demo',
        });
        continue;
      }

      if (await input.isAcknowledged(localEventId)) {
        results.push({
          localEventId,
          classification: 'already_adopted',
        });
        continue;
      }

      if (event.schemaVersion !== 1) {
        results.push({
          localEventId,
          classification: 'unsupported',
          reason: 'unsupported_schema_version',
        });
        continue;
      }

      if (
        event.source !== 'manual' &&
        event.source !== 'device' &&
        event.source !== 'import'
      ) {
        results.push({
          localEventId,
          classification: 'unsupported',
          reason: 'unsupported_source',
        });
        continue;
      }

      results.push({
        localEventId,
        classification: 'eligible',
        event,
      });
    }

    if (!queryResult.nextCursor) {
      break;
    }

    cursor = queryResult.nextCursor;
  }

  return results;
}

export function createSourceNamespace(): string {
  return `ns_${crypto.randomUUID().replace(/-/g, '')}`;
}

export function toAdoptionAcknowledgement(
  localEventId: string,
  canonicalResourceId: string,
  canonicalRevision: string,
  adoptionSessionId: string,
): IndexedDbTimelineAdoptionAcknowledgement {
  return {
    localEventId,
    canonicalResourceId,
    canonicalRevision,
    adoptedAt: new Date().toISOString(),
    adoptionSessionId,
    storageSchemaVersion: 1,
  };
}
