import assert from 'node:assert/strict';
import test from 'node:test';

import { createTestTimelineInsulinEditCopy } from './testing/create-test-timeline-insulin-edit-copy.ts';
import {
  createTimelineSemanticEventEditDraft,
  updateTimelineEventFromDraft,
} from './timeline-event-detail-model.ts';

const now = new Date('2026-08-03T09:00:00.000Z');

const semanticInsulin = {
  administrationContext: 'before_meal',
  createdAt: '2026-08-02T05:00:00.000Z',
  doseUnits: 4,
  id: 'insulin-semantic',
  kind: 'insulin',
  occurredAt: '2026-08-02T05:05:00.000Z',
  preparation: 'NovoRapid',
  preparationId: 'insulin.prep.aspart_novorapid',
  provenance: { capturedBy: 'demo-fixture' },
  schemaVersion: 1,
  source: 'manual',
  updatedAt: '2026-08-02T05:05:00.000Z',
};

const legacyInsulin = {
  context: 'Перед завтраком',
  createdAt: '2026-08-02T05:00:00.000Z',
  doseUnits: 4,
  id: 'insulin-legacy',
  kind: 'insulin',
  occurredAt: '2026-08-02T05:05:00.000Z',
  preparation: 'NovoRapid',
  schemaVersion: 1,
  source: 'manual',
  updatedAt: '2026-08-02T05:05:00.000Z',
};

const governedLegacyInsulin = { ...legacyInsulin, context: 'Перед едой' };

const noContextInsulin = {
  createdAt: '2026-08-02T05:00:00.000Z',
  doseUnits: 4,
  id: 'insulin-no-context',
  kind: 'insulin',
  occurredAt: '2026-08-02T23:00:00.000Z',
  preparation: 'Lantus',
  schemaVersion: 1,
  source: 'manual',
  updatedAt: '2026-08-02T05:05:00.000Z',
};

const runtimeUnknownPreparationInsulin = {
  ...semanticInsulin,
  id: 'insulin-runtime-unknown-prep',
  preparationId: 'insulin.prep.not_in_catalogue',
};

let copy;

test.before(async () => {
  copy = await createTestTimelineInsulinEditCopy();
});

function save(event, insulinOverrides = {}, draftOverrides = {}) {
  const draft = createTimelineSemanticEventEditDraft(event);

  return updateTimelineEventFromDraft({
    copy,
    draft: {
      ...draft,
      ...draftOverrides,
      insulin: { ...draft.insulin, ...insulinOverrides },
    },
    event,
    now,
  });
}

test('insulin edit draft is insulin-specific and carries no generic title string', () => {
  const draft = createTimelineSemanticEventEditDraft(semanticInsulin);

  assert.equal(draft.variant, 'insulin');
  assert.equal('title' in draft, false);
  assert.equal('value' in draft, false);
  assert.equal('context' in draft, false);
  assert.equal(draft.insulin.preparationId, 'insulin.prep.aspart_novorapid');
  assert.equal(draft.insulin.dose, '4');
  assert.equal(draft.insulin.administrationContext, 'before_meal');
});

test('legacy insulin draft exposes the recorded snapshot and text as read-only chrome', () => {
  const draft = createTimelineSemanticEventEditDraft(legacyInsulin);

  assert.equal(draft.storedPreparation, 'NovoRapid');
  assert.equal(draft.storedPreparationIsUnmatched, true);
  assert.equal(draft.legacyContextText, 'Перед завтраком');
  assert.equal(draft.insulin.preparationId, null);
  assert.equal(draft.insulin.administrationContext, null);
});

test('changing preparation updates identity and snapshot in the same save', () => {
  const result = save(semanticInsulin, {
    preparationId: 'insulin.prep.degludec_tresiba',
  });

  assert.deepEqual(result.errors, {});
  assert.equal(result.event.preparationId, 'insulin.prep.degludec_tresiba');
  assert.equal(result.event.preparation, 'Tresiba');
});

test('selecting Other stores the user-entered name as the snapshot', () => {
  const result = save(semanticInsulin, {
    otherName: 'Pharmacy own-brand insulin',
    preparationId: 'insulin.prep.other',
  });

  assert.equal(result.event.preparationId, 'insulin.prep.other');
  assert.equal(result.event.preparation, 'Pharmacy own-brand insulin');
});

test('a blank Other name keeps the dialog open with a localized error', () => {
  const result = save(semanticInsulin, {
    otherName: '   ',
    preparationId: 'insulin.prep.other',
  });

  assert.equal(result.event, null);
  assert.equal(result.errors.otherName, 'Enter the preparation name.');
});

test('an out-of-bound dose keeps the dialog open with technical validation copy', () => {
  const result = save(semanticInsulin, { dose: '101' });

  assert.equal(result.event, null);
  assert.equal(
    result.errors.dose,
    'Enter a dose greater than 0 and no more than 100.',
  );
  assert.equal(
    /safe|recommend|maximum recommended/i.test(result.errors.dose),
    false,
  );
});

