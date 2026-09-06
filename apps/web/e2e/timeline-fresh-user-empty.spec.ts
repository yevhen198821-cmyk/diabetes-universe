import { expect, test } from './support/test';

import {
  saveGlucoseQuickAdd,
  selectGlucoseUnitIfRequired,
} from './support/glucose-quick-add-helpers';
import {
  waitForDashboardEmptyGlucoseHero,
  waitForTimelineOwnershipReady,
} from './support/timeline-indexeddb-helpers';
import { waitForApplicationReady } from './support/wait-for-application-ready';

test.describe('fresh-user Timeline without production demo seed', () => {
  test.use({
    extraHTTPHeaders: { 'Accept-Language': 'en-GB' },
    locale: 'en-GB',
  });

  test('dashboard first run has no fake last glucose or demo medical cards', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForApplicationReady(page);
    await waitForTimelineOwnershipReady(page);

    await waitForDashboardEmptyGlucoseHero(page);
    await expect(page.getByText('7.3', { exact: true })).toHaveCount(0);
    await expect(page.getByText('NovoRapid')).toHaveCount(0);
    await expect(page.getByText('Метформин')).toHaveCount(0);
    await expect(page.getByText('2 measurements')).toHaveCount(0);
    await expect(page.getByText('4 U')).toHaveCount(0);

    await page.getByRole('button', { name: 'Quick add: Glucose' }).click();
    await selectGlucoseUnitIfRequired(page);
    await page.getByLabel('Glucose level').fill('5.4');
    await saveGlucoseQuickAdd(page);

    await expect(
      page.getByRole('region', { name: 'Last glucose' }).getByText('5.4', {
        exact: true,
      }),
    ).toBeVisible();
  });

  test('timeline first run shows the localized empty state and still accepts Quick Add', async ({
    page,
  }) => {
    await page.goto('/timeline');
    await waitForApplicationReady(page);
    await waitForTimelineOwnershipReady(page);

    await expect(
      page.getByRole('heading', { name: 'No events yet' }),
    ).toBeVisible();
    await expect(page.getByText('NovoRapid')).toHaveCount(0);
    await expect(page.getByText('Метформин')).toHaveCount(0);
    await expect(page.getByText('История дня')).toHaveCount(0);

    await page.setViewportSize({ height: 844, width: 390 });
    await page.locator('#timeline-mobile-quick-add-fab').click();
    await page
      .getByRole('button', { name: 'Заметка. Добавить запись' })
      .click();
    await page.getByLabel('Текст заметки').fill('Fresh-user note');
    await page.getByRole('button', { name: 'Сохранить' }).click();

    await expect(page.getByText('Fresh-user note').first()).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'No events yet' }),
    ).toHaveCount(0);
  });
});
