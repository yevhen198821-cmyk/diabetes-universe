import assert from 'node:assert/strict';
import test from 'node:test';

import { createTestPlatformRuntime } from '../../platform/react/testing/create-test-platform-runtime.ts';
import { resolveInsulinPresentationLabels } from './insulin-presentation-labels.ts';
import { presentInsulinFromTimelineEvent } from './present-insulin-from-timeline-event.ts';

const envelope = {
  createdAt: '2026-08-02T05:05:00.000Z',
  id: 'insulin-1',
  kind: 'insulin',
  occurredAt: '2026-08-02T05:05:00.000Z',
  schemaVersion: 1,
  source: 'manual',
  updatedAt: '2026-08-02T05:05:00.000Z',
};

async function createPresenter(request) {
  const runtime = await createTestPlatformRuntime(
    request ? { request } : undefined,
  );
  const labels = resolveInsulinPresentationLabels(runtime.localization);

  return (event) =>
    presentInsulinFromTimelineEvent({
      event: { ...envelope, ...event },
      formatter: runtime.formatter,
      insulinKindLabel: 'Insulin',
      labels,
      unitLabel: 'U',
    });
}

const russianRequest = {
  acceptLanguage: 'ru-RU',
  cookieTimeZone: 'Europe/Moscow',
};

test('semantic administration context is localized and wins over a contradictory legacy context', async () => {
  const present = await createPresenter();
  const presentation = present({
    administrationContext: 'correction',
    context: 'Перед едой',
    doseUnits: 4,
    preparation: 'NovoRapid',
    preparationId: 'insulin.prep.aspart_novorapid',
  });

  assert.equal(presentation.context, 'Correction');
  assert.equal(presentation.contextSource, 'semantic');
  assert.equal(presentation.administrationContext, 'correction');
});

test('exact legacy Russian context mapping resolves through the current locale', async () => {
  const englishPresent = await createPresenter();
  const russianPresent = await createPresenter(russianRequest);
  const legacyEvent = {
    context: 'Перед едой',
    doseUnits: 4,
    preparation: 'NovoRapid',
  };

  const english = englishPresent(legacyEvent);
  const russian = russianPresent(legacyEvent);

  assert.equal(english.context, 'Before meal');
  assert.equal(english.contextSource, 'legacy_mapped');
  assert.equal(english.administrationContext, 'before_meal');
  assert.equal(russian.context, 'Перед едой');
  assert.equal(russian.contextSource, 'legacy_mapped');
});

test('every governed legacy context string maps to a localized semantic label', async () => {
  const present = await createPresenter();
  const expected = [
    ['Перед едой', 'Before meal'],
    ['После еды', 'After meal'],
    ['Коррекция', 'Correction'],
    ['Базальный', 'Basal'],
    ['Другое', 'Other'],
  ];

  for (const [stored, label] of expected) {
    const presentation = present({
      context: stored,
      doseUnits: 4,
      preparation: 'NovoRapid',
    });

    assert.equal(presentation.context, label);
    assert.equal(presentation.contextSource, 'legacy_mapped');
  }
});

test('unmatched legacy context displays the original stored string', async () => {
  const present = await createPresenter();
  const presentation = present({
    context: 'Перед завтраком',
    doseUnits: 4,
    preparation: 'NovoRapid',
  });

  assert.equal(presentation.context, 'Перед завтраком');
  assert.equal(presentation.contextSource, 'legacy_raw');
  assert.equal(presentation.administrationContext, null);
});

test('partial and differently cased legacy context strings are not silently mapped', async () => {
  const present = await createPresenter();

  for (const stored of ['перед едой', 'Перед', 'ПЕРЕД ЕДОЙ', ' Перед едой']) {
    const presentation = present({
      context: stored,
      doseUnits: 4,
      preparation: 'NovoRapid',
    });

    assert.equal(presentation.context, stored);
    assert.equal(presentation.contextSource, 'legacy_raw');
  }
});

test('missing context displays the localized unspecified label', async () => {
  const present = await createPresenter();
  const presentation = present({ doseUnits: 4, preparation: 'NovoRapid' });

  assert.equal(presentation.context, 'Not specified');
  assert.equal(presentation.contextSource, 'unspecified');
  assert.equal(presentation.administrationContext, null);
});

test('blank legacy context falls back to the localized unspecified label', async () => {
  const present = await createPresenter();
  const presentation = present({
    context: '   ',
    doseUnits: 4,
    preparation: 'NovoRapid',
  });

  assert.equal(presentation.contextSource, 'unspecified');
  assert.equal(presentation.context, 'Not specified');
});

