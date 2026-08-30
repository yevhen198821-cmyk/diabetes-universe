import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repositoryRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../..',
);

const architectureDocPaths = [
  'docs/architecture/timeline/quick-add-integration.md',
  'docs/architecture/dashboard/quick-add-integration.md',
  'docs/specs/dashboard/quick-add.md',
  'docs/ui-bible/003-quick-add.md',
  'docs/data/entities/timeline.md',
];

const staleGlucosePatterns = [
  {
    description: 'legacy TimelineEvent as Quick Add write model',
    pattern: /Quick Add creates `TimelineEvent`/i,
  },
  {
    description: 'fire-and-forget glucose addEvent close contract',
    pattern: /glucose[\s\S]{0,120}addEvent\(\)/i,
  },
  {
    description: 'in-memory-only Timeline store for Quick Add',
    pattern: /demo store/i,
  },
  {
    description: 'IndexedDB not implemented for Timeline',
    pattern: /IndexedDB[\s\S]{0,40}is \*\*not\*\* implemented/i,
  },
];

function readRepoFile(relativePath) {
  return readFileSync(join(repositoryRoot, relativePath), 'utf8');
}

test('Wave 3D architecture docs document glucose awaited persistence contract', () => {
  const timelineDoc = readRepoFile(
    'docs/architecture/timeline/quick-add-integration.md',
  );
  const dashboardDoc = readRepoFile(
    'docs/architecture/dashboard/quick-add-integration.md',
  );

  for (const signal of [
    'prepareGlucoseQuickAddSubmit',
    'addEventAsync',
    'createSemanticGlucoseTimelineEvent',
    'SemanticTimelineEvent',
    'IndexedDB',
    'releaseGlucoseSubmitPending',
  ]) {
    assert.match(
      timelineDoc,
      new RegExp(signal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `timeline quick-add integration doc missing ${signal}`,
    );
  }

  for (const signal of ['addEventAsync', 'createSemanticGlucoseTimelineEvent']) {
    assert.match(
      dashboardDoc,
      new RegExp(signal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `dashboard quick-add integration doc missing ${signal}`,
    );
  }
});

test('Wave 3D architecture docs do not regress to legacy glucose save descriptions', () => {
  for (const relativePath of architectureDocPaths) {
    const source = readRepoFile(relativePath);

    for (const { description, pattern } of staleGlucosePatterns) {
      assert.doesNotMatch(
        source,
        pattern,
        `${relativePath} regressed: ${description}`,
      );
    }
  }
});

test('timeline entity doc reflects IndexedDB persistence and glucose mapping', () => {
  const timelineEntityDoc = readRepoFile('docs/data/entities/timeline.md');

  assert.match(timelineEntityDoc, /IndexedDbTimelineRepository/);
  assert.match(timelineEntityDoc, /Glucose \(Wave 3D save integrity\)/);
  assert.match(timelineEntityDoc, /concentrationMmolPerL/);
  assert.doesNotMatch(
    timelineEntityDoc,
    /durable persistence \(IndexedDB, SQLite, backend, auth, sync\) is \*\*not\*\*/i,
  );
});

test('dashboard and timeline glucose handlers share addEventAsync semantic contract', () => {
  const dashboardRoot = readRepoFile(
    'apps/web/components/dashboard/dashboard-root.tsx',
  );
  const timelineShell = readRepoFile(
    'apps/web/components/timeline/timeline-shell.tsx',
  );

  const expectedHandler =
    /await addEventAsync\(\s*\n?\s*createSemanticGlucoseTimelineEvent\(entry, \{ id: eventId \}\),?\s*\n?\s*\)/;

  assert.match(dashboardRoot, expectedHandler);
  assert.match(timelineShell, expectedHandler);
});
