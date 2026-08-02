import type { PresentationSnapshot } from './presentation-snapshot';

/**
 * Future persistence boundary for presentation snapshots.
 *
 * CR-03A defines the contract only. Cookie, storage, and network adapters are
 * deferred to a later stage.
 */
export interface PresentationPersistence {
  read(): Promise<PresentationSnapshot | null>;
  write(snapshot: PresentationSnapshot): Promise<void>;
}
