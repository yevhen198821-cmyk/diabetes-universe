import { expect, type Page } from '@playwright/test';

export const APPLICATION_PLATFORM_READY_SELECTOR =
  '[data-platform-status="ready"]';

export async function waitForApplicationReady(page: Page): Promise<void> {
  await expect(page.locator(APPLICATION_PLATFORM_READY_SELECTOR)).toHaveCount(
    1,
  );
}
