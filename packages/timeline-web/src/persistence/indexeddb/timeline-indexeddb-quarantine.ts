import type { TimelineIndexedDbRecordValidationResult } from './timeline-indexeddb-validation';
import type { IndexedDbTimelineQuarantineRecord } from './timeline-indexeddb-schema';

export function createIndexedDbTimelineQuarantineRecord(
  raw: unknown,
  validation: Extract<
    TimelineIndexedDbRecordValidationResult,
    { readonly status: 'quarantine' }
  >,
  sourceKey: IDBValidKey,
  quarantinedAt: string,
): IndexedDbTimelineQuarantineRecord {
  return {
    quarantineId: `${String(sourceKey)}:${quarantinedAt}:${validation.reason}`,
    sourceRecordId: validation.sourceRecordId,
    reason: validation.reason,
    quarantinedAt,
    raw,
    storageSchemaVersion: validation.storageSchemaVersion,
  };
}
