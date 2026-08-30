import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const obsoleteMapperPath = fileURLToPath(
  new URL(
    '../timeline/semantic-creators/map-quick-add-glucose-context.ts',
    import.meta.url,
  ),
);

const productionQuickAddGlucoseSources = [
  '../../components/quick-add/glucose-quick-add-form.tsx',
  '../../components/quick-add/glucose-quick-add-labels.ts',
  '../../lib/quick-add/glucose-context-options.ts',
  '../timeline/semantic-creators/create-semantic-glucose-timeline-event.ts',
  '../../components/quick-add/quick-add-host.tsx',
].map((relativePath) => fileURLToPath(new URL(relativePath, import.meta.url)));

test('obsolete RU-label glucose context mapper file is deleted', () => {
  assert.equal(existsSync(obsoleteMapperPath), false);
});

test('production Quick Add glucose code does not import mapQuickAddGlucoseContext', () => {
  for (const sourcePath of productionQuickAddGlucoseSources) {
    const source = readFileSync(sourcePath, 'utf8');

    assert.doesNotMatch(
      source,
      /mapQuickAddGlucoseContext/,
      `unexpected mapQuickAddGlucoseContext reference in ${sourcePath}`,
    );
    assert.doesNotMatch(
      source,
      /map-quick-add-glucose-context/,
      `unexpected map-quick-add-glucose-context import in ${sourcePath}`,
    );
  }
});

test('semantic glucose creator passes entry.context through unchanged', () => {
  const source = readFileSync(
    fileURLToPath(
      new URL(
        '../timeline/semantic-creators/create-semantic-glucose-timeline-event.ts',
        import.meta.url,
      ),
    ),
    'utf8',
  );

  assert.match(source, /context: entry\.context/);
  assert.doesNotMatch(source, /mapQuickAddGlucoseContext/);
});
