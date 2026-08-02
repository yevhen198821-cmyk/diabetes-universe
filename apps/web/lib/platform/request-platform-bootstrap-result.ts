import type { PlatformRuntime } from '@diabetes-universe/platform';

import type { ServerPresentationSeed } from './server-presentation-seed';

/**
 * Discriminated bootstrap result for per-request Platform Runtime creation.
 *
 * Absence of a valid explicit user time zone is a normal first-visit state, not
 * an exceptional error.
 */
export type RequestPlatformBootstrapResult =
  | {
      readonly status: 'ready';
      readonly runtime: PlatformRuntime;
    }
  | {
      readonly status: 'time-zone-required';
      readonly seed: ServerPresentationSeed;
    };
