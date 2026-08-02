import { createWebPlatformRuntime } from '@diabetes-universe/platform-web';

import { createWebPlatformConfig } from './create-web-platform-config';
import { ensureServerOnly } from './ensure-server-only';
import type { RequestPlatformBootstrapResult } from './request-platform-bootstrap-result';
import type { RequestPresentationContext } from './request-presentation-context';
import { resolveRequestTimeZone } from './resolve-request-time-zone';

const MODULE_NAME = 'createRequestPlatformRuntime';

async function readNextRequestPresentationContext(): Promise<RequestPresentationContext> {
  const { headers } = await import('next/headers');
  const headerStore = await headers();

  return {
    acceptLanguage: headerStore.get('accept-language') ?? undefined,
  };
}

/**
 * Canonical server entry point for per-request Platform Runtime creation.
 *
 * Returns `time-zone-required` when no valid explicit IANA time zone is available
 * (normal first-visit state). Infrastructure and configuration errors from
 * `createWebPlatformRuntime()` continue to reject the returned promise.
 */
export async function createRequestPlatformRuntime(
  requestContext?: RequestPresentationContext,
): Promise<RequestPlatformBootstrapResult> {
  ensureServerOnly(MODULE_NAME);

  const context =
    requestContext ?? (await readNextRequestPresentationContext());
  const explicitTimeZone = resolveRequestTimeZone(context);

  if (explicitTimeZone === null) {
    return { status: 'time-zone-required' };
  }

  const config = createWebPlatformConfig(context, explicitTimeZone);
  const runtime = await createWebPlatformRuntime(config);

  return {
    status: 'ready',
    runtime,
  };
}
