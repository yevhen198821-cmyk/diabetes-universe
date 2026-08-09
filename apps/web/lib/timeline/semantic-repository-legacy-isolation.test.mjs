import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const WORKSPACE_ROOT = path.resolve(import.meta.dirname, '../../../..');

const FORBIDDEN_PATTERNS = [
  {
    explanation: 'migration-only utility',
    id: 'liftRepositorySnapshot',
    pattern: /\bliftRepositorySnapshot\b/,
  },
  {
    explanation: 'removed temporary write bridge',
    id: 'projectSemantic',
    pattern:
      /\bprojectSemantic(?:EventForRepositoryWrite|ToLegacyRepositoryEvent)\b/,
  },
  {
    explanation: 'removed temporary write bridge',
    id: 'temporary-semantic',
    pattern: /temporary-semantic-repository-bridge/,
  },
  {
    explanation: 'removed native semantic sidecar',
    id: 'NativeSemanticEventSidecar',
    pattern: /\bNativeSemanticEventSidecar\b/,
  },
  {
    explanation: 'legacy migration contract — not routine runtime model',
    id: 'TimelineEvent type import',
    pattern:
      /import\s+type\s*\{[^}]*\bTimelineEvent\b[^}]*\}\s+from\s+['"]@diabetes-universe\/types['"]/,
  },
];

const PRODUCTION_SCAN_ROOTS = [
  'apps/web/components',
  'apps/web/lib/dashboard',
  'apps/web/lib/mocks/timeline.ts',
  'apps/web/lib/timeline/presentation',
  'apps/web/lib/timeline/semantic-creators',
  'apps/web/lib/timeline/timeline-store',
  'packages/timeline/src',
];

const EXCLUDED_PATH_SEGMENTS = [
  '/migration/',
  '/testing/',
  'preserved-legacy-demo-timeline-events.ts',
];

const ALLOWED_HITS = new Map();

async function collectSourceFiles(absoluteRoot) {
  const files = [];

  async function walk(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const relativePath = path
        .relative(WORKSPACE_ROOT, absolutePath)
        .replaceAll(path.sep, '/');

      if (!/\.(ts|tsx|mjs)$/.test(relativePath)) {
        continue;
      }

      if (relativePath.endsWith('.test.mjs')) {
        continue;
      }

      if (
        EXCLUDED_PATH_SEGMENTS.some((segment) => relativePath.includes(segment))
      ) {
        continue;
      }

      files.push(relativePath);
    }
  }

  await walk(absoluteRoot);

  return files;
}

function findForbiddenHits(relativePath, source) {
  const hits = [];

  for (const forbidden of FORBIDDEN_PATTERNS) {
    if (!forbidden.pattern.test(source)) {
      continue;
    }

    const allowed = ALLOWED_HITS.get(relativePath);
    if (allowed?.has(forbidden.id)) {
      continue;
    }

    hits.push(forbidden.id);
  }

  return hits;
}

test('production runtime does not import routine legacy write infrastructure', async () => {
  const violations = [];

  for (const scanRoot of PRODUCTION_SCAN_ROOTS) {
    const absoluteRoot = path.join(WORKSPACE_ROOT, scanRoot);
    const rootStat = await stat(absoluteRoot);
    const files = rootStat.isFile()
      ? [scanRoot]
      : (await collectSourceFiles(absoluteRoot)).sort();

    for (const relativePath of files) {
      const source = await readFile(
        path.join(WORKSPACE_ROOT, relativePath),
        'utf8',
      );
      const hits = findForbiddenHits(relativePath, source);

      if (hits.length > 0) {
        violations.push({ hits, relativePath });
      }
    }
  }

  assert.deepEqual(
    violations,
    [],
    violations
      .map(
        (violation) =>
          `${violation.relativePath}: ${violation.hits.join(', ')}`,
      )
      .join('\n'),
  );
});
