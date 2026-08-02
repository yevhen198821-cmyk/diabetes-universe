import assert from 'node:assert/strict';
import test from 'node:test';

import {
  NOTE_TEXT_MAX_LENGTH,
  NOTE_TITLE_MAX_LENGTH,
  validateNoteQuickAddEntry,
} from './validate-note-quick-add.ts';

test('validateNoteQuickAddEntry accepts trimmed text and optional title', () => {
  assert.equal(
    validateNoteQuickAddEntry({
      text: '  Чувствую усталость  ',
      time: '14:00',
    }),
    null,
  );
  assert.equal(
    validateNoteQuickAddEntry({
      text: 'Запись',
      time: '14:00',
      title: 'Самочувствие',
    }),
    null,
  );
});

test('validateNoteQuickAddEntry rejects empty text', () => {
  assert.equal(
    validateNoteQuickAddEntry({
      text: '   ',
      time: '14:00',
    }),
    'Введите текст заметки',
  );
});

test('validateNoteQuickAddEntry enforces max lengths', () => {
  assert.equal(
    validateNoteQuickAddEntry({
      text: 'x'.repeat(NOTE_TEXT_MAX_LENGTH + 1),
      time: '14:00',
    }),
    'Заметка должна быть не длиннее 500 символов',
  );
  assert.equal(
    validateNoteQuickAddEntry({
      text: 'Запись',
      time: '14:00',
      title: 'x'.repeat(NOTE_TITLE_MAX_LENGTH + 1),
    }),
    'Заголовок должен быть не длиннее 80 символов',
  );
});
