import assert from 'node:assert/strict';
import test from 'node:test';

import { createNoteTimelineEvent } from './create-note-timeline-event.ts';
import { createTimelineSearchFilterModel } from '../../components/timeline/timeline-search-filter-model.ts';

test('createNoteTimelineEvent maps quick add entry to timeline event', () => {
  const event = createNoteTimelineEvent({
    text: 'Чувствую усталость после обеда',
    time: '14:15',
    title: 'Самочувствие',
  });

  assert.equal(event.kind, 'note');
  assert.equal(event.title, 'Самочувствие');
  assert.equal(event.value, 'Чувствую усталость после обеда');
  assert.equal(event.note, undefined);
  assert.equal(event.source, 'manual');
  assert.match(event.dateTime, /T14:15:00/);
});

test('createNoteTimelineEvent defaults title to Заметка', () => {
  const event = createNoteTimelineEvent({
    text: 'Короткая запись',
    time: '09:00',
  });

  assert.equal(event.title, 'Заметка');
});

test('note quick add events are searchable and filterable', () => {
  const event = createNoteTimelineEvent({
    text: 'Проверка поиска заметки',
    time: '10:00',
    title: 'Тест',
  });
  const model = createTimelineSearchFilterModel([event], {
    filter: 'note',
    query: 'поиска',
  });

  assert.equal(model.filteredEvents.length, 1);
  assert.equal(model.filteredEvents[0]?.id, event.id);
});
