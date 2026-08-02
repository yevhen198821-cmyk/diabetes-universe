import type { PlatformRuntime } from '@diabetes-universe/platform';

import type { RequestPlatformBootstrapResult } from './request-platform-bootstrap-result';

declare const runtime: PlatformRuntime;

const readyResult: RequestPlatformBootstrapResult = {
  status: 'ready',
  runtime,
};

void readyResult;

const timeZoneRequiredResult: RequestPlatformBootstrapResult = {
  status: 'time-zone-required',
};

void timeZoneRequiredResult;

// @ts-expect-error ready result requires runtime
const invalidReadyResult: RequestPlatformBootstrapResult = {
  status: 'ready',
};

void invalidReadyResult;

const invalidTimeZoneRequiredResult: RequestPlatformBootstrapResult = {
  status: 'time-zone-required',
  // @ts-expect-error time-zone-required result must not include runtime
  runtime,
};

void invalidTimeZoneRequiredResult;