test('a runtime-invalid administration context falls back to readable legacy text', async () => {
  const present = await createPresenter();
  const presentation = present({
    administrationContext: 'not_a_context',
    context: 'Перед завтраком',
    doseUnits: 4,
    preparation: 'NovoRapid',
  });

  assert.equal(presentation.context, 'Перед завтраком');
  assert.equal(presentation.contextSource, 'legacy_raw');
});

test('title remains the stored preparation snapshot regardless of catalogue labels', async () => {
  const present = await createPresenter();
  const renamedSnapshot = present({
    doseUnits: 4,
    preparation: 'НовоРапид',
    preparationId: 'insulin.prep.aspart_novorapid',
  });
  const otherSnapshot = present({
    doseUnits: 2,
    preparation: 'Pharmacy own-brand insulin',
    preparationId: 'insulin.prep.other',
  });

  assert.equal(renamedSnapshot.title, 'НовоРапид');
  assert.equal(otherSnapshot.title, 'Pharmacy own-brand insulin');
});

test('missing preparation identity remains unmatched without creating a fake id', async () => {
  const present = await createPresenter();
  const presentation = present({
    doseUnits: 4,
    preparation: 'NovoRapid',
  });

  assert.equal(presentation.isUnmatchedPreparation, true);
  assert.equal(presentation.preparationId, null);
  assert.equal(presentation.grouping, 'unspecified');
  assert.equal(presentation.groupingLabel, 'Other insulin');
  assert.equal(
    JSON.stringify(presentation).includes('insulin.prep.unmapped'),
    false,
  );
});

test('an unknown runtime preparation id is treated as unmatched', async () => {
  const present = await createPresenter();
  const presentation = present({
    doseUnits: 4,
    preparation: 'NovoRapid',
    preparationId: 'insulin.prep.not_in_catalogue',
  });

  assert.equal(presentation.isUnmatchedPreparation, true);
  assert.equal(presentation.preparationId, null);
  assert.equal(presentation.grouping, 'unspecified');
});

test('presentation grouping comes only from the catalogue identity', async () => {
  const present = await createPresenter();
  const expected = [
    ['insulin.prep.aspart_novorapid', 'rapid_acting', 'Rapid-acting insulin'],
    ['insulin.prep.aspart_fiasp', 'rapid_acting', 'Rapid-acting insulin'],
    ['insulin.prep.lispro_humalog', 'rapid_acting', 'Rapid-acting insulin'],
    ['insulin.prep.glulisine_apidra', 'rapid_acting', 'Rapid-acting insulin'],
    ['insulin.prep.glargine_lantus', 'long_acting', 'Long-acting insulin'],
    ['insulin.prep.degludec_tresiba', 'long_acting', 'Long-acting insulin'],
    ['insulin.prep.other', 'unspecified', 'Other insulin'],
  ];

  for (const [preparationId, grouping, groupingLabel] of expected) {
    const presentation = present({
      doseUnits: 4,
      preparation: 'Recorded name',
      preparationId,
    });

    assert.equal(presentation.grouping, grouping);
    assert.equal(presentation.groupingLabel, groupingLabel);
  }
});

test('grouping is never inferred from the stored display snapshot', async () => {
  const present = await createPresenter();
  const presentation = present({
    doseUnits: 4,
    preparation: 'Lantus',
  });

  assert.equal(presentation.grouping, 'unspecified');
  assert.equal(presentation.preparationId, null);
});

test('search retains the stored snapshot and unmatched legacy text', async () => {
  const present = await createPresenter();
  const presentation = present({
    context: 'Перед завтраком',
    doseUnits: 4.5,
    preparation: 'НовоРапид',
  });

  assert.deepEqual(presentation.search.userContent, [
    'НовоРапид',
    '4.5',
    'Перед завтраком',
  ]);
  assert.equal(
    presentation.search.localizedLabels.includes('Перед завтраком'),
    false,
  );
  assert.equal(presentation.search.localizedLabels.includes('Insulin'), true);
  assert.equal(
    presentation.search.localizedLabels.includes('Other insulin'),
    true,
  );
});

test('search adds semantic labels without replacing user content', async () => {
  const present = await createPresenter();
  const presentation = present({
    administrationContext: 'basal',
    doseUnits: 12,
    preparation: 'Lantus',
    preparationId: 'insulin.prep.glargine_lantus',
  });

  assert.deepEqual(presentation.search.userContent, ['Lantus', '12', '']);
  assert.deepEqual(presentation.search.localizedLabels, [
    'Insulin',
    'U',
    'Basal',
    'Long-acting insulin',
  ]);
});

test('dose formatting does not round the stored value', async () => {
  const present = await createPresenter();

  assert.equal(present({ doseUnits: 4, preparation: 'X' }).value, '4');
  assert.equal(present({ doseUnits: 4.5, preparation: 'X' }).value, '4.5');
});
