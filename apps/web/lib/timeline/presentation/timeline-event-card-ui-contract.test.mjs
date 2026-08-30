import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const eventCardSource = readFileSync(
  fileURLToPath(
    new URL(
      '../../../../../packages/ui/src/components/event-card/EventCard.tsx',
      import.meta.url,
    ),
  ),
  'utf8',
);

test('EventCard supports canonical dateTime separate from visible time', () => {
  assert.match(eventCardSource, /dateTime,/);
  assert.match(eventCardSource, /const semanticDateTime = dateTime \?\? time/);
  assert.match(eventCardSource, /dateTime=\{semanticDateTime\}/);
});

test('EventCard renders optional status lines with generic styling', () => {
  assert.match(eventCardSource, /statusLines/);
  assert.match(eventCardSource, /metadataLines/);
  assert.match(eventCardSource, /text-xs text-slate-500/);
});

test('EventCard fallback aria construction includes metadataLines once', () => {
  const fallbackAriaSource = readFileSync(
    fileURLToPath(
      new URL(
        '../../../../../packages/ui/src/components/event-card/build-event-card-fallback-aria-label.ts',
        import.meta.url,
      ),
    ),
    'utf8',
  );

  assert.match(eventCardSource, /buildEventCardFallbackAriaLabel/);
  assert.match(fallbackAriaSource, /\.\.\.\(input\.metadataLines \?\? \[\]\)/);
});
