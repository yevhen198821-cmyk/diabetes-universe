import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createTimelineEventDetailModel,
  createTimelineEventEditDraft,
  updateTimelineEventFromDraft,
} from './timeline-event-detail-model.ts';

const baseEvent = {
  createdAt: '2026-08-02T07:00:00.000Z',
  dateTime: '2026-08-02T08:00:00.000Z',
  id: 'event-1',
  kind: 'glucose',
  source: 'manual',
  title: 'Глюкоза',
  value: '6,4 ммоль/л',
};
const now = new Date('2026-08-02T12:00:00.000Z');

test('creates detail model for all six kinds', () => {
  const cases = [
    ['glucose', 'Глюкоза'],
    ['insulin', 'Инсулин'],
    ['nutrition', 'Питание'],
    ['medication', 'Лекарство'],
    ['activity', 'Активность'],
    ['note', 'Заметка'],
  ];

  for (const [kind, label] of cases) {
    const model = createTimelineEventDetailModel({
      ...baseEvent,
      kind,
      title: label,
      value: kind === 'note' ? 'Текст заметки' : '10',
    });

    assert.equal(model.kindLabel, label);
    assert.equal(model.canEdit, true);
    assert.equal(model.canDelete, true);
  }
});

test('creates optional rows and source labels', () => {
  const model = createTimelineEventDetailModel({
    ...baseEvent,
    context: 'После еды',
    note: 'Без сахара',
    source: 'demo',
  });

  assert.equal(model.sourceLabel, 'Демо-данные');
  assert.deepEqual(
    model.rows.map((row) => row.label),
    ['Дата', 'Время', 'Контекст', 'Заметка', 'Источник'],
  );
});

test('note event displays note text as primary content', () => {
  const model = createTimelineEventDetailModel({
    ...baseEvent,
    kind: 'note',
    title: 'Самочувствие',
    value: 'Чувствую усталость',
  });

  assert.equal(model.primaryText, 'Чувствую усталость');
  assert.equal(model.kindLabel, 'Заметка');
});

test('invalid dateTime has safe detail fallback', () => {
  const model = createTimelineEventDetailModel({
    ...baseEvent,
    dateTime: 'invalid',
  });

  assert.equal(model.date, 'Дата неизвестна');
  assert.equal(model.time, '--:--');
});

test('creates edit draft from event without mutating it', () => {
  const event = {
    ...baseEvent,
    context: 'Перед завтраком',
    note: 'Повторить',
  };
  const draft = createTimelineEventEditDraft(event);

  assert.equal(draft.value, '6,4');
  assert.equal(draft.unit, 'ммоль/л');
  assert.equal(draft.context, 'Перед завтраком');
  assert.equal(event.value, '6,4 ммоль/л');
});

test('updates event while preserving id kind source and createdAt', () => {
  const draft = {
    ...createTimelineEventEditDraft(baseEvent),
    time: '23:59',
    value: '8.8',
  };
  const result = updateTimelineEventFromDraft(baseEvent, draft, now);

  assert.deepEqual(result.errors, {});
  assert.equal(result.event?.id, baseEvent.id);
  assert.equal(result.event?.kind, baseEvent.kind);
  assert.equal(result.event?.source, baseEvent.source);
  assert.equal(result.event?.createdAt, baseEvent.createdAt);
  assert.equal(result.event?.updatedAt, now.toISOString());
  assert.equal(result.event?.value, '8,8 ммоль/л');
});

test('validates glucose, insulin, nutrition, and medication ranges', () => {
  const cases = [
    [{ ...baseEvent, kind: 'glucose' }, '41'],
    [{ ...baseEvent, kind: 'insulin', value: '4 ЕД' }, '101'],
    [{ ...baseEvent, kind: 'nutrition', value: '42 г углеводов' }, '501'],
    [{ ...baseEvent, kind: 'medication', unit: 'мг', value: '400' }, '100001'],
  ];

  for (const [event, value] of cases) {
    const result = updateTimelineEventFromDraft(
      event,
      {
        ...createTimelineEventEditDraft(event),
        value,
      },
      now,
    );

    assert.equal(result.event, null);
    assert.ok(result.errors.value);
  }
});

test('requires medication unit', () => {
  const event = {
    ...baseEvent,
    kind: 'medication',
    unit: 'мг',
    value: '400',
  };
  const result = updateTimelineEventFromDraft(
    event,
    {
      ...createTimelineEventEditDraft(event),
      unit: '',
    },
    now,
  );

  assert.equal(result.event, null);
  assert.equal(result.errors.unit, 'Укажите единицу лекарства.');
});

test('validates note text and max length', () => {
  const event = {
    ...baseEvent,
    kind: 'note',
    title: 'Самочувствие',
    value: 'Текст',
  };

  assert.ok(
    updateTimelineEventFromDraft(
      event,
      { ...createTimelineEventEditDraft(event), value: '' },
      now,
    ).errors.value,
  );
  assert.ok(
    updateTimelineEventFromDraft(
      event,
      { ...createTimelineEventEditDraft(event), value: 'a'.repeat(501) },
      now,
    ).errors.value,
  );
});

test('keeps activity value free-form while requiring title and value', () => {
  const event = {
    ...baseEvent,
    kind: 'activity',
    title: 'Прогулка',
    unit: 'минут',
    value: '30',
  };
  const result = updateTimelineEventFromDraft(
    event,
    {
      ...createTimelineEventEditDraft(event),
      title: '',
      value: '',
    },
    now,
  );

  assert.ok(result.errors.title);
  assert.ok(result.errors.value);
});

test('rejects invalid date and time', () => {
  const result = updateTimelineEventFromDraft(
    baseEvent,
    {
      ...createTimelineEventEditDraft(baseEvent),
      date: '2026-02-31',
      time: '25:99',
    },
    now,
  );

  assert.equal(result.event, null);
  assert.ok(result.errors.date);
  assert.ok(result.errors.time);
});
