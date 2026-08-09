import type { MigrationRecord } from '@diabetes-universe/types';

export interface MigrationSidecarSnapshot {
  readonly records: ReadonlyMap<string, MigrationRecord>;
}

export class MigrationSidecarStore {
  #records = new Map<string, MigrationRecord>();

  replace(records: ReadonlyMap<string, MigrationRecord>): void {
    this.#records = new Map(records);
  }

  get(eventId: string): MigrationRecord | undefined {
    return this.#records.get(eventId);
  }

  getSnapshot(): MigrationSidecarSnapshot {
    return {
      records: new Map(this.#records),
    };
  }

  get count(): number {
    return this.#records.size;
  }
}

export function createMigrationSidecarStore(): MigrationSidecarStore {
  return new MigrationSidecarStore();
}
