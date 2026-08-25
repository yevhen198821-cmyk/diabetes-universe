import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatPluralMessage,
  resolvePluralCategory,
} from './format-plural-message.ts';

const enEventCount = {
  one: '{count} event',
  other: '{count} events',
};

const ruEventCount = {
  one: '{count} событие',
  few: '{count} события',
  many: '{count} событий',
  other: '{count} событий',
};

const ukEventCount = {
  one: '{count} подія',
  few: '{count} події',
  many: '{count} подій',
  other: '{count} подій',
};

const deEventCount = {
  one: '{count} Ereignis',
  other: '{count} Ereignisse',
};

test('English event count pluralization', () => {
  assert.equal(formatPluralMessage(0, enEventCount, 'en-GB'), '0 events');
  assert.equal(formatPluralMessage(1, enEventCount, 'en-GB'), '1 event');
  assert.equal(formatPluralMessage(2, enEventCount, 'en-GB'), '2 events');
});

test('Russian event count pluralization', () => {
  assert.equal(formatPluralMessage(0, ruEventCount, 'ru-RU'), '0 событий');
  assert.equal(formatPluralMessage(1, ruEventCount, 'ru-RU'), '1 событие');
  assert.equal(formatPluralMessage(2, ruEventCount, 'ru-RU'), '2 события');
  assert.equal(formatPluralMessage(5, ruEventCount, 'ru-RU'), '5 событий');
  assert.equal(formatPluralMessage(21, ruEventCount, 'ru-RU'), '21 событие');
  assert.equal(formatPluralMessage(22, ruEventCount, 'ru-RU'), '22 события');
  assert.equal(formatPluralMessage(25, ruEventCount, 'ru-RU'), '25 событий');
});

test('Ukrainian event count pluralization', () => {
  assert.equal(formatPluralMessage(0, ukEventCount, 'uk-UA'), '0 подій');
  assert.equal(formatPluralMessage(1, ukEventCount, 'uk-UA'), '1 подія');
  assert.equal(formatPluralMessage(2, ukEventCount, 'uk-UA'), '2 події');
  assert.equal(formatPluralMessage(5, ukEventCount, 'uk-UA'), '5 подій');
  assert.equal(formatPluralMessage(21, ukEventCount, 'uk-UA'), '21 подія');
});

test('German event count pluralization', () => {
  assert.equal(formatPluralMessage(0, deEventCount, 'de-DE'), '0 Ereignisse');
  assert.equal(formatPluralMessage(1, deEventCount, 'de-DE'), '1 Ereignis');
  assert.equal(formatPluralMessage(2, deEventCount, 'de-DE'), '2 Ereignisse');
});

test('resolvePluralCategory uses Intl plural rules', () => {
  assert.equal(resolvePluralCategory(1, 'en-GB'), 'one');
  assert.equal(resolvePluralCategory(2, 'en-GB'), 'other');
  assert.equal(resolvePluralCategory(2, 'ru-RU'), 'few');
  assert.equal(resolvePluralCategory(5, 'ru-RU'), 'many');
});
