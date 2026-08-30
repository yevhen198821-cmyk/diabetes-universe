import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  INSULIN_ADMINISTRATION_CONTEXTS,
  INSULIN_PREPARATION_IDS,
} from '@diabetes-universe/medical-domain';

import { createTestPlatformRuntime } from '../../platform/react/testing/create-test-platform-runtime.ts';
import { resolveTimelineUiLabels } from '../../../components/timeline/timeline-ui-labels.ts';
import { resolveInsulinPresentationLabels } from './insulin-presentation-labels.ts';

const CYRILLIC_PATTERN = /[\u0400-\u04ff]/;

const LOCALES = [
  ['en-GB', 'Europe/London'],
  ['ru-RU', 'Europe/Moscow'],
  ['uk-UA', 'Europe/Kyiv'],
  ['de-DE', 'Europe/Berlin'],
];

const BRAND_PREPARATION_IDS = INSULIN_PREPARATION_IDS.filter(
  (preparationId) => preparationId !== 'insulin.prep.other',
);

async function resolveLocaleChrome(acceptLanguage, cookieTimeZone) {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage, cookieTimeZone },
  });

  return {
    edit: resolveTimelineUiLabels(runtime.localization).detail.form.insulin,
    presentation: resolveInsulinPresentationLabels(runtime.localization),
  };
}

test('every supported locale resolves the full insulin chrome to non-empty strings', async () => {
  for (const [acceptLanguage, timeZone] of LOCALES) {
    const chrome = await resolveLocaleChrome(acceptLanguage, timeZone);
    const values = [
      ...Object.values(chrome.presentation.contexts),
      ...Object.values(chrome.presentation.groupings),
      ...Object.values(chrome.presentation.preparations),
      chrome.edit.contextLabel,
      chrome.edit.doseLabel,
      chrome.edit.errors.doseRange,
      chrome.edit.errors.otherNameRequired,
      chrome.edit.keepRecordedContext,
      chrome.edit.keepRecordedPreparation,
      chrome.edit.legacyContextHint,
      chrome.edit.legacyPreparationHint,
      chrome.edit.otherNameLabel,
      chrome.edit.preparationLabel,
    ];

    for (const value of values) {
      assert.equal(
        typeof value,
        'string',
        `${acceptLanguage} resolves strings`,
      );
      assert.ok(value.length > 0, `${acceptLanguage}: "${value}" is non-empty`);
      assert.equal(
        value.startsWith('timeline.'),
        false,
        `${acceptLanguage} does not leak a raw key: ${value}`,
      );
    }

    assert.equal(
      Object.keys(chrome.presentation.contexts).length,
      INSULIN_ADMINISTRATION_CONTEXTS.length,
    );
    assert.equal(
      Object.keys(chrome.presentation.preparations).length,
      INSULIN_PREPARATION_IDS.length,
    );
  }
});

test('administration context labels are distinct within every locale', async () => {
  for (const [acceptLanguage, timeZone] of LOCALES) {
    const { presentation } = await resolveLocaleChrome(
      acceptLanguage,
      timeZone,
    );
    const labels = Object.values(presentation.contexts);

    assert.equal(
      new Set(labels).size,
      labels.length,
      `${acceptLanguage} context labels are unique`,
    );
  }
});

test('non-English locales localize insulin chrome instead of falling back to English', async () => {
  const english = await resolveLocaleChrome('en-GB', 'Europe/London');

  for (const [acceptLanguage, timeZone] of LOCALES.slice(1)) {
    const chrome = await resolveLocaleChrome(acceptLanguage, timeZone);

    for (const grouping of ['rapid_acting', 'long_acting', 'unspecified']) {
      assert.notEqual(
        chrome.presentation.groupings[grouping],
        english.presentation.groupings[grouping],
        `${acceptLanguage} localizes the ${grouping} grouping`,
      );
    }

    for (const field of [
      'contextLabel',
      'doseLabel',
      'otherNameLabel',
      'preparationLabel',
      'keepRecordedContext',
      'keepRecordedPreparation',
      'legacyContextHint',
      'legacyPreparationHint',
    ]) {
      assert.notEqual(
        chrome.edit[field],
        english.edit[field],
        `${acceptLanguage} localizes edit chrome ${field}`,
      );
    }

    for (const field of ['doseRange', 'otherNameRequired']) {
      assert.notEqual(
        chrome.edit.errors[field],
        english.edit.errors[field],
        `${acceptLanguage} localizes error copy ${field}`,
      );
    }
  }
});

