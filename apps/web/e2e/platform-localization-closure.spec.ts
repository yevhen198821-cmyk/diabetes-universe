import { type Browser, type BrowserContext } from '@playwright/test';

import { expect, test, type Page } from './support/test';

import { signInWithMagicLink } from './support/auth-helpers';
import {
  clearTimelineEventsInIndexedDb,
  seedTimelineEventInIndexedDb,
  waitForTimelineBootstrapComplete,
} from './support/timeline-indexeddb-helpers';
import { waitForApplicationReady } from './support/wait-for-application-ready';

const LOCALE_COOKIE_NAME = 'du-web-locale';
const CANONICAL_INSULIN_ID = 'localization-closure-insulin-12-125';

interface LocaleMatrix {
  readonly acceptLanguageConflict: string;
  readonly contexts: {
    readonly basal: string;
    readonly correction: string;
  };
  readonly edit: string;
  readonly glucoseLabel: string;
  readonly htmlLang: string;
  readonly insulinDose: string;
  readonly insulinPreparation: string;
  readonly lastGlucose: string;
  readonly locale: 'de-DE' | 'en-GB' | 'ru-RU' | 'uk-UA';
  readonly nativeName: string;
  readonly openEventPrefix: string;
  readonly recentEvents: string;
  readonly save: string;
  readonly seededDoseDisplay: string;
  readonly signInContinue: string;
  readonly signInTitle: string;
  readonly timelineHeading: string;
}

const LOCALES: readonly LocaleMatrix[] = [
  {
    acceptLanguageConflict: 'ru-RU',
    contexts: { basal: 'Basal', correction: 'Correction' },
    edit: 'Edit',
    glucoseLabel: 'Glucose level',
    htmlLang: 'en',
    insulinDose: 'Insulin dose',
    insulinPreparation: 'Insulin preparation',
    lastGlucose: 'Last glucose',
    locale: 'en-GB',
    nativeName: 'English',
    openEventPrefix: 'Open event',
    recentEvents: 'Recent events',
    save: 'Save',
    seededDoseDisplay: '12.125',
    signInContinue: 'Continue',
    signInTitle: 'Sign in',
    timelineHeading: 'Timeline',
  },
  {
    acceptLanguageConflict: 'ru-RU',
    contexts: { basal: 'Basal', correction: 'Korrektur' },
    edit: 'Bearbeiten',
    glucoseLabel: 'Glukosewert',
    htmlLang: 'de',
    insulinDose: 'Insulindosis',
    insulinPreparation: 'Insulinpräparat',
    lastGlucose: 'Letzte Glukose',
    locale: 'de-DE',
    nativeName: 'Deutsch',
    openEventPrefix: 'Ereignis öffnen',
    recentEvents: 'Recent events',
    save: 'Speichern',
    seededDoseDisplay: '12,125',
    signInContinue: 'Weiter',
    signInTitle: 'Anmelden',
    timelineHeading: 'Zeitachse',
  },
  {
    acceptLanguageConflict: 'de-DE',
    contexts: { basal: 'Базал', correction: 'Корекція' },
    edit: 'Редагувати',
    glucoseLabel: 'Рівень глюкози',
    htmlLang: 'uk',
    insulinDose: 'Доза інсуліну',
    insulinPreparation: 'Препарат інсуліну',
    lastGlucose: 'Останній рівень глюкози',
    locale: 'uk-UA',
    nativeName: 'Українська',
    openEventPrefix: 'Відкрити подію',
    recentEvents: 'Recent events',
    save: 'Зберегти',
    seededDoseDisplay: '12,125',
    signInContinue: 'Продовжити',
    signInTitle: 'Вхід',
    timelineHeading: 'Хронологія',
  },
  {
    acceptLanguageConflict: 'de-DE',
    contexts: { basal: 'Базал', correction: 'Коррекция' },
    edit: 'Редактировать',
    glucoseLabel: 'Уровень глюкозы',
    htmlLang: 'ru',
    insulinDose: 'Доза инсулина',
    insulinPreparation: 'Препарат инсулина',
    lastGlucose: 'Последняя глюкоза',
    locale: 'ru-RU',
    nativeName: 'Русский',
    openEventPrefix: 'Открыть событие',
    recentEvents: 'Последние записи',
    save: 'Сохранить',
    seededDoseDisplay: '12,125',
    signInContinue: 'Продолжить',
    signInTitle: 'Вход',
    timelineHeading: 'Таймлайн',
  },
];

