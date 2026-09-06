import assert from 'node:assert/strict';
import test from 'node:test';

import { germanCanonicalMessages } from '../../../../packages/locales/src/resources/de/messages.ts';
import { englishCanonicalMessages } from '../../../../packages/locales/src/resources/en/messages.ts';
import { russianCanonicalMessages } from '../../../../packages/locales/src/resources/ru/messages.ts';
import { ukrainianCanonicalMessages } from '../../../../packages/locales/src/resources/uk/messages.ts';

const KEYS = [
  'quick-add.glucose.loading',
  'quick-add.glucose.settingsError.title',
  'quick-add.glucose.settingsError.description',
  'quick-add.glucose.settingsError.retry',
  'quick-add.glucose.unitGate.title',
  'quick-add.glucose.unitGate.description',
  'quick-add.glucose.unitGate.sessionDescription',
  'quick-add.glucose.unitSaving',
];

const CATALOGS = {
  'de-DE': germanCanonicalMessages,
  'en-GB': englishCanonicalMessages,
  'ru-RU': russianCanonicalMessages,
  'uk-UA': ukrainianCanonicalMessages,
};

test('glucose settings availability strings exist in all four locales', () => {
  for (const [locale, catalog] of Object.entries(CATALOGS)) {
    for (const key of KEYS) {
      const value = catalog[key];
      assert.equal(typeof value, 'string', `${locale} ${key}`);
      assert.ok(value.trim().length > 0, `${locale} ${key} is empty`);
    }
  }

  assert.match(
    englishCanonicalMessages['quick-add.glucose.settingsError.title'],
    /Could not load/,
  );
  assert.match(
    russianCanonicalMessages['quick-add.glucose.settingsError.title'],
    /Не удалось/,
  );
  assert.match(
    germanCanonicalMessages['quick-add.glucose.settingsError.retry'],
    /Erneut/,
  );
  assert.match(
    ukrainianCanonicalMessages['quick-add.glucose.settingsError.retry'],
    /Повторити/,
  );
});
