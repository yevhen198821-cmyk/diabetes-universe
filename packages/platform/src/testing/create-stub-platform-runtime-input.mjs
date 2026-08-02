import { createStubLocalizationPlatform } from './stub-localization-platform.mjs';
import { createStubPlatformFormatter } from './stub-platform-formatter.mjs';

/**
 * Builds dependency-injected input for Platform Runtime Foundation unit tests.
 *
 * Not part of the public package API.
 */
export function createStubPlatformRuntimeInput(overrides = {}) {
  return {
    localization: createStubLocalizationPlatform(overrides.localization),
    formatter: createStubPlatformFormatter(overrides.formatter),
    ...overrides,
  };
}
