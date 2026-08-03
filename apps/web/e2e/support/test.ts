import {
  test as base,
  expect,
  type Locator,
  type Page,
} from '@playwright/test';

import { CANONICAL_DEMO_LOCAL_DAY_TIME } from '../../testing/demo-reference-time';

export const test = base.extend({
  page: async ({ page }, runWithPage) => {
    await page.clock.install({ time: CANONICAL_DEMO_LOCAL_DAY_TIME });
    await runWithPage(page);
  },
});

export { expect, type Locator, type Page };
