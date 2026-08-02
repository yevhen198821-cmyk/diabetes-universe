import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CANONICAL_TRANSLATION_KEYS,
  englishCanonicalMessages,
} from '../../../../packages/locales/src/index.ts';

import { dashboardHeaderTranslationKeys } from './dashboard-header-labels.ts';

const DASHBOARD_HEADER_KEYS = Object.values(dashboardHeaderTranslationKeys);

test('dashboard header translation keys are canonical and non-empty in English resources', () => {
  for (const key of DASHBOARD_HEADER_KEYS) {
    assert.equal(CANONICAL_TRANSLATION_KEYS.includes(key), true);
    assert.equal(typeof englishCanonicalMessages[key], 'string');
    assert.equal(englishCanonicalMessages[key].trim().length > 0, true);
  }
});

test('dashboard header keys stay hierarchical under dashboard namespace', () => {
  for (const key of DASHBOARD_HEADER_KEYS) {
    assert.match(key, /^dashboard\.header\./);
  }
});