test('a legacy dose-only edit preserves the snapshot and never adds an id', () => {
  const result = save(legacyInsulin, { dose: '6' });

  assert.equal(result.event.doseUnits, 6);
  assert.equal(result.event.preparation, 'NovoRapid');
  assert.equal('preparationId' in result.event, false);
  assert.equal(result.event.context, 'Перед завтраком');
  assert.equal('administrationContext' in result.event, false);
});

test('a dose-only edit on a no-context event omits both context fields', () => {
  const result = save(noContextInsulin, { dose: '6' });

  assert.equal(result.event.doseUnits, 6);
  assert.equal(result.event.preparation, 'Lantus');
  assert.equal('preparationId' in result.event, false);
  assert.equal('context' in result.event, false);
  assert.equal('administrationContext' in result.event, false);
});

test('an explicit unspecified choice on a no-context event persists the semantic value', () => {
  const result = save(noContextInsulin, {
    administrationContext: 'unspecified',
    contextEdited: true,
  });

  assert.equal(result.event.administrationContext, 'unspecified');
  assert.equal('context' in result.event, false);
});

test('a dose-only edit removes a runtime-unknown preparationId without changing the snapshot', () => {
  const result = save(runtimeUnknownPreparationInsulin, { dose: '6' });

  assert.equal(result.event.doseUnits, 6);
  assert.equal(result.event.preparation, 'NovoRapid');
  assert.equal('preparationId' in result.event, false);
  assert.equal(result.event.administrationContext, 'before_meal');
  assert.equal(result.event.id, runtimeUnknownPreparationInsulin.id);
  assert.equal(result.event.kind, 'insulin');
  assert.equal(result.event.source, runtimeUnknownPreparationInsulin.source);
  assert.equal(
    result.event.createdAt,
    runtimeUnknownPreparationInsulin.createdAt,
  );
  assert.equal(result.event.schemaVersion, 1);
  assert.deepEqual(
    result.event.provenance,
    runtimeUnknownPreparationInsulin.provenance,
  );
});

test('a semantic context change writes the semantic value and removes legacy context', () => {
  const result = save(legacyInsulin, {
    administrationContext: 'correction',
    contextEdited: true,
  });

  assert.equal(result.event.administrationContext, 'correction');
  assert.equal('context' in result.event, false);
});

test('a governed legacy context is not converted by a dose-only save', () => {
  const result = save(governedLegacyInsulin, { dose: '5' });

  assert.equal(result.event.context, 'Перед едой');
  assert.equal('administrationContext' in result.event, false);
});

test('a dose-only edit preserves existing semantic preparation and context fields', () => {
  const result = save(semanticInsulin, { dose: '9' });

  assert.equal(result.event.doseUnits, 9);
  assert.equal(result.event.preparationId, 'insulin.prep.aspart_novorapid');
  assert.equal(result.event.preparation, 'NovoRapid');
  assert.equal(result.event.administrationContext, 'before_meal');
});

test('immutable envelope fields are preserved and updatedAt advances', () => {
  const result = save(semanticInsulin, { dose: '9' });

  assert.equal(result.event.id, semanticInsulin.id);
  assert.equal(result.event.kind, 'insulin');
  assert.equal(result.event.source, semanticInsulin.source);
  assert.equal(result.event.createdAt, semanticInsulin.createdAt);
  assert.equal(result.event.schemaVersion, 1);
  assert.deepEqual(result.event.provenance, semanticInsulin.provenance);
  assert.equal(result.event.occurredAt, semanticInsulin.occurredAt);
  assert.equal(result.event.updatedAt, now.toISOString());
});

test('occurredAt changes only through the date and time edit contract', () => {
  const result = save(semanticInsulin, {}, { time: '23:45' });

  assert.notEqual(result.event.occurredAt, semanticInsulin.occurredAt);
  assert.equal(result.event.occurredAt.endsWith('Z'), true);
  assert.equal(result.event.doseUnits, semanticInsulin.doseUnits);
  assert.equal(result.event.preparationId, semanticInsulin.preparationId);
});

test('a blank date keeps the dialog open without touching the event', () => {
  const result = save(semanticInsulin, {}, { date: '' });

  assert.equal(result.event, null);
  assert.ok(result.errors.date);
});

test('a semantic save never emits an explicit undefined legacy context key', () => {
  const result = save(semanticInsulin, {
    administrationContext: 'basal',
    contextEdited: true,
  });

  assert.equal(Object.hasOwn(result.event, 'context'), false);
  assert.equal(
    JSON.stringify(Object.keys(result.event).sort()),
    JSON.stringify(
      [
        'administrationContext',
        'createdAt',
        'doseUnits',
        'id',
        'kind',
        'occurredAt',
        'preparation',
        'preparationId',
        'provenance',
        'schemaVersion',
        'source',
        'updatedAt',
      ].sort(),
    ),
  );
});

test('a variant mismatch cannot silently write an insulin event', () => {
  const result = updateTimelineEventFromDraft({
    copy,
    draft: {
      context: 'Перед едой',
      date: '2026-08-02',
      note: '',
      time: '08:05',
      title: 'Lantus',
      unit: '',
      value: '4',
      variant: 'generic',
    },
    event: semanticInsulin,
    now,
  });

  assert.equal(result.event, null);
});
