import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const WEB_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const ALLOWED_MEDICAL_SERVICE_IMPORT_PREFIX = join(
  WEB_ROOT,
  'lib/medical/server',
);
const SCANNED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);
const SKIP_DIRECTORY_NAMES = new Set(['node_modules', 'e2e', '.next']);
const SKIP_FILE_PATTERN = /\.(test|spec)\.(mjs|ts|tsx)$/;

const FORBIDDEN_PATTERNS = [
  '@diabetes-universe/medical-persistence',
  'MEDICAL_DATABASE_URL',
  'MEDICAL_MIGRATOR_DATABASE_URL',
  'drizzle-orm/pg-core',
  'medical-schema',
];

const FORBIDDEN_MEDICAL_SERVICE_PATTERN = '@diabetes-universe/medical-service';

function collectSourceFiles(directory) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (SKIP_DIRECTORY_NAMES.has(entry.name)) {
      continue;
    }

    const absolutePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(absolutePath));
      continue;
    }

    if (!SCANNED_EXTENSIONS.has(extname(entry.name))) {
      continue;
    }

    if (SKIP_FILE_PATTERN.test(entry.name)) {
      continue;
    }

    files.push(absolutePath);
  }

  return files;
}

function isAllowedMedicalServerCompositionPath(filePath) {
  return (
    filePath === ALLOWED_MEDICAL_SERVICE_IMPORT_PREFIX ||
    filePath.startsWith(`${ALLOWED_MEDICAL_SERVICE_IMPORT_PREFIX}/`)
  );
}

test('boundary: apps/web source tree does not import medical persistence internals', () => {
  const offenders = [];

  for (const filePath of collectSourceFiles(WEB_ROOT)) {
    const source = readFileSync(filePath, 'utf8');
    const allowedServerComposition =
      isAllowedMedicalServerCompositionPath(filePath);

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (source.includes(pattern)) {
        if (
          allowedServerComposition &&
          (pattern === 'MEDICAL_DATABASE_URL' ||
            pattern === 'MEDICAL_MIGRATOR_DATABASE_URL')
        ) {
          continue;
        }
        offenders.push(`${relative(WEB_ROOT, filePath)}: ${pattern}`);
      }
    }

    if (source.includes(FORBIDDEN_MEDICAL_SERVICE_PATTERN)) {
      if (!allowedServerComposition) {
        offenders.push(
          `${relative(WEB_ROOT, filePath)}: ${FORBIDDEN_MEDICAL_SERVICE_PATTERN}`,
        );
      }
    }
  }

  assert.deepEqual(offenders, []);
});
