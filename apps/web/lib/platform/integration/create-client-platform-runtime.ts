import { createWebPlatformRuntime } from '@diabetes-universe/platform-web';
import type { PlatformRuntime } from '@diabetes-universe/platform';

import type { PresentationContext } from '../presentation/presentation-context';
import type { PresentationSnapshot } from '../presentation/presentation-snapshot';
import { restorePresentationContextFromSnapshot } from '../presentation/restore-presentation-context';

import { createWebPlatformConfigFromPresentationContext } from './create-web-platform-config-from-presentation-context';

/**
 * Creates a client-realm `PlatformRuntime` from a trusted presentation context.
 *
 * Uses the approved Web Composition Root entry point. Does not invoke the
 * server-only request bootstrap orchestrator.
 */
export async function createClientPlatformRuntimeFromContext(
  context: PresentationContext,
): Promise<PlatformRuntime> {
  const config = createWebPlatformConfigFromPresentationContext(context);

  return createWebPlatformRuntime(config);
}

/**
 * Creates a client-realm `PlatformRuntime` from a validated presentation snapshot.
 */
export async function createClientPlatformRuntimeFromSnapshot(
  snapshot: PresentationSnapshot,
): Promise<PlatformRuntime> {
  const context = restorePresentationContextFromSnapshot(snapshot);

  return createClientPlatformRuntimeFromContext(context);
}
