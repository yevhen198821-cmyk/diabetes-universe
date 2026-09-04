import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

import { englishCanonicalMessages } from './resources/en/messages.ts';
import { germanCanonicalMessages } from './resources/de/messages.ts';
import { russianCanonicalMessages } from './resources/ru/messages.ts';
import { ukrainianCanonicalMessages } from './resources/uk/messages.ts';
import { englishMetadata } from './metadata/en.ts';
import { germanMetadata } from './metadata/de.ts';
import { russianMetadata } from './metadata/ru.ts';
import { ukrainianMetadata } from './metadata/uk.ts';
import {
  CLOSURE_PRODUCTION_COGNATE_KEYS,
  CLOSURE_PRODUCTION_KEYS,
} from './closure-production.ts';

const RESOURCE_ROOT = path.resolve(import.meta.dirname, 'resources');

const PRODUCTION_BUNDLES = {
  'de-DE': {
    messages: germanCanonicalMessages,
    metadata: germanMetadata,
    source: path.join(RESOURCE_ROOT, 'de/messages.ts'),
  },
  'ru-RU': {
    messages: russianCanonicalMessages,
    metadata: russianMetadata,
    source: path.join(RESOURCE_ROOT, 'ru/messages.ts'),
  },
  'uk-UA': {
    messages: ukrainianCanonicalMessages,
    metadata: ukrainianMetadata,
    source: path.join(RESOURCE_ROOT, 'uk/messages.ts'),
  },
};

function collectExplicitMessageKeys(source) {
  const sourceFile = ts.createSourceFile(
    'messages.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const keys = new Set();

  function visit(node) {
    if (
      ts.isPropertyAssignment(node) &&
      ts.isStringLiteral(node.name) &&
      node.name.text.includes('.')
    ) {
      keys.add(node.name.text);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return keys;
}

test('production locale metadata is approved, not draft', () => {
  assert.equal(englishMetadata.status, 'approved');

  for (const [locale, bundle] of Object.entries(PRODUCTION_BUNDLES)) {
    assert.equal(
      bundle.metadata.status,
      'approved',
      `${locale} is still marked draft and cannot be production-complete`,
    );
  }
});

test('closure keys are explicitly authored, not English-spread placeholders', async () => {
  for (const [locale, bundle] of Object.entries(PRODUCTION_BUNDLES)) {
    const source = await readFile(bundle.source, 'utf8');
    const explicitKeys = collectExplicitMessageKeys(source);
    const missing = CLOSURE_PRODUCTION_KEYS.filter(
      (key) => !explicitKeys.has(key),
    );

    assert.deepEqual(
      missing,
      [],
      `${locale} still inherits closure keys from English: ${missing.join(', ')}`,
    );
  }
});

test('English-identical closure values are limited to documented cognates', () => {
  for (const [locale, bundle] of Object.entries(PRODUCTION_BUNDLES)) {
    const unexpected = [];

    for (const key of CLOSURE_PRODUCTION_KEYS) {
      const value = bundle.messages[key];
      const english = englishCanonicalMessages[key];

      if (value === english && !CLOSURE_PRODUCTION_COGNATE_KEYS.has(key)) {
        unexpected.push(key);
      }
    }

    assert.deepEqual(
      unexpected,
      [],
      `${locale} still uses English placeholders outside the cognate allowlist: ${unexpected.join(', ')}`,
    );
  }
});

test('cognate allowlist does not hide ordinary English sentences', () => {
  for (const key of CLOSURE_PRODUCTION_COGNATE_KEYS) {
    const english = englishCanonicalMessages[key];
    assert.ok(typeof english === 'string', `${key} must exist`);
    assert.equal(
      /[.!?]/.test(english) || english.split(/\s+/).length > 3,
      false,
      `${key} looks like a translatable sentence and must not be allowlisted`,
    );
  }
});