interface StoredEvent {
  readonly administrationContext?: string;
  readonly doseUnits?: number;
  readonly id?: string;
  readonly kind?: string;
  readonly locale?: string;
  readonly preparation?: string;
  readonly preparationId?: string;
}

async function createConflictingBrowser(
  browser: Browser,
  locale: LocaleMatrix,
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    extraHTTPHeaders: { 'Accept-Language': locale.acceptLanguageConflict },
    locale: locale.acceptLanguageConflict,
  });

  return { context, page: await context.newPage() };
}

async function expectLocaleCookie(context: BrowserContext, locale: string) {
  const cookies = await context.cookies();
  const localeCookie = cookies.find(
    (cookie) => cookie.name === LOCALE_COOKIE_NAME,
  );

  expect(localeCookie?.value).toBe(locale);
  expect(localeCookie?.path).toBe('/');
  expect(localeCookie?.sameSite).toBe('Lax');
}

async function expectDocumentLanguage(page: Page, htmlLang: string) {
  await expect(page.locator('html')).toHaveAttribute('lang', htmlLang);
}

async function selectLanguage(page: Page, locale: LocaleMatrix) {
  await page.goto('/account');
  await waitForApplicationReady(page);
  await page
    .getByRole('link', {
      name: /Language and region|Sprache und Region|Мова та регіон|Язык и регион/,
    })
    .click();
  await waitForApplicationReady(page);
  await page.locator(`button[data-locale="${locale.locale}"]`).click();
  await waitForApplicationReady(page);
  await expect(
    page.locator(`button[data-locale="${locale.locale}"]`),
  ).toHaveAttribute('aria-selected', 'true');
}

async function readManualEvents(page: Page): Promise<readonly StoredEvent[]> {
  return page.evaluate(async () => {
    return new Promise<StoredEvent[]>((resolve, reject) => {
      const request = indexedDB.open('diabetes-universe-timeline');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('timeline_events', 'readonly');
        const getAll = transaction.objectStore('timeline_events').getAll();
        getAll.onerror = () => {
          database.close();
          reject(getAll.error);
        };
        getAll.onsuccess = () => {
          database.close();
          const rows = (getAll.result ?? []) as readonly {
            readonly event?: StoredEvent;
          }[];
          resolve(
            rows
              .map((row) => row.event)
              .filter((event): event is StoredEvent => Boolean(event)),
          );
        };
      };
    });
  });
}

async function prepareEmptyTimeline(page: Page) {
  await waitForApplicationReady(page);
  await waitForTimelineBootstrapComplete(page);
  await clearTimelineEventsInIndexedDb(page);
  await seedTimelineEventInIndexedDb(page, {
    createdAt: '2026-08-02T05:00:00.000Z',
    doseUnits: 12.125,
    id: CANONICAL_INSULIN_ID,
    kind: 'insulin',
    occurredAt: '2026-08-02T05:00:00.000Z',
    preparation: 'NovoRapid',
    schemaVersion: 1,
    source: 'manual',
    updatedAt: '2026-08-02T05:00:00.000Z',
  });
  await page.reload();
  await waitForApplicationReady(page);
}

