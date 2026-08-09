import type { QuarantineRecord } from '@diabetes-universe/types';

export interface QuarantineRegistrySnapshot {
  readonly records: readonly QuarantineRecord[];
}

export class QuarantineRegistry {
  #records: QuarantineRecord[] = [];

  replace(records: readonly QuarantineRecord[]): void {
    this.#records = records.map((record) => ({
      ...record,
      preservedLegacy: { ...record.preservedLegacy },
      raw: { ...record.raw },
    }));
  }

  getSnapshot(): QuarantineRegistrySnapshot {
    return {
      records: this.#records.map((record) => ({
        ...record,
        preservedLegacy: { ...record.preservedLegacy },
        raw: { ...record.raw },
      })),
    };
  }

  get count(): number {
    return this.#records.length;
  }
}

export function createQuarantineRegistry(): QuarantineRegistry {
  return new QuarantineRegistry();
}
