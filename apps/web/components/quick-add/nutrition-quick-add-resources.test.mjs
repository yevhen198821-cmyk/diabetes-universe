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
  NUTRITION_QUICK_ADD_TRANSLATION_KEYS,
  resolveNutritionQuickAddLabels,
} from './nutrition-quick-add-labels.ts';

const CYRILLIC_PATTERN = /[\u0400-\u04ff]/;

const LOCALES = [
  ['en-GB', 'Europe/London'],
  ['de-DE', 'Europe/Berlin'],
  ['uk-UA', 'Europe/Kyiv'],
  ['ru-RU', 'Europe/Moscow'],
];

const CRITICAL_LABELS = [
  'title',
  'modeManual',
  'modeItems',
  'mealTypeLabel',
  'carbsLabel',
  'carbsUnit',
  'noteLabel',
  'save',
  'cancel',
];

async function resolveLabels(acceptLanguage, cookieTimeZone) {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage, cookieTimeZone },
  });

  return resolveNutritionQuickAddLabels(runtime.localization);
}

test('every nutrition Quick Add key is canonical and present in English resources', () => {
  const canonical = new Set(CANONICAL_TRANSLATION_KEYS);

  for (const key of Object.values(NUTRITION_QUICK_ADD_TRANSLATION_KEYS)) {
    assert.equal(
      canonical.has(key),
      true,
      `${key} is declared in CANONICAL_TRANSLATION_KEYS`,
    );
    assert.match(key, /^quick-add\.nutrition\./);
    assert.equal(typeof englishCanonicalMessages[key], 'string');
    assert.equal(englishCanonicalMessages[key].trim().length > 0, true);
  }
});

test('nutrition Quick Add keys exist in DE/UK/RU without English fallback', () => {
  const translatedKeys = Object.values(NUTRITION_QUICK_ADD_TRANSLATION_KEYS);

  for (const resource of [
    germanTranslationResource,
    ukrainianTranslationResource,
    russianTranslationResource,
  ]) {
    for (const key of translatedKeys) {
      const value = resource.messages[key];

      assert.equal(
        typeof value,
        'string',
        `${resource.metadata.locale} ${key}`,
      );
      assert.equal(value.trim().length > 0, true);

      if (
        key === 'quick-add.nutrition.carbsPlaceholder' ||
        key === 'quick-add.nutrition.weightPlaceholder' ||
        (resource.metadata.locale === 'de-DE' &&
          key === 'quick-add.nutrition.carbsUnit')
      ) {
        continue;
      }

      assert.notEqual(
        value,
        englishCanonicalMessages[key],
        `${resource.metadata.locale} ${key} is not an English fallback`,
      );
    }
  }
});

test('every supported locale resolves Nutrition Quick Add chrome without key leakage', async () => {
  for (const [acceptLanguage, timeZone] of LOCALES) {
    const labels = await resolveLabels(acceptLanguage, timeZone);

    for (const name of CRITICAL_LABELS) {
      const value = labels[name];
      assert.equal(typeof value, 'string', `${acceptLanguage}.${name}`);
      assert.ok(value.length > 0, `${acceptLanguage}.${name} is non-empty`);
      assert.equal(
        value.startsWith('quick-add.'),
        false,
        `${acceptLanguage}.${name} does not leak a raw key: ${value}`,
      );
    }
  }
});

test('meal type labels stay in the active locale while IDs stay canonical', async () => {
  const expected = {
    'de-DE': {
      breakfast: 'Frühstück',
      dinner: 'Abendessen',
      lunch: 'Mittagessen',
      other: 'Sonstiges',
      snack: 'Snack',
    },
    'en-GB': {
      breakfast: 'Breakfast',
      dinner: 'Dinner',
      lunch: 'Lunch',
      other: 'Other',
      snack: 'Snack',
    },
    'ru-RU': {
      breakfast: 'Завтрак',
      dinner: 'Ужин',
      lunch: 'Обед',
      other: 'Другое',
      snack: 'Перекус',
    },
    'uk-UA': {
      breakfast: 'Сніданок',
      dinner: 'Вечеря',
      lunch: 'Обід',
      other: 'Інше',
      snack: 'Перекус',
    },
  };
  const timeZones = Object.fromEntries(LOCALES);

  for (const [locale, meals] of Object.entries(expected)) {
    const labels = await resolveLabels(locale, timeZones[locale]);

    assert.deepEqual(labels.mealTypes, meals);
    assert.equal(Object.hasOwn(labels.mealTypes, 'unspecified'), false);
  }
});

test('English Nutrition Quick Add chrome contains no Cyrillic and no Russian leftovers', async () => {
  const labels = await resolveLabels('en-GB', 'Europe/London');

  for (const [name, value] of Object.entries(labels)) {
    if (typeof value === 'string') {
      assert.doesNotMatch(value, CYRILLIC_PATTERN, `en-GB.${name}: ${value}`);
    }
  }

  for (const value of Object.values(labels.mealTypes)) {
    assert.doesNotMatch(value, CYRILLIC_PATTERN, value);
  }

  for (const value of Object.values(labels.demoProducts)) {
    assert.doesNotMatch(value, CYRILLIC_PATTERN, value);
  }

  assert.equal(labels.title, 'Add nutrition');
  assert.equal(labels.carbsLabel, 'Carbohydrates');
  assert.equal(labels.modeManual, 'Total carbs');
  assert.equal(labels.modeItems, 'Items');
  assert.equal(labels.save, 'Save');
  assert.equal(labels.cancel, 'Cancel');
});

test('German, Ukrainian, and Russian chrome differ from English for critical labels', async () => {
  const english = await resolveLabels('en-GB', 'Europe/London');

  for (const [acceptLanguage, timeZone] of LOCALES.slice(1)) {
    const labels = await resolveLabels(acceptLanguage, timeZone);

    for (const name of CRITICAL_LABELS) {
      if (name === 'carbsUnit' && acceptLanguage === 'de-DE') {
        continue;
      }

      assert.notEqual(
        labels[name],
        english[name],
        `${acceptLanguage}.${name} is translated`,
      );
    }
  }
});

test('the Nutrition Quick Add form and labels contain no hardcoded language copy', () => {
  for (const relativePath of [
    './nutrition-quick-add-form.tsx',
    './nutrition-quick-add-labels.ts',
    '../../lib/quick-add/nutrition-quick-add-submit.ts',
    '../../lib/quick-add/nutrition-demo-products.ts',
    '../../lib/medical/nutrition/nutrition-manual-carbs-input.ts',
  ]) {
    const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');

    assert.doesNotMatch(
      source,
      CYRILLIC_PATTERN,
      `${relativePath} has no hardcoded Cyrillic copy`,
    );
  }
});
