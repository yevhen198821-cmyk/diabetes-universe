import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  CANONICAL_TRANSLATION_KEYS,
  englishCanonicalMessages,
  germanTranslationResource,
  russianTranslationResource,
  ukrainianTranslationResource,
} from '../../../../packages/locales/src/index.ts';

import { createTestPlatformRuntime } from '../../lib/platform/react/testing/create-test-platform-runtime.ts';
import {
  INSULIN_QUICK_ADD_TRANSLATION_KEYS,
  resolveInsulinQuickAddLabels,
} from './insulin-quick-add-labels.ts';

const CYRILLIC_PATTERN = /[\u0400-\u04ff]/;

const LOCALES = [
  ['en-GB', 'Europe/London'],
  ['ru-RU', 'Europe/Moscow'],
  ['uk-UA', 'Europe/Kyiv'],
  ['de-DE', 'Europe/Berlin'],
];

async function resolveLabels(acceptLanguage, cookieTimeZone) {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage, cookieTimeZone },
  });

  return resolveInsulinQuickAddLabels(runtime.localization);
}

test('every insulin Quick Add key is canonical and present in English resources', () => {
  const canonical = new Set(CANONICAL_TRANSLATION_KEYS);

  for (const key of Object.values(INSULIN_QUICK_ADD_TRANSLATION_KEYS)) {
    assert.equal(
      canonical.has(key),
      true,
      `${key} is declared in CANONICAL_TRANSLATION_KEYS`,
    );
    assert.match(key, /^quick-add\.insulin\./);
    assert.equal(typeof englishCanonicalMessages[key], 'string');
    assert.equal(englishCanonicalMessages[key].trim().length > 0, true);
  }
});

test('insulin Quick Add keys exist in RU/UK/DE without English fallback', () => {
  const translatedKeys = [
    INSULIN_QUICK_ADD_TRANSLATION_KEYS.cancel,
    INSULIN_QUICK_ADD_TRANSLATION_KEYS.contextLabel,
    INSULIN_QUICK_ADD_TRANSLATION_KEYS.contextPlaceholder,
    INSULIN_QUICK_ADD_TRANSLATION_KEYS.contextSheetTitle,
    INSULIN_QUICK_ADD_TRANSLATION_KEYS.doseError,
    INSULIN_QUICK_ADD_TRANSLATION_KEYS.doseLabel,
    INSULIN_QUICK_ADD_TRANSLATION_KEYS.doseUnit,
    INSULIN_QUICK_ADD_TRANSLATION_KEYS.otherNameLabel,
    INSULIN_QUICK_ADD_TRANSLATION_KEYS.otherNamePlaceholder,
    INSULIN_QUICK_ADD_TRANSLATION_KEYS.otherNameRequiredError,
    INSULIN_QUICK_ADD_TRANSLATION_KEYS.preparationLabel,
    INSULIN_QUICK_ADD_TRANSLATION_KEYS.preparationPlaceholder,
    INSULIN_QUICK_ADD_TRANSLATION_KEYS.preparationSheetTitle,
    INSULIN_QUICK_ADD_TRANSLATION_KEYS.save,
    INSULIN_QUICK_ADD_TRANSLATION_KEYS.timeLabel,
  ];

  for (const resource of [
    russianTranslationResource,
    ukrainianTranslationResource,
    germanTranslationResource,
  ]) {
    for (const key of translatedKeys) {
      const value = resource.messages[key];

      assert.equal(typeof value, 'string', `${resource.metadata.locale} ${key}`);
      assert.equal(value.trim().length > 0, true);
      assert.notEqual(
        value,
        englishCanonicalMessages[key],
        `${resource.metadata.locale} ${key} is not an English fallback`,
      );
    }
  }
});

test('every supported locale resolves the full insulin Quick Add chrome', async () => {
  for (const [acceptLanguage, timeZone] of LOCALES) {
    const labels = await resolveLabels(acceptLanguage, timeZone);

    assert.equal(
      Object.keys(labels).length,
      Object.keys(INSULIN_QUICK_ADD_TRANSLATION_KEYS).length,
    );

    for (const [name, value] of Object.entries(labels)) {
      assert.equal(typeof value, 'string', `${acceptLanguage}.${name}`);
      assert.ok(
        value.length > 0,
        `${acceptLanguage}.${name} is non-empty`,
      );
      assert.equal(
        value.startsWith('quick-add.'),
        false,
        `${acceptLanguage}.${name} does not leak a raw key: ${value}`,
      );
    }
  }
});

test('English insulin Quick Add chrome contains no Cyrillic', async () => {
  const labels = await resolveLabels('en-GB', 'Europe/London');

  for (const [name, value] of Object.entries(labels)) {
    assert.doesNotMatch(value, CYRILLIC_PATTERN, `en-GB.${name}: ${value}`);
  }

  assert.equal(labels.preparationLabel, 'Insulin preparation');
  assert.equal(labels.doseLabel, 'Insulin dose');
  assert.equal(labels.contextLabel, 'Administration context');
  assert.equal(labels.doseUnit, 'U');
  assert.equal(labels.cancel, 'Cancel');
  assert.equal(labels.save, 'Save');
});

test('each locale differs from English for the translated form chrome', async () => {
  const english = await resolveLabels('en-GB', 'Europe/London');

  for (const [acceptLanguage, timeZone] of LOCALES.slice(1)) {
    const labels = await resolveLabels(acceptLanguage, timeZone);

    for (const name of [
      'contextLabel',
      'doseLabel',
      'preparationLabel',
      'save',
    ]) {
      assert.notEqual(
        labels[name],
        english[name],
        `${acceptLanguage}.${name} is translated`,
      );
    }
  }
});

test('validation copy is localized and free of clinical claims in every locale', async () => {
  for (const [acceptLanguage, timeZone] of LOCALES) {
    const labels = await resolveLabels(acceptLanguage, timeZone);

    for (const message of [
      labels.doseError,
      labels.otherNameRequiredError,
    ]) {
      assert.ok(message.length > 0);
      assert.equal(
        /safe dose|recommended dose|correct dose|maximum safe|suggested insulin/i.test(
          message,
        ),
        false,
        `${acceptLanguage} validation copy avoids clinical claims: ${message}`,
      );
    }
  }
});

test('the insulin Quick Add form and labels contain no hardcoded Russian', () => {
  for (const relativePath of [
    './insulin-quick-add-form.tsx',
    './insulin-quick-add-labels.ts',
    '../../lib/quick-add/insulin-quick-add-submit.ts',
    '../../lib/quick-add/insulin-quick-add-dose.ts',
  ]) {
    const source = readFileSync(
      new URL(relativePath, import.meta.url),
      'utf8',
    );

    assert.doesNotMatch(
      source,
      CYRILLIC_PATTERN,
      `${relativePath} has no hardcoded Cyrillic copy`,
    );
  }
});

test('the insulin Quick Add form reuses the shared insulin presentation adapter', () => {
  const source = readFileSync(
    new URL('./insulin-quick-add-form.tsx', import.meta.url),
    'utf8',
  );

  for (const signal of [
    'resolveInsulinPresentationLabels',
    'resolveInsulinPreparationOptionGroups',
    'resolveInsulinAdministrationContextOptions',
    'useLocalization',
  ]) {
    assert.match(source, new RegExp(signal), `form uses ${signal}`);
  }

  assert.doesNotMatch(source, /insulinPreparationOptionGroups/);
  assert.doesNotMatch(source, /insulinContextOptions/);
});
