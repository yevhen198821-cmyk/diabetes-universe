import { createTestPlatformRuntime } from '../../../platform/react/testing/create-test-platform-runtime';
import type { CreateTestPlatformRuntimeOptions } from '../../../platform/react/testing/create-test-platform-runtime';
import type { GlucoseDisplayUnit } from '@diabetes-universe/medical-domain';
import {
  createTimelinePresentationDependencies,
  type TimelinePresentationDependencies,
} from '../index';

export type CreateTestTimelinePresentationDependenciesOptions =
  CreateTestPlatformRuntimeOptions & {
    readonly glucoseDisplayUnit?: GlucoseDisplayUnit | null;
  };

/**
 * Creates timeline presentation dependencies for unit and integration tests.
 */
export async function createTestTimelinePresentationDependencies(
  options: CreateTestTimelinePresentationDependenciesOptions = {},
): Promise<TimelinePresentationDependencies> {
  const { glucoseDisplayUnit = null, ...runtimeOptions } = options;
  const runtime = await createTestPlatformRuntime(runtimeOptions);

  return createTimelinePresentationDependencies({
    formatter: runtime.formatter,
    glucoseDisplayUnit,
    localization: runtime.localization,
  });
}
