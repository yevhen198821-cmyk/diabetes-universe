import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import SwaggerParser from '@apidevtools/swagger-parser';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPEC_PATH = join(ROOT, 'docs/api/openapi/medical-v1.yaml');

async function main() {
  const source = readFileSync(SPEC_PATH, 'utf8');
  if (!source.trim()) {
    throw new Error('OpenAPI spec is empty.');
  }

  await SwaggerParser.validate(SPEC_PATH);
  console.log(`OpenAPI validation passed: ${SPEC_PATH}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
