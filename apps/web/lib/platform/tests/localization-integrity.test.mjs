import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

import {
  CANONICAL_PLATFORM_DEFAULT_LOCALE as CATALOG_DEFAULT,
  CANONICAL_SUPPORTED_LOCALE_CODES as CATALOG_LOCALES,
  CANONICAL_TRANSLATION_FALLBACK_POLICY as CATALOG_FALLBACK,
  LOCALE_RESOURCE_CATALOG,
} from '@diabetes-universe/i18n-locales';

import { WEB_PLATFORM_FALLBACK_POLICY } from '../web-platform-defaults.ts';

const WEB_ROOT = path.resolve(import.meta.dirname, '../../..');

const MIGRATED_SURFACE_GLOBS = [
  'components/dashboard',
  'components/timeline',
  'components/profile',
  'components/auth',
  'components/quick-add/glucose-quick-add-form.tsx',
  'components/quick-add/insulin-quick-add-form.tsx',
  'app/auth',
  'app/account',
  'app/dashboard',
  'app/timeline',
  'lib/dashboard',
  'lib/timeline',
  'lib/medical/insulin',
  'lib/quick-add/format-glucose.ts',
  'lib/quick-add/insulin-quick-add-submit.ts',
  'lib/platform',
];

const EXCLUDED_NAME_PATTERN =
  /(\.test\.mjs$|\.spec\.ts$|\/testing\/|\/e2e\/|generated)/;

const HARDCODED_ALLOWLIST = new Set([
  'Diabetes Universe',
  'Email',
  'you@example.com',
  'mmol/L',
  'mg/dL',
  'U',
  'IE',
  'ЕД',
  'ОД',
  'English',
  'Deutsch',
  'Українська',
  'Русский',
  '--:--',
]);

const USER_FACING_PROP_NAMES = new Set([
  'alt',
  'aria-label',
  'ariaLabel',
  'label',
  'placeholder',
  'title',
  'subtitle',
  'heading',
  'description',
  'children',
]);

const FORBIDDEN_I18N_IMPORTS = [
  'i18next',
  'next-intl',
  'react-i18next',
  'react-intl',
];

const AD_HOC_FORMATTING_PATTERN =
  /\btoLocale(?:String|DateString|TimeString)\s*\(|new\s+Intl\.DateTimeFormat\s*\(|new\s+Intl\.NumberFormat\s*\(/;

const DETERMINISTIC_CALENDAR = 'en-US-u-ca-gregory-nu-latn';

async function collectSourceFiles(relativePath) {
  const absolute = path.join(WEB_ROOT, relativePath);
  const files = [];

  async function walk(current) {
    let stats;
    try {
      stats = await import('node:fs/promises').then((fs) => fs.stat(current));
    } catch {
      return;
    }

    if (stats.isFile()) {
      if (
        (current.endsWith('.ts') || current.endsWith('.tsx')) &&
        !EXCLUDED_NAME_PATTERN.test(current)
      ) {
        files.push(current);
      }
      return;
    }

    if (!stats.isDirectory()) {
      return;
    }

    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      await walk(path.join(current, entry.name));
    }
  }

  await walk(absolute);
  return files;
}

function looksLikeUserFacingEnglish(value) {
  const trimmed = value.trim();

  if (trimmed.length < 4) {
    return false;
  }

  if (HARDCODED_ALLOWLIST.has(trimmed)) {
    return false;
  }

  if (/^[\d./:+\-_,\s]+$/.test(trimmed)) {
    return false;
  }

  if (/^[a-z0-9._/-]+$/i.test(trimmed) && !/\s/.test(trimmed)) {
    return false;
  }

  if (!/[A-Za-z]/.test(trimmed)) {
    return false;
  }

  return /[A-Za-z]{3,}/.test(trimmed) && /[A-Z]/.test(trimmed[0]);
}

function collectJsxStringLiterals(source) {
  const sourceFile = ts.createSourceFile(
    'surface.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const literals = [];

  function visit(node, userFacing = false) {
    if (ts.isJsxText(node)) {
      const text = node.getText(sourceFile);
      if (looksLikeUserFacingEnglish(text)) {
        literals.push(text.trim());
      }
    }

    if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name)) {
      const nextUserFacing = USER_FACING_PROP_NAMES.has(node.name.text);
      ts.forEachChild(node, (child) => visit(child, nextUserFacing));
      return;
    }

    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (userFacing && looksLikeUserFacingEnglish(node.text)) {
        literals.push(node.text);
      }
    }

    ts.forEachChild(node, (child) => visit(child, userFacing));
  }

  visit(sourceFile);
  return literals;
}

