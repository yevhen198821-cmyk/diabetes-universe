import type {
  MigrationRecord,
  QuarantineRecord,
  TimelineEvent,
} from '@diabetes-universe/types';

export interface PreviousMigrationEvidenceSnapshot {
  readonly migrationRecords: ReadonlyMap<string, MigrationRecord>;
  readonly quarantinedRecords: readonly QuarantineRecord[];
}

function resolveLegacyEventId(raw: TimelineEvent): string | undefined {
  const eventId = raw.id?.trim();

  return eventId.length > 0 ? eventId : undefined;
}

function indexQuarantineRecordsByLegacyId(
  records: readonly QuarantineRecord[],
): ReadonlyMap<string, QuarantineRecord> {
  const index = new Map<string, QuarantineRecord>();

  for (const record of records) {
    const legacyId = resolveLegacyEventId(record.raw);

    if (legacyId && !index.has(legacyId)) {
      index.set(legacyId, record);
    }
  }

  return index;
}

export function reuseMigrationRecord(
  previous: PreviousMigrationEvidenceSnapshot | undefined,
  eventId: string,
  liftedRecord: MigrationRecord,
): MigrationRecord {
  const existingRecord = previous?.migrationRecords.get(eventId);

  return existingRecord ?? liftedRecord;
}

export function reuseQuarantineRecord(
  previous: PreviousMigrationEvidenceSnapshot | undefined,
  raw: TimelineEvent,
  liftedRecord: QuarantineRecord,
  previousQuarantineIndex?: ReadonlyMap<string, QuarantineRecord>,
): QuarantineRecord {
  const legacyId = resolveLegacyEventId(raw);

  if (!legacyId) {
    return liftedRecord;
  }

  const index =
    previousQuarantineIndex ??
    (previous
      ? indexQuarantineRecordsByLegacyId(previous.quarantinedRecords)
      : undefined);
  const existingRecord = index?.get(legacyId);

  return existingRecord ?? liftedRecord;
}

export function createQuarantineIndex(
  records: readonly QuarantineRecord[],
): ReadonlyMap<string, QuarantineRecord> {
  return indexQuarantineRecordsByLegacyId(records);
}
