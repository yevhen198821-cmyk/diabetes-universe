import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('boundary: web app does not import medical persistence SQL internals', () => {
  const paths = [
    '../../app/layout.tsx',
    '../../app/page.tsx',
    '../../proxy.ts',
  ];

  for (const relativePath of paths) {
    const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
    assert.equal(
      source.includes('@diabetes-universe/medical-persistence'),
      false,
    );
    assert.equal(source.includes('@diabetes-universe/medical-service'), false);
    assert.equal(source.includes('MEDICAL_DATABASE_URL'), false);
  }
});
