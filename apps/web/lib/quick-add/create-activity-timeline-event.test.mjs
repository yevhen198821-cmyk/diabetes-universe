import assert from 'node:assert/strict';
import test from 'node:test';

import { createActivityTimelineEvent } from './create-activity-timeline-event.ts';

test('createActivityTimelineEvent maps quick add entry to timeline event', () => {
  const event = createActivityTimelineEvent({
    activityType: 'Прогулка',
    durationMinutes: 30,
    note: 'После обеда',
    time: '18:30',
  });

  assert.equal(event.kind, 'activity');
  assert.equal(event.title, 'Прогулка');
  assert.equal(event.value, '30');
  assert.equal(event.unit, 'минут');
  assert.equal(event.note, 'После обеда');
  assert.equal(event.source, 'manual');
  assert.match(event.dateTime, /T18:30:00/);
});
