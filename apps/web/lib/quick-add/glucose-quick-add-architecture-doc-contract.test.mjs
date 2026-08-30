import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repositoryRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../..',
);

const currentArchitectureDocPaths = [
  {
    path: 'docs/architecture/timeline/quick-add-integration.md',
    section: null,
  },
  {
    path: 'docs/architecture/dashboard/quick-add-integration.md',
    section: null,
  },
  {
    path: 'docs/architecture/timeline/shared-state.md',
    section: null,
  },
  {
    path: 'docs/specs/dashboard/quick-add.md',
    section: null,
  },
  {
    path: 'docs/ui-bible/003-quick-add.md',
    section: null,
  },
  {
    path: 'docs/data/entities/timeline.md',
    section: 'Current production state (post-P4 + Wave 3D-IV)',
  },
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
    description: 'IndexedDB not implemented for Timeline current state',
    pattern: /IndexedDB[\s\S]{0,40}is \*\*not\*\* implemented/i,
  },
];

function readRepoFile(relativePath) {
  return readFileSync(join(repositoryRoot, relativePath), 'utf8');
}

function extractMarkdownSection(source, sectionTitle) {
  if (sectionTitle === null) {
    return source;
  }

  const lines = source.split('\n');
  const startIndex = lines.findIndex(
    (line) => line.startsWith('## ') && line.includes(sectionTitle),
  );

  if (startIndex === -1) {
    return '';
  }

  let endIndex = lines.length;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (lines[index].startsWith('## ')) {
      endIndex = index;
      break;
    }
  }

  return lines.slice(startIndex, endIndex).join('\n');
}

function readCurrentArchitectureSection({ path, section }) {
  return extractMarkdownSection(readRepoFile(path), section);
}

test('Wave 3D architecture docs document glucose awaited persistence contract', () => {
  const timelineDoc = readRepoFile(
    'docs/architecture/timeline/quick-add-integration.md',
  );
  const dashboardDoc = readRepoFile(
    'docs/architecture/dashboard/quick-add-integration.md',
  );
  const sharedStateDoc = readRepoFile(
    'docs/architecture/timeline/shared-state.md',
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

  for (const signal of [
    'addEventAsync',
    'createSemanticGlucoseTimelineEvent',
  ]) {
    assert.match(
      dashboardDoc,
      new RegExp(signal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `dashboard quick-add integration doc missing ${signal}`,
    );
  }

  for (const signal of [
    'IndexedDbTimelineRepository',
    'addEventAsync',
    'reload persistence is implemented through IndexedDB',
    'projection/cache for rendering',
  ]) {
    assert.match(
      sharedStateDoc,
      new RegExp(signal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `timeline shared-state doc missing ${signal}`,
    );
  }
});

test('Wave 3D current architecture sections do not regress to legacy glucose save descriptions', () => {
  for (const doc of currentArchitectureDocPaths) {
    const source = readCurrentArchitectureSection(doc);

    assert.notEqual(
      source.length,
      0,
      `${doc.path} missing current architecture section`,
    );

    for (const { description, pattern } of staleGlucosePatterns) {
      assert.doesNotMatch(
        source,
        pattern,
        `${doc.path} regressed in current-state scope: ${description}`,
      );
    }
  }
});

test('timeline entity current production section reflects IndexedDB and glucose mapping', () => {
  const productionSection = readCurrentArchitectureSection({
    path: 'docs/data/entities/timeline.md',
    section: 'Current production state (post-P4 + Wave 3D-IV)',
  });
  const quickAddSection = extractMarkdownSection(
    readRepoFile('docs/data/entities/timeline.md'),
    'Quick Add mapping (semantic write path)',
  );

  assert.match(productionSection, /IndexedDbTimelineRepository/);
  assert.match(productionSection, /P4 Feature[\s\S]*Complete/);
  assert.match(productionSection, /addEventAsync/);
  assert.match(quickAddSection, /Glucose \(Wave 3D save integrity\)/);
  assert.match(quickAddSection, /concentrationMmolPerL/);
});

test('timeline entity post-P3h summary remains historically accurate', () => {
  const postP3hSection = extractMarkdownSection(
    readRepoFile('docs/data/entities/timeline.md'),
    'Current state (post-P3h)',
  );

  assert.match(postP3hSection, /InMemoryTimelineRepository/);
  assert.match(
    postP3hSection,
    /Durable persistence[\s\S]*is \*\*not\*\*\s*\n\s*implemented/,
  );
  assert.match(postP3hSection, /P4[\s\S]*has \*\*not\*\* started/);
});
