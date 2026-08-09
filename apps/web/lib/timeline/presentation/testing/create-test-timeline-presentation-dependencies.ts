import { createTestPlatformRuntime } from '../../../platform/react/testing/create-test-platform-runtime';
import type { CreateTestPlatformRuntimeOptions } from '../../../platform/react/testing/create-test-platform-runtime';
import {
  createTimelinePresentationDependencies,
  type TimelinePresentationDependencies,
} from '../index';

export type CreateTestTimelinePresentationDependenciesOptions =
  CreateTestPlatformRuntimeOptions;

/**
 * Creates timeline presentation dependencies for unit and integration tests.
 */
export async function createTestTimelinePresentationDependencies(
  options: CreateTestTimelinePresentationDependenciesOptions = {},
): Promise<TimelinePresentationDependencies> {
  const runtime = await createTestPlatformRuntime(options);

  return createTimelinePresentationDependencies({
    formatter: runtime.formatter,
    localization: runtime.localization,
  });
}
