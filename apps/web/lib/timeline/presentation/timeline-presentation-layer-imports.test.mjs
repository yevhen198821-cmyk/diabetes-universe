import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const presentationRoot = fileURLToPath(new URL('.', import.meta.url));

function listPresentationFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = `${directory}${entry}`;

    if (statSync(path).isDirectory()) {
      return listPresentationFiles(`${path}/`);
    }

    return /\.ts$/.test(entry) && !entry.endsWith('.test.mjs')
      ? [path]
      : [];
  });
}

test('timeline presentation layer does not import from components/timeline', () => {
  const files = listPresentationFiles(presentationRoot).filter(
    (file) => !file.endsWith('timeline-presentation-layer-imports.test.mjs'),
  );

  for (const file of files) {
    const source = readFileSync(file, 'utf8');

    assert.equal(
      /from ['"][^'"]*components\/timeline/.test(source),
      false,
      `${file} imports from components/timeline`,
    );
  }
});
