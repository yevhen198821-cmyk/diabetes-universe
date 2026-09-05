import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CANONICAL_TRANSLATION_KEYS,
  englishTranslationResource,
  germanTranslationResource,
  russianTranslationResource,
  ukrainianTranslationResource,
} from '@diabetes-universe/locales';

import { LOCALE_RESOURCE_CATALOG } from './locale-resource-catalog.ts';
import { CANONICAL_SUPPORTED_LOCALE_CODES } from './canonical-locale-catalog.ts';

const productionResources = {
  'de-DE': germanTranslationResource.messages,
  'en-GB': englishTranslationResource.messages,
  'ru-RU': russianTranslationResource.messages,
  'uk-UA': ukrainianTranslationResource.messages,
};

test('catalog locales match the four production resource bundles', () => {
  assert.deepEqual(
    Object.keys(LOCALE_RESOURCE_CATALOG).sort(),
    [...CANONICAL_SUPPORTED_LOCALE_CODES].sort(),
  );
});

test('every production locale has a non-empty value for every canonical key', () => {
  for (const locale of CANONICAL_SUPPORTED_LOCALE_CODES) {
    const messages = productionResources[locale];

    assert.ok(messages, `${locale} resource is present`);

    for (const key of CANONICAL_TRANSLATION_KEYS) {
      const value = messages[key];
      assert.equal(typeof value, 'string', `${locale} missing ${key}`);
      assert.ok(value.trim().length > 0, `${locale} empty ${key}`);
    }
  }
});
