import { createPresentationSnapshot } from '../presentation/create-presentation-snapshot';
import type { PresentationSnapshot } from '../presentation/presentation-snapshot';
import type { RequestPlatformBootstrapResult } from '../request-platform-bootstrap-result';
import type { ServerPresentationSeed } from '../server-presentation-seed';

/**
 * Serializable application bootstrap payload for the server/client boundary.
 *
 * `PlatformRuntime` is intentionally excluded. The client realm creates its own
 * runtime from the approved snapshot or from client presentation bootstrap.
 */
export type ApplicationPlatformBootstrap =
  | {
      readonly status: 'ready';
      readonly snapshot: PresentationSnapshot;
    }
  | {
      readonly status: 'time-zone-required';
      readonly seed: ServerPresentationSeed;
    };

/**
 * Maps a server bootstrap result to the serializable application boundary DTO.
 */
export function createApplicationPlatformBootstrap(
  result: RequestPlatformBootstrapResult,
): ApplicationPlatformBootstrap {
  if (result.status === 'ready') {
    return {
      status: 'ready',
      snapshot: createPresentationSnapshot(
        result.runtime.localization.localeContext,
      ),
    };
  }

  return {
    status: 'time-zone-required',
    seed: result.seed,
  };
}
