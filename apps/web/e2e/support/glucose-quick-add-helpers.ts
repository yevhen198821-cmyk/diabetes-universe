import type { Page } from '@playwright/test';

export async function selectGlucoseUnitIfRequired(
  page: Page,
  unitLabel: 'mmol/L' | 'mg/dL' = 'mmol/L',
): Promise<void> {
  const unitButton = page.getByRole('button', { name: unitLabel, exact: true });

  if (await unitButton.isVisible()) {
    await unitButton.click();
  }
}
