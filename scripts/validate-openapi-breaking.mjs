import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BASELINE_RESOLUTION,
  resolveOpenApiBaseline,
} from './lib/openapi-baseline-resolution.mjs';
import { findOpenApiBreakingChanges } from './lib/openapi-contract-diff.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPEC_RELATIVE_PATH = 'docs/api/openapi/medical-v1.yaml';
const HEAD_SPEC_PATH = join(ROOT, SPEC_RELATIVE_PATH);

function resolveFallbackRefs() {
  return [
    process.env.GITHUB_BASE_REF,
    process.env.BASE_REF,
    'origin/main',
    'main',
  ];
}

async function main() {
  if (!existsSync(HEAD_SPEC_PATH)) {
    throw new Error(`Head OpenAPI spec not found: ${HEAD_SPEC_PATH}`);
  }

  const headSource = readFileSync(HEAD_SPEC_PATH, 'utf8');
  const resolution = resolveOpenApiBaseline({
    cwd: ROOT,
    specRelativePath: SPEC_RELATIVE_PATH,
    explicitBaseSha: process.env.OPENAPI_BASE_SHA,
    fallbackRefs: resolveFallbackRefs(),
  });

  if (resolution.status === BASELINE_RESOLUTION.BASELINE_FILE_ABSENT) {
    console.log(
      `OpenAPI breaking-change check skipped: baseline file absent at ${resolution.baseRef}. Establishing first baseline from ${SPEC_RELATIVE_PATH}.`,
    );
    return;
  }

  if (resolution.status === BASELINE_RESOLUTION.BASELINE_UNAVAILABLE) {
    throw new Error(
      resolution.reason ??
        'OpenAPI baseline is unavailable and breaking-change validation cannot proceed.',
    );
  }

  const result = await findOpenApiBreakingChanges(
    resolution.source,
    headSource,
  );
  if (result.breaking) {
    console.error('OpenAPI breaking changes detected against baseline:');
    for (const change of result.changes) {
      console.error(`- ${change}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `OpenAPI breaking-change validation passed against baseline ${resolution.baseRef}.`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
