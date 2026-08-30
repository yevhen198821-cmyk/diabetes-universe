import { expect, type Page } from '@playwright/test';

import { waitForApplicationReady } from './wait-for-application-ready';

function createConfiguredSettingsResponse(unit: 'mmol_per_l' | 'mg_per_dl') {
  return {
    configured: true,
    createdAt: '2026-08-02T00:00:00.000Z',
    diabetesType: {
      category: 'unknown',
      source: 'self_reported',
    },
    glucoseDisplayUnit: unit,
    revision: '1',
    settingsId: '00000000-0000-4000-8000-000000000001',
    subjectId: '00000000-0000-4000-8000-000000000002',
    updatedAt: '2026-08-02T00:00:00.000Z',
  };
}

export async function installConfiguredGlucoseSettingsMock(
  page: Page,
  unitLabel: 'mmol/L' | 'mg/dL' = 'mmol/L',
): Promise<void> {
  const glucoseDisplayUnit = unitLabel === 'mg/dL' ? 'mg_per_dl' : 'mmol_per_l';

  await page.route('**/api/v1/medical/me/diabetes-settings', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        body: JSON.stringify(
          createConfiguredSettingsResponse(glucoseDisplayUnit),
        ),
        contentType: 'application/json',
        status: 200,
      });
      return;
    }

    await route.continue();
  });
}

export async function prepareGlucoseQuickAddSettings(
  page: Page,
  unitLabel: 'mmol/L' | 'mg/dL' = 'mmol/L',
): Promise<void> {
  await installConfiguredGlucoseSettingsMock(page, unitLabel);
  await page.reload();
  await waitForApplicationReady(page);
}

export async function ensureGlucoseDisplayUnitConfigured(
  page: Page,
  unitLabel: 'mmol/L' | 'mg/dL' = 'mmol/L',
): Promise<void> {
  await page.goto('/account/diabetes');
  await waitForApplicationReady(page);

  const unitButton = page.getByRole('button', { name: unitLabel, exact: true });
  if ((await unitButton.getAttribute('aria-pressed')) !== 'true') {
    const patchPromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/medical/me/diabetes-settings') &&
        response.request().method() === 'PATCH',
    );
    await unitButton.click();
    expect((await patchPromise).ok()).toBeTruthy();
  }
}

export async function selectGlucoseUnitIfRequired(
  page: Page,
  _unitLabel: 'mmol/L' | 'mg/dL' = 'mmol/L',
): Promise<void> {
  const valueInput = page.getByLabel(
    /Glucose level|Уровень глюкозы|Рівень глюкози|Glukosewert/i,
  );

  if (!(await valueInput.isVisible())) {
    return;
  }

  await expect(valueInput).toBeEnabled();
}

export async function saveGlucoseQuickAdd(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog', { name: 'Добавить глюкозу' });
  await dialog
    .getByRole('button', {
      name: /Save|Сохранить|Speichern|Зберегти/i,
      exact: true,
    })
    .click();
}

export async function openGlucoseQuickAddTimePicker(page: Page): Promise<void> {
  await page.locator('#quick-add-glucose-time').click();
}

export async function setGlucoseQuickAddTime(
  page: Page,
  hour: string,
  minute: string,
): Promise<void> {
  await openGlucoseQuickAddTimePicker(page);

  const timePicker = page.getByRole('dialog', { name: 'Выберите время' });
  await expect(timePicker).toBeVisible();
  await timePicker.getByRole('button', { name: hour }).first().click();
  await timePicker.getByRole('button', { name: minute }).last().click();
  await timePicker.getByRole('button', { name: 'Готово' }).click();
}
