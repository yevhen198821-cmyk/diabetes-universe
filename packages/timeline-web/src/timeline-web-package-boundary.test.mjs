import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const packageRoot = fileURLToPath(new URL('.', import.meta.url));

function listSourceFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = `${directory}${entry}`;

    if (statSync(path).isDirectory()) {
      return listSourceFiles(`${path}/`);
    }

    return /\.(ts|mjs)$/.test(entry) && !entry.endsWith('.test.mjs')
      ? [path]
      : [];
  });
}

function listTestFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = `${directory}${entry}`;

    if (statSync(path).isDirectory()) {
      return listTestFiles(`${path}/`);
    }

    return entry.endsWith('.test.mjs') ? [path] : [];
  });
}

const forbiddenImportPattern =
  /from ['"][^'"]*(?:apps\/web|@diabetes-universe\/medical-domain)/;

test('timeline-web source and tests do not import apps/web or medical-domain', () => {
  const files = [
    ...listSourceFiles(packageRoot),
    ...listTestFiles(packageRoot).filter(
      (file) => !file.endsWith('timeline-web-package-boundary.test.mjs'),
    ),
  ];

  for (const file of files) {
    const source = readFileSync(file, 'utf8');

    assert.equal(
      forbiddenImportPattern.test(source),
      false,
      `${file} imports apps/web or medical-domain`,
    );
  }
});
