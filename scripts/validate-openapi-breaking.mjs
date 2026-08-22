import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { findOpenApiBreakingChanges } from './lib/openapi-contract-diff.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPEC_RELATIVE_PATH = 'docs/api/openapi/medical-v1.yaml';
const HEAD_SPEC_PATH = join(ROOT, SPEC_RELATIVE_PATH);

function readBaseSpecFromGit(baseRef) {
  try {
    return execFileSync('git', ['show', `${baseRef}:${SPEC_RELATIVE_PATH}`], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    return null;
  }
}

function resolveBaseRef() {
  const candidates = [
    process.env.GITHUB_BASE_REF,
    process.env.BASE_REF,
    'origin/main',
    'main',
  ].filter(Boolean);

  for (const candidate of candidates) {
    const source = readBaseSpecFromGit(candidate);
    if (source) {
      return { baseRef: candidate, source };
    }
  }

  return { baseRef: null, source: null };
}

async function main() {
  if (!existsSync(HEAD_SPEC_PATH)) {
    throw new Error(`Head OpenAPI spec not found: ${HEAD_SPEC_PATH}`);
  }

  const headSource = readFileSync(HEAD_SPEC_PATH, 'utf8');
  const { baseRef, source: baseSource } = resolveBaseRef();

  if (!baseSource) {
    console.log(
      `OpenAPI breaking-change check skipped: no baseline found on base ref (${baseRef ?? 'none'}). Establishing first baseline from ${SPEC_RELATIVE_PATH}.`,
    );
    return;
  }

  const result = await findOpenApiBreakingChanges(baseSource, headSource);
  if (result.breaking) {
    console.error('OpenAPI breaking changes detected against baseline:');
    for (const change of result.changes) {
      console.error(`- ${change}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `OpenAPI breaking-change validation passed against baseline ${baseRef}.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