for (const locale of LOCALES) {
  test(`locale matrix ${locale.locale} persists and stays locale-neutral in medical data`, async ({
    browser,
    request,
  }) => {
    const { context, page } = await createConflictingBrowser(browser, locale);

    await signInWithMagicLink(
      page,
      request,
      `localization-closure-${locale.locale}@example.com`,
    );
    await selectLanguage(page, locale);
    await expectLocaleCookie(context, locale.locale);
    await expectDocumentLanguage(page, locale.htmlLang);

    await page.goto('/');
    await prepareEmptyTimeline(page);
    await expectDocumentLanguage(page, locale.htmlLang);
    await expect(
      page.getByRole('heading', { name: locale.lastGlucose }),
    ).toBeVisible();
    await expect(
      page.getByRole('region', { name: locale.recentEvents }),
    ).toBeVisible();
    await expect(
      page.getByRole('region', { name: locale.recentEvents }),
    ).toContainText(locale.seededDoseDisplay);

    await page
      .getByRole('button', { name: /Glucose|Глюкоза|Glukose/ })
      .first()
      .click();
    const glucoseInput = page.getByLabel(locale.glucoseLabel);
    await expect(glucoseInput).toBeVisible();
    await glucoseInput.fill('6.2');
    await page.getByRole('button', { name: locale.save, exact: true }).click();
    await expect(glucoseInput).toHaveCount(0);

    await page
      .getByRole('button', { name: /Insulin|Инсулин|Інсулін/ })
      .first()
      .click();
    await page.getByRole('button', { name: locale.insulinPreparation }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Fiasp', exact: true })
      .click();
    await page.getByRole('textbox', { name: locale.insulinDose }).fill('12.25');
    await page.getByRole('button', { name: locale.save, exact: true }).click();
    await expect(
      page.getByRole('textbox', { name: locale.insulinDose }),
    ).toHaveCount(0);

    await page.goto('/timeline');
    await waitForApplicationReady(page);
    await expectDocumentLanguage(page, locale.htmlLang);
    await expect(
      page.getByRole('heading', { level: 1, name: locale.timelineHeading }),
    ).toBeVisible();

    const insulinCard = page.getByRole('button', {
      name: new RegExp(`${locale.openEventPrefix}: Fiasp`),
    });
    await expect(insulinCard).toBeVisible();
    await insulinCard.click();
    await expect(page.getByRole('dialog', { name: 'Fiasp' })).toBeVisible();
    await page.getByRole('button', { name: locale.edit }).click();
    await page.getByLabel(locale.insulinDose).fill('12.25');
    await page.getByRole('button', { name: locale.save, exact: true }).click();

    const eventsBeforeReload = await readManualEvents(page);
    const addedInsulin = eventsBeforeReload.find(
      (event) => event.preparation === 'Fiasp',
    );
    const seededInsulin = eventsBeforeReload.find(
      (event) => event.id === CANONICAL_INSULIN_ID,
    );
    const addedGlucose = eventsBeforeReload.find(
      (event) => event.kind === 'glucose',
    );

    expect(addedInsulin?.doseUnits).toBe(12.25);
    expect(addedInsulin?.preparationId).toBe('insulin.prep.aspart_fiasp');
    expect(seededInsulin?.doseUnits).toBe(12.125);
    expect(addedGlucose).toBeTruthy();
    expect(
      eventsBeforeReload.every((event) => event.locale === undefined),
    ).toBe(true);

    await page.reload();
    await waitForApplicationReady(page);
    await expectLocaleCookie(context, locale.locale);
    await expectDocumentLanguage(page, locale.htmlLang);
    await expect(
      page.getByRole('heading', { level: 1, name: locale.timelineHeading }),
    ).toBeVisible();

    await page.goto('/');
    await waitForApplicationReady(page);
    await expect(
      page.getByRole('heading', { name: locale.lastGlucose }),
    ).toBeVisible();
    await expect(
      page.getByRole('region', { name: locale.recentEvents }),
    ).toBeVisible();

    const eventsAfterReload = await readManualEvents(page);
    expect(
      eventsAfterReload.find((event) => event.preparation === 'Fiasp')
        ?.doseUnits,
    ).toBe(12.25);
    expect(
      eventsAfterReload.find((event) => event.id === CANONICAL_INSULIN_ID)
        ?.doseUnits,
    ).toBe(12.125);

    await context.close();
  });
}

test('logout keeps the locale cookie and auth UI in the selected language', async ({
  browser,
  request,
}) => {
  const locale = LOCALES.find((entry) => entry.locale === 'de-DE');
  if (!locale) {
    throw new Error('German locale fixture is required');
  }

  const { context, page } = await createConflictingBrowser(browser, locale);

  await signInWithMagicLink(
    page,
    request,
    'localization-closure-auth@example.com',
  );
  await selectLanguage(page, locale);
  await expectLocaleCookie(context, 'de-DE');

  await page.goto('/account');
  await waitForApplicationReady(page);
  await page
    .getByRole('button', { name: /Abmelden|Sign out|Выйти|Вийти/ })
    .click();
  await expect(page).toHaveURL(/\/auth/);
  await waitForApplicationReady(page);
  await expectLocaleCookie(context, 'de-DE');
  await expectDocumentLanguage(page, 'de');
  await expect(
    page.getByRole('heading', { name: locale.signInTitle }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: locale.signInContinue }),
  ).toBeVisible();

  await signInWithMagicLink(
    page,
    request,
    'localization-closure-auth@example.com',
  );
  await page.goto('/');
  await waitForApplicationReady(page);
  await expectDocumentLanguage(page, 'de');
  await expect(
    page.getByRole('heading', { name: locale.lastGlucose }),
  ).toBeVisible();
  await expectLocaleCookie(context, 'de-DE');

  await context.close();
});
