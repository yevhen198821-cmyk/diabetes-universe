import assert from 'node:assert/strict';
import test from 'node:test';

import { createNoteTimelineEvent } from './create-note-timeline-event.ts';

test('createNoteTimelineEvent maps quick add entry to timeline event', () => {
  const event = createNoteTimelineEvent({
    text: 'Чувствую усталость после обеда',
    time: '14:15',
    title: 'Самочувствие',
  });

  assert.equal(event.kind, 'note');
  assert.equal(event.title, 'Самочувствие');
  assert.equal(event.value, 'Чувствую усталость после обеда');
  assert.equal(event.source, 'manual');
  assert.match(event.dateTime, /T14:15:00/);
});
