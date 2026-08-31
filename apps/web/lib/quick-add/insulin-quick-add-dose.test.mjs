import assert from 'node:assert/strict';
import test from 'node:test';

import {
  INSULIN_QUICK_ADD_MANUAL_DOSE_MAXIMUM_FRACTION_DIGITS,
  INSULIN_QUICK_ADD_UI_DOSE_MAXIMUM,
  parseInsulinQuickAddDoseInput,
} from './insulin-quick-add-dose.ts';

test('manual dose parser accepts integers, one and two fractional digits, dot and comma', () => {
  const expected = [
    ['4', 4],
    ['4.5', 4.5],
    ['4,5', 4.5],
    ['12.25', 12.25],
    ['12,25', 12.25],
    ['0.01', 0.01],
    ['  8  ', 8],
    ['100', 100],
  ];

  for (const [raw, value] of expected) {
    assert.equal(
      parseInsulinQuickAddDoseInput(raw),
      value,
      `"${raw}" parses to ${value}`,
    );
  }
});

test('manual dose parser preserves two-decimal precision without rounding', () => {
  const parsed = parseInsulinQuickAddDoseInput('12.25');

  assert.equal(parsed, 12.25);
  assert.equal(Object.is(parsed, 12.25), true);
  assert.equal(String(parsed), '12.25');
  assert.equal(parseInsulinQuickAddDoseInput('12,25'), 12.25);
});

test('manual dose parser rejects empty, zero, negative, and out-of-bound values', () => {
  for (const raw of [
    '',
    '   ',
    '0',
    '0.00',
    '-1',
    '-0.5',
    '101',
    '100.01',
    '500',
  ]) {
    assert.equal(
      parseInsulinQuickAddDoseInput(raw),
      null,
      `"${raw}" is rejected`,
    );
  }
});

test('manual dose parser rejects non-finite and non-numeric input', () => {
  for (const raw of [
    'NaN',
    'Infinity',
    '-Infinity',
    '1e3',
    'abc',
    '4U',
    '4 ЕД',
  ]) {
    assert.equal(
      parseInsulinQuickAddDoseInput(raw),
      null,
      `"${raw}" is rejected`,
    );
  }
});

test('manual dose parser rejects more than two fractional digits', () => {
  assert.equal(INSULIN_QUICK_ADD_MANUAL_DOSE_MAXIMUM_FRACTION_DIGITS, 2);

  for (const raw of ['4.125', '12.250', '2,125', '0.001']) {
    assert.equal(
      parseInsulinQuickAddDoseInput(raw),
      null,
      `"${raw}" exceeds the manual precision policy`,
    );
  }
});

test('manual dose parser rejects malformed separators', () => {
  for (const raw of [
    '.5',
    ',5',
    '4.',
    '4,',
    '4.5.6',
    '4,5,6',
    '4.,5',
    '1 000',
    '1,000.5',
    '+4',
  ]) {
    assert.equal(
      parseInsulinQuickAddDoseInput(raw),
      null,
      `"${raw}" is rejected`,
    );
  }
});

test('the manual UI ceiling is typo protection and stays below the canonical bound', () => {
  assert.equal(INSULIN_QUICK_ADD_UI_DOSE_MAXIMUM, 100);
  assert.equal(parseInsulinQuickAddDoseInput('100'), 100);
  assert.equal(parseInsulinQuickAddDoseInput('100.01'), null);
});
