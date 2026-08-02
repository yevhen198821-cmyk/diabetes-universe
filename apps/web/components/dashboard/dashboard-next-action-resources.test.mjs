import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CANONICAL_TRANSLATION_KEYS,
  englishCanonicalMessages,
} from '../../../../packages/locales/src/index.ts';

import { dashboardNextActionTranslationKeys } from './dashboard-next-action-labels.ts';

const DASHBOARD_NEXT_ACTION_KEYS = Object.values(
  dashboardNextActionTranslationKeys,
);

test('dashboard next action translation keys are canonical and non-empty in English resources', () => {
  for (const key of DASHBOARD_NEXT_ACTION_KEYS) {
    assert.equal(CANONICAL_TRANSLATION_KEYS.includes(key), true);
    assert.equal(typeof englishCanonicalMessages[key], 'string');
    assert.equal(englishCanonicalMessages[key].trim().length > 0, true);
  }
});

test('dashboard next action keys stay hierarchical under dashboard namespace', () => {
  for (const key of DASHBOARD_NEXT_ACTION_KEYS) {
    assert.match(key, /^dashboard\.nextAction\./);
  }
});

test('dashboard next action keys do not duplicate dashboard header keys', () => {
  const headerPrefix = 'dashboard.header.';
  const duplicates = DASHBOARD_NEXT_ACTION_KEYS.filter((key) =>
    key.startsWith(headerPrefix),
  );

  assert.equal(duplicates.length, 0);
});