test('trade-name catalogue labels stay identical across locales', async () => {
  const english = await resolveLocaleChrome('en-GB', 'Europe/London');

  for (const [acceptLanguage, timeZone] of LOCALES.slice(1)) {
    const chrome = await resolveLocaleChrome(acceptLanguage, timeZone);

    for (const preparationId of BRAND_PREPARATION_IDS) {
      assert.equal(
        chrome.presentation.preparations[preparationId],
        english.presentation.preparations[preparationId],
        `${preparationId} is a trade-name snapshot, not chrome`,
      );
    }

    assert.notEqual(
      chrome.presentation.preparations['insulin.prep.other'],
      english.presentation.preparations['insulin.prep.other'],
      `${acceptLanguage} localizes the Other picker label`,
    );
  }
});

test('English and German insulin chrome contain no Cyrillic text', async () => {
  for (const [acceptLanguage, timeZone] of [
    ['en-GB', 'Europe/London'],
    ['de-DE', 'Europe/Berlin'],
  ]) {
    const chrome = await resolveLocaleChrome(acceptLanguage, timeZone);
    const values = [
      ...Object.values(chrome.presentation.contexts),
      ...Object.values(chrome.presentation.groupings),
      ...Object.values(chrome.presentation.preparations),
      ...Object.values(chrome.edit.errors),
      chrome.edit.contextLabel,
      chrome.edit.doseLabel,
      chrome.edit.keepRecordedContext,
      chrome.edit.keepRecordedPreparation,
      chrome.edit.legacyContextHint,
      chrome.edit.legacyPreparationHint,
      chrome.edit.otherNameLabel,
      chrome.edit.preparationLabel,
    ];

    for (const value of values) {
      assert.equal(
        CYRILLIC_PATTERN.test(value),
        false,
        `${acceptLanguage} chrome "${value}" has no Cyrillic`,
      );
    }
  }
});

test('insulin presentation and edit modules hardcode no Russian labels', () => {
  const modules = [
    new URL('./insulin-edit-options.ts', import.meta.url),
    new URL('./insulin-presentation-labels.ts', import.meta.url),
    new URL('./present-insulin-from-timeline-event.ts', import.meta.url),
    new URL('./resolve-insulin-edit-transition.ts', import.meta.url),
    new URL(
      '../../../components/timeline/timeline-insulin-edit-copy.ts',
      import.meta.url,
    ),
    new URL(
      '../../../components/timeline/timeline-insulin-edit-fields.tsx',
      import.meta.url,
    ),
  ];

  for (const moduleUrl of modules) {
    const source = readFileSync(moduleUrl, 'utf8');

    assert.equal(
      CYRILLIC_PATTERN.test(source),
      false,
      `${moduleUrl.pathname} has no hardcoded Cyrillic label`,
    );
  }
});

test('insulin copy avoids dosing-advice vocabulary in every locale', async () => {
  const forbidden = [
    /safe dose/i,
    /recommended dose/i,
    /calculat/i,
    /insulin on board/i,
    /\bIOB\b/,
    /therapy plan/i,
    /безопасн/i,
    /рекоменд/i,
    /терапи/i,
    /empfohlen/i,
    /sicher/i,
  ];

  for (const [acceptLanguage, timeZone] of LOCALES) {
    const chrome = await resolveLocaleChrome(acceptLanguage, timeZone);
    const copy = [
      ...Object.values(chrome.presentation.contexts),
      ...Object.values(chrome.presentation.groupings),
      ...Object.values(chrome.edit.errors),
      chrome.edit.contextLabel,
      chrome.edit.doseLabel,
      chrome.edit.legacyContextHint,
      chrome.edit.legacyPreparationHint,
      chrome.edit.otherNameLabel,
      chrome.edit.preparationLabel,
    ].join(' | ');

    for (const pattern of forbidden) {
      assert.equal(
        pattern.test(copy),
        false,
        `${acceptLanguage} copy avoids ${pattern}`,
      );
    }
  }
});
