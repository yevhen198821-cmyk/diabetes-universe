import {
  createTestPlatformRuntime,
  type CreateTestPlatformRuntimeOptions,
} from '../../../lib/platform/react/testing/create-test-platform-runtime';
import type { TimelineInsulinEditCopy } from '../timeline-event-detail-model';
import { resolveTimelineInsulinEditCopy } from '../timeline-insulin-edit-copy';

/**
 * Resolves real localized insulin edit copy for unit and integration tests.
 *
 * Not part of the production public API.
 */
export async function createTestTimelineInsulinEditCopy(
  options: CreateTestPlatformRuntimeOptions = {},
): Promise<TimelineInsulinEditCopy> {
  const runtime = await createTestPlatformRuntime(options);

  return resolveTimelineInsulinEditCopy(runtime.localization);
}
