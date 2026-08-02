import { createWebPlatformRuntime } from '@diabetes-universe/platform-web';
import type { PlatformRuntime } from '@diabetes-universe/platform';

import { createWebPlatformConfig } from '../../create-web-platform-config';
import type { RequestPresentationContext } from '../../request-presentation-context';

export type CreateTestPlatformRuntimeOptions = Readonly<{
  readonly request?: RequestPresentationContext;
  readonly timeZone?: string;
}>;

const defaultRequest: RequestPresentationContext = {
  acceptLanguage: 'en-GB',
  cookieTimeZone: 'Europe/London',
};

/**
 * Creates a ready `PlatformRuntime` for React integration tests.
 *
 * Not part of the production public API.
 */
export async function createTestPlatformRuntime(
  options: CreateTestPlatformRuntimeOptions = {},
): Promise<PlatformRuntime> {
  const request = options.request ?? defaultRequest;
  const timeZone =
    options.timeZone ?? request.cookieTimeZone ?? 'Europe/London';
  const config = createWebPlatformConfig(request, timeZone);

  return createWebPlatformRuntime(config);
}
