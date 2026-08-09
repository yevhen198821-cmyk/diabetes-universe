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
    reason: validation.reason,
    quarantinedAt,
    raw,
    ...(validation.sourceRecordId === undefined
      ? {}
      : { sourceRecordId: validation.sourceRecordId }),
    ...(validation.storageSchemaVersion === undefined
      ? {}
      : { storageSchemaVersion: validation.storageSchemaVersion }),
  };
}
