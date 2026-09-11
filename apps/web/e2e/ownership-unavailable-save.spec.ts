import { expect, test } from './support/test';

for (const failure of ['500', '429', 'network'] as const) {
  test(`session ${failure} cannot report a durable save and retry preserves the entry`, async ({
    page,
  }) => {
    await page.route('**/api/auth/get-session', (route) =>
      failure === 'network'
        ? route.abort()
        : route.fulfill({
            status: Number(failure),
            contentType: 'application/json',
            body: '{}',
          }),
    );
    await page.goto('/');
    await expect(page.locator('[data-timeline-ownership]')).toHaveAttribute(
      'data-timeline-ownership',
      'pending',
    );
    await page
      .getByRole('button', { name: 'Add glucose', exact: true })
      .click();
    const dialog = page.getByRole('dialog', { name: 'Добавить глюкозу' });
    await dialog
      .getByRole('textbox', { name: 'Glucose level', exact: true })
      .fill('5.5');
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('alert')).toBeVisible();
    await expect(
      dialog.getByRole('textbox', { name: 'Glucose level', exact: true }),
    ).toHaveValue('5.5');
    await page.unroute('**/api/auth/get-session');
    await page.route('**/api/auth/get-session', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'null',
      }),
    );
    // Retrying inside the still-open form must recheck ownership even when
    // the outer retry banner is behind the modal. The unresolved write rejects.
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.locator('[data-timeline-ownership]')).toHaveAttribute(
      'data-timeline-ownership',
      'anonymous',
    );
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(dialog).toBeHidden();
    await page.reload();
    await expect(
      page
        .getByRole('region', { name: 'Last glucose', exact: true })
        .getByText('5.5', { exact: true }),
    ).toBeVisible();
  });
}