test('canonical catalog remains the supported-locale authority', () => {
  assert.deepEqual([...CATALOG_LOCALES].sort(), [
    'de-DE',
    'en-GB',
    'ru-RU',
    'uk-UA',
  ]);
  assert.equal(CATALOG_DEFAULT, 'en-GB');
  assert.deepEqual([...CATALOG_FALLBACK.localeFallbackChain], ['en-GB']);
  assert.deepEqual(
    [...WEB_PLATFORM_FALLBACK_POLICY.localeFallbackChain],
    ['en-GB'],
  );
});

test('web defaults do not redeclare the four locales', async () => {
  const source = await readFile(
    path.join(WEB_ROOT, 'lib/platform/web-platform-defaults.ts'),
    'utf8',
  );

  assert.match(source, /@diabetes-universe\/i18n-locales/);
  assert.doesNotMatch(source, /asLocaleCode\('uk-UA'\)/);
  assert.doesNotMatch(source, /asLocaleCode\('de-DE'\)/);
  assert.doesNotMatch(source, /asLocaleCode\('ru-RU'\)/);
});

test('profile language UI consumes canonical selector metadata', async () => {
  const source = await readFile(
    path.join(
      WEB_ROOT,
      'components/profile/profile-language-selection-panel.tsx',
    ),
    'utf8',
  );

  assert.match(source, /CANONICAL_SUPPORTED_LOCALE_METADATA/);
  assert.doesNotMatch(source, /const LOCALES = \[/);
});

test('production UI does not introduce a second translation library', async () => {
  const files = (
    await Promise.all(MIGRATED_SURFACE_GLOBS.map(collectSourceFiles))
  ).flat();

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const forbidden of FORBIDDEN_I18N_IMPORTS) {
      assert.equal(
        source.includes(`from '${forbidden}'`) ||
          source.includes(`from "${forbidden}"`),
        false,
        `${file} imports ${forbidden}`,
      );
    }
  }
});

test('production translation-key parity covers all four locales', () => {
  const englishKeys = Object.keys(LOCALE_RESOURCE_CATALOG['en-GB'].messages);

  for (const locale of CATALOG_LOCALES) {
    const messages = LOCALE_RESOURCE_CATALOG[locale]?.messages;
    assert.ok(messages, `${locale} catalog entry exists`);

    for (const key of englishKeys) {
      const value = messages[key];
      assert.equal(typeof value, 'string', `${locale} missing ${key}`);
      assert.ok(value.length > 0, `${locale} empty ${key}`);
    }
  }
});

test('fallback policy never walks through a sibling language', () => {
  assert.equal(CATALOG_FALLBACK.localeFallbackChain.includes('uk-UA'), false);
  assert.equal(CATALOG_FALLBACK.localeFallbackChain.includes('de-DE'), false);
  assert.equal(CATALOG_FALLBACK.localeFallbackChain.includes('ru-RU'), false);
});

test('migrated surfaces do not introduce ad-hoc locale formatting', async () => {
  const files = (
    await Promise.all(MIGRATED_SURFACE_GLOBS.map(collectSourceFiles))
  ).flat();

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const relative = path.relative(WEB_ROOT, file);

    if (
      relative.endsWith('lib/platform/is-valid-iana-time-zone.ts') ||
      relative.endsWith(
        'lib/platform/presentation/resolve-browser-time-zone.ts',
      )
    ) {
      continue;
    }

    const matches = source.match(AD_HOC_FORMATTING_PATTERN) ?? [];
    const disallowed = matches.filter((match) => {
      if (relative.endsWith('lib/timeline/timeline-date-time.ts')) {
        return !source.includes(DETERMINISTIC_CALENDAR);
      }
      return true;
    });

    if (relative.endsWith('lib/timeline/timeline-date-time.ts')) {
      const presentationIntl = [
        ...source.matchAll(/new Intl\.DateTimeFormat\(([^)]+)\)/g),
      ].filter((match) => !match[1].includes(DETERMINISTIC_CALENDAR));
      assert.equal(
        presentationIntl.length,
        0,
        `${relative} still formats presentation dates with Intl`,
      );
      continue;
    }

    assert.equal(
      disallowed.length,
      0,
      `${relative} uses ad-hoc locale formatting: ${disallowed.join(', ')}`,
    );
  }
});

test('migrated surfaces do not add new hardcoded English UI strings', async () => {
  const files = (
    await Promise.all(MIGRATED_SURFACE_GLOBS.map(collectSourceFiles))
  ).flat();
  const findings = [];

  for (const file of files) {
    const relative = path.relative(WEB_ROOT, file);
    if (relative.startsWith('lib/platform/')) {
      continue;
    }

    const source = await readFile(file, 'utf8');
    const literals = collectJsxStringLiterals(source);
    for (const literal of literals) {
      findings.push(`${relative}: "${literal}"`);
    }
  }

  assert.deepEqual(findings, []);
});
