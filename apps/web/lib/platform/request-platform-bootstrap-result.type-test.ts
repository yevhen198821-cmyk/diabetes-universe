import type { PlatformRuntime } from '@diabetes-universe/platform';

import { asLocaleCode } from './platform-type-helpers';
import type { RequestPlatformBootstrapResult } from './request-platform-bootstrap-result';
import type { ServerPresentationSeed } from './server-presentation-seed';

declare const runtime: PlatformRuntime;

const seed: ServerPresentationSeed = Object.freeze({
  language: 'en' as ServerPresentationSeed['language'],
  locale: asLocaleCode('en-GB'),
  hourCycle: 'h23',
});

const readyResult: RequestPlatformBootstrapResult = {
  status: 'ready',
  runtime,
};

void readyResult;

const timeZoneRequiredResult: RequestPlatformBootstrapResult = {
  status: 'time-zone-required',
  seed,
};

void timeZoneRequiredResult;

// @ts-expect-error ready result requires runtime
const invalidReadyResult: RequestPlatformBootstrapResult = {
  status: 'ready',
};

void invalidReadyResult;

// @ts-expect-error time-zone-required result requires seed
const invalidTimeZoneRequiredResult: RequestPlatformBootstrapResult = {
  status: 'time-zone-required',
};

void invalidTimeZoneRequiredResult;

const invalidTimeZoneRequiredWithRuntime: RequestPlatformBootstrapResult = {
  status: 'time-zone-required',
  seed,
  // @ts-expect-error time-zone-required result must not include runtime
  runtime,
};

void invalidTimeZoneRequiredWithRuntime;
