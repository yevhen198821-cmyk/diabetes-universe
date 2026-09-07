import { expect, test } from './support/test';

import { installOneShotTimelineEventsWriteDelay } from './support/install-one-shot-timeline-events-write-delay';
import {
  clearTimelineEventsInIndexedDb,
  prepareCanonicalDemoTimelineFixture,
  readActiveTimelineStoredEventById,
  readActiveTimelineStoredEvents,
  waitForEmptyTimelineInIndexedDb,
  waitForTimelineBootstrapComplete,
  waitForTimelineOwnershipReady,
} from './support/timeline-indexeddb-helpers';
import { waitForApplicationReady } from './support/wait-for-application-ready';

async function prepareEmptyTimeline(page: import('./support/test').Page) {
  await waitForApplicationReady(page);
  await waitForTimelineOwnershipReady(page);
  await waitForTimelineBootstrapComplete(page);
  await clearTimelineEventsInIndexedDb(page);
  await page.reload();
  await waitForApplicationReady(page);
  await waitForTimelineOwnershipReady(page);
  await waitForEmptyTimelineInIndexedDb(page);
}

async function openTimelineQuickAdd(page: import('./support/test').Page) {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.locator('#timeline-mobile-quick-add-fab').click();
  await expect(
    page.getByRole('dialog', { name: 'Добавить событие' }),
  ).toBeVisible();
}

