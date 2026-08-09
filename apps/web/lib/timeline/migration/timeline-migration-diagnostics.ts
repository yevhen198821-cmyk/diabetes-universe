import type { TimelineDiagnosticsSnapshot } from '@diabetes-universe/types';

import type { MigrationSidecarSnapshot } from './migration-sidecar-store';
import type { QuarantineRegistrySnapshot } from './quarantine-registry';

export function createTimelineDiagnosticsSnapshot(input: {
  readonly activeEventCount: number;
  readonly migrationSidecar: MigrationSidecarSnapshot;
  readonly quarantineRegistry: QuarantineRegistrySnapshot;
  readonly unsupportedSchemaCount: number;
}): TimelineDiagnosticsSnapshot {
  return {
    activeEventCount: input.activeEventCount,
    migrationRecordCount: input.migrationSidecar.records.size,
    quarantinedCount: input.quarantineRegistry.records.length,
    quarantinedRecords: input.quarantineRegistry.records,
    unsupportedSchemaCount: input.unsupportedSchemaCount,
  };
}
