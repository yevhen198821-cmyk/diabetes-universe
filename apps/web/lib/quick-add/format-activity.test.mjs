import assert from 'node:assert/strict';
import test from 'node:test';

import { quickAddActions } from './actions.ts';
import {
  ACTIVITY_DURATION_MAX_MINUTES,
  parseActivityDurationInput,
  validateActivityQuickAddEntry,
} from './format-activity.ts';

test('parseActivityDurationInput accepts whole minutes up to 1440', () => {
  assert.equal(parseActivityDurationInput('30'), 30);
  assert.equal(
    parseActivityDurationInput('1440'),
    ACTIVITY_DURATION_MAX_MINUTES,
  );
});

test('parseActivityDurationInput rejects zero, decimals, and overflow', () => {
  assert.equal(parseActivityDurationInput('0'), null);
  assert.equal(parseActivityDurationInput('1441'), null);
  assert.equal(parseActivityDurationInput('30.5'), null);
  assert.equal(parseActivityDurationInput(''), null);
});

test('validateActivityQuickAddEntry requires activity type and time', () => {
  assert.equal(
    validateActivityQuickAddEntry({
      activityType: '',
      durationMinutes: 30,
      time: '08:00',
    }),
    'Выберите вид активности',
  );
  assert.equal(
    validateActivityQuickAddEntry({
      activityType: 'Ходьба',
      durationMinutes: 30,
      time: '',
    }),
    'Укажите время',
  );
});

test('validateActivityQuickAddEntry rejects zero and overflow duration', () => {
  assert.equal(
    validateActivityQuickAddEntry({
      activityType: 'Ходьба',
      durationMinutes: 0,
      time: '08:00',
    }),
    'Введите продолжительность больше 0',
  );
  assert.equal(
    validateActivityQuickAddEntry({
      activityType: 'Ходьба',
      durationMinutes: 1441,
      time: '08:00',
    }),
    'Продолжительность не может быть больше 1440 минут',
  );
});

test('validateActivityQuickAddEntry enforces note max length', () => {
  assert.equal(
    validateActivityQuickAddEntry({
      activityType: 'Ходьба',
      durationMinutes: 30,
      note: 'x'.repeat(201),
      time: '08:00',
    }),
    'Заметка должна быть не длиннее 200 символов',
  );
});

test('quickAddActions exposes six categories in approved order', () => {
  assert.deepEqual(
    quickAddActions.map((action) => action.label),
    ['Глюкоза', 'Инсулин', 'Питание', 'Лекарство', 'Активность', 'Заметка'],
  );
  assert.deepEqual(
    quickAddActions.map((action) => action.addTitle),
    [
      'Добавить глюкозу',
      'Добавить инсулин',
      'Добавить питание',
      'Добавить лекарство',
      'Добавить активность',
      'Добавить заметку',
    ],
  );
  assert.equal(quickAddActions.length, 6);
});