test.describe('Remediation 0B Timeline save integrity', () => {
  test.describe.configure({ mode: 'serial' });

  test('medication Quick Add awaits IndexedDB and persists across reload', async ({
    page,
  }) => {
    await page.goto('/timeline');
    await prepareEmptyTimeline(page);
    await openTimelineQuickAdd(page);

    await page
      .getByRole('button', { name: 'Лекарство. Записать приём препарата' })
      .click();
    const dialog = page.getByRole('dialog', { name: 'Добавить лекарство' });
    await expect(dialog).toBeVisible();

    await page.getByRole('button', { name: /Препарат/ }).click();
    await page.getByRole('button', { name: 'Метформин' }).click();
    await page.getByRole('textbox', { name: 'Доза' }).fill('500');
    await dialog.getByRole('button', { name: 'Сохранить' }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText('Метформин').first()).toBeVisible();

    await expect
      .poll(async () => {
        const events = await readActiveTimelineStoredEvents(page);
        return events.filter(
          (event) =>
            event.kind === 'medication' && event.medicationName === 'Метформин',
        ).length;
      })
      .toBe(1);

    await page.reload();
    await waitForApplicationReady(page);
    await waitForTimelineOwnershipReady(page);

    await expect(page.getByText('Метформин').first()).toBeVisible();
    const reloaded = await readActiveTimelineStoredEvents(page);
    const medications = reloaded.filter(
      (event) =>
        event.kind === 'medication' && event.medicationName === 'Метформин',
    );
    expect(medications).toHaveLength(1);
    expect(medications[0]?.dose).toBe(500);
  });

  test('activity Quick Add awaits IndexedDB and persists across reload', async ({
    page,
  }) => {
    await page.goto('/timeline');
    await prepareEmptyTimeline(page);
    await openTimelineQuickAdd(page);

    await page
      .getByRole('button', { name: 'Активность. Записать тренировку' })
      .click();
    const dialog = page.getByRole('dialog', { name: 'Добавить активность' });
    await expect(dialog).toBeVisible();

    await page.getByRole('button', { name: /Вид активности/ }).click();
    await page.getByRole('button', { name: 'Ходьба' }).click();
    await page.getByLabel('Продолжительность, мин').fill('30');
    await dialog.getByRole('button', { name: 'Сохранить' }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText('Ходьба').first()).toBeVisible();

    await expect
      .poll(async () => {
        const events = await readActiveTimelineStoredEvents(page);
        return events.filter(
          (event) =>
            event.kind === 'activity' && event.activityType === 'Ходьба',
        ).length;
      })
      .toBe(1);

    await page.reload();
    await waitForApplicationReady(page);
    await waitForTimelineOwnershipReady(page);

    await expect(page.getByText('Ходьба').first()).toBeVisible();
    const reloaded = await readActiveTimelineStoredEvents(page);
    const activities = reloaded.filter(
      (event) => event.kind === 'activity' && event.activityType === 'Ходьба',
    );
    expect(activities).toHaveLength(1);
    expect(activities[0]?.durationSeconds).toBe(1800);
  });

  test('insulin edit save awaits IndexedDB and persists the same event id', async ({
    page,
  }) => {
    await page.goto('/timeline');
    await prepareCanonicalDemoTimelineFixture(page);

    await page
      .getByRole('button', { name: /Open event: NovoRapid/ })
      .first()
      .click();
    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(
      page.getByRole('dialog', { name: 'Edit event' }),
    ).toBeVisible();

    await page.getByLabel('Insulin dose').fill('6');
    await page.getByRole('button', { name: 'Save' }).click();

    const detail = page.getByRole('dialog', { name: 'NovoRapid' });
    await expect(detail).toBeVisible();
    await expect(detail.getByText('6 U')).toBeVisible();

    await expect
      .poll(async () => {
        const stored = await readActiveTimelineStoredEventById(
          page,
          'insulin-0805',
        );
        return stored?.doseUnits;
      })
      .toBe(6);

    await page.reload();
    await waitForApplicationReady(page);
    await waitForTimelineOwnershipReady(page);

    const reloaded = await readActiveTimelineStoredEventById(
      page,
      'insulin-0805',
    );
    expect(reloaded?.id).toBe('insulin-0805');
    expect(reloaded?.kind).toBe('insulin');
    expect(reloaded?.doseUnits).toBe(6);
    expect(reloaded?.createdAt).toBeTruthy();

    await page
      .getByRole('button', { name: /Open event: NovoRapid/ })
      .first()
      .click();
    await expect(
      page.getByRole('dialog', { name: 'NovoRapid' }).getByText('6 U'),
    ).toBeVisible();
  });

  test('pending medication save blocks dismiss and double submit writes one record', async ({
    page,
  }) => {
    await page.goto('/timeline');
    await prepareEmptyTimeline(page);
    await openTimelineQuickAdd(page);

    await page
      .getByRole('button', { name: 'Лекарство. Записать приём препарата' })
      .click();
    const dialog = page.getByRole('dialog', { name: 'Добавить лекарство' });
    await expect(dialog).toBeVisible();

    await page.getByRole('button', { name: /Препарат/ }).click();
    await page.getByRole('button', { name: 'Метформин' }).click();
    await page.getByRole('textbox', { name: 'Доза' }).fill('500');
    await installOneShotTimelineEventsWriteDelay(page, 750);

    const saveButton = dialog.getByRole('button', { name: 'Сохранить' });
    await Promise.all([saveButton.click(), saveButton.click()]);
    await expect(dialog.getByRole('status')).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-busy', 'true');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: /Cancel|Отмена/i }),
    ).toBeDisabled();

    await expect(dialog).toBeHidden();

    const events = await readActiveTimelineStoredEvents(page);
    expect(
      events.filter(
        (event) =>
          event.kind === 'medication' && event.medicationName === 'Метформин',
      ),
    ).toHaveLength(1);
  });

  test('timeline note delete awaits IndexedDB and remains absent after reload', async ({
    page,
  }) => {
    const noteText = 'Remediation 0B delete durability marker';

    await page.goto('/timeline');
    await prepareEmptyTimeline(page);
    await openTimelineQuickAdd(page);

    await page
      .getByRole('button', { name: 'Заметка. Добавить запись' })
      .click();
    const quickAddDialog = page.getByRole('dialog', {
      name: 'Добавить заметку',
    });
    await expect(quickAddDialog).toBeVisible();
    await page.getByLabel('Текст заметки').fill(noteText);
    await quickAddDialog.getByRole('button', { name: 'Сохранить' }).click();
    await expect(page.getByText(noteText).first()).toBeVisible();

    const storedBeforeDelete = await readActiveTimelineStoredEvents(page);
    const noteEvent = storedBeforeDelete.find(
      (event) => event.kind === 'note' && event.body === noteText,
    );
    expect(noteEvent?.id).toBeTruthy();

    await page.getByText(noteText).first().click();
    await expect(page.getByRole('dialog').filter({ hasText: noteText })).toBeVisible();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    const confirmation = page.getByRole('dialog', { name: 'Delete event?' });
    await expect(confirmation).toBeVisible();
    await confirmation
      .getByRole('button', { name: 'Delete', exact: true })
      .click();

    await expect(page.getByText(noteText)).toHaveCount(0);
    await expect
      .poll(async () => {
        const events = await readActiveTimelineStoredEvents(page);
        return events.some((event) => event.id === noteEvent?.id);
      })
      .toBe(false);

    await page.reload();
    await waitForApplicationReady(page);
    await waitForTimelineOwnershipReady(page);

    await expect(page.getByText(noteText)).toHaveCount(0);
    const reloaded = await readActiveTimelineStoredEvents(page);
    expect(reloaded.some((event) => event.id === noteEvent?.id)).toBe(false);
  });

  test('pending timeline delete blocks dismiss until durable completion', async ({
    page,
  }) => {
    const noteText = 'Remediation 0B pending delete marker';

    await page.goto('/timeline');
    await prepareEmptyTimeline(page);
    await openTimelineQuickAdd(page);

    await page
      .getByRole('button', { name: 'Заметка. Добавить запись' })
      .click();
    const quickAddDialog = page.getByRole('dialog', {
      name: 'Добавить заметку',
    });
    await page.getByLabel('Текст заметки').fill(noteText);
    await quickAddDialog.getByRole('button', { name: 'Сохранить' }).click();
    await expect(page.getByText(noteText).first()).toBeVisible();

    await page.getByText(noteText).first().click();
    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    const confirmation = page.getByRole('dialog', { name: 'Delete event?' });
    await expect(confirmation).toBeVisible();

    await installOneShotTimelineEventsWriteDelay(page, 750);
    const deleteButton = confirmation.getByRole('button', {
      name: 'Delete',
      exact: true,
    });
    await Promise.all([deleteButton.click(), deleteButton.click()]);

    await expect(confirmation.getByRole('status')).toBeVisible();
    await expect(confirmation).toHaveAttribute('aria-busy', 'true');
    await expect(
      confirmation.getByRole('button', { name: /Cancel|Отмена/i }),
    ).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(confirmation).toBeVisible();
    await expect(page.getByText(noteText).first()).toBeVisible();

    await expect(confirmation).toBeHidden();
    await expect(page.getByText(noteText)).toHaveCount(0);
  });
});
