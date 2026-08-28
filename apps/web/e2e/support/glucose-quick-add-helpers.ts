import { expect, type Page } from '@playwright/test';

export async function selectGlucoseUnitIfRequired(
  page: Page,
  unitLabel: 'mmol/L' | 'mg/dL' = 'mmol/L',
): Promise<void> {
  const unitButton = page.getByRole('button', { name: unitLabel, exact: true });

  if (await unitButton.isVisible()) {
    await unitButton.click();
  }
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
