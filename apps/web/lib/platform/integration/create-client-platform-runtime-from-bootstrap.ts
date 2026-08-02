import type { PlatformRuntime } from '@diabetes-universe/platform';

import { createClientPresentationBootstrapResult } from '../presentation/create-client-presentation-context';

import type { ApplicationPlatformBootstrap } from './application-platform-bootstrap';
import {
  createClientPlatformRuntimeFromContext,
  createClientPlatformRuntimeFromSnapshot,
} from './create-client-platform-runtime';

export type CreateClientPlatformRuntimeFromBootstrapResult =
  | {
      readonly status: 'ready';
      readonly runtime: PlatformRuntime;
    }
  | {
      readonly status: 'time-zone-unavailable';
    };

/**
 * Creates a client-realm runtime from a serializable application bootstrap payload.
 *
 * Browser presentation resolution runs only in the client realm for the
 * `time-zone-required` branch.
 */
export async function createClientPlatformRuntimeFromBootstrap(
  bootstrap: ApplicationPlatformBootstrap,
): Promise<CreateClientPlatformRuntimeFromBootstrapResult> {
  if (bootstrap.status === 'ready') {
    const runtime = await createClientPlatformRuntimeFromSnapshot(
      bootstrap.snapshot,
    );

    return { status: 'ready', runtime };
  }

  const clientBootstrap = createClientPresentationBootstrapResult({
    serverBootstrap: {
      status: 'time-zone-required',
      seed: bootstrap.seed,
    },
  });

  if (clientBootstrap.status === 'time-zone-unavailable') {
    return { status: 'time-zone-unavailable' };
  }

  const runtime = await createClientPlatformRuntimeFromContext(
    clientBootstrap.context,
  );

  return { status: 'ready', runtime };
}
