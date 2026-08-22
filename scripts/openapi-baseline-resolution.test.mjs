import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  BASELINE_RESOLUTION,
  resolveOpenApiBaseline,
  resolveOpenApiBaselineFromCommit,
} from './lib/openapi-baseline-resolution.mjs';

const SPEC_RELATIVE_PATH = 'docs/api/openapi/medical-v1.yaml';

function initGitRepo(root) {
  execFileSync('git', ['init'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], {
    cwd: root,
  });
  execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: root });
}

function gitCommitAll(root, message) {
  execFileSync('git', ['add', '-A'], { cwd: root });
  execFileSync('git', ['commit', '-m', message], { cwd: root });
}

function createFixtureRepo({ withBaseline = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'openapi-baseline-'));
  initGitRepo(root);

  writeFileSync(join(root, 'README.md'), '# fixture\n', 'utf8');
  gitCommitAll(root, 'initial');

  if (withBaseline) {
    const specDir = join(root, 'docs/api/openapi');
    execFileSync('mkdir', ['-p', specDir], { cwd: root });
    writeFileSync(
      join(specDir, 'medical-v1.yaml'),
      'openapi: 3.0.3\ninfo:\n  title: Medical API\n  version: 1.0.0\npaths: {}\n',
      'utf8',
    );
    gitCommitAll(root, 'add baseline');
  }

  const baseSha = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  }).trim();

  return { root, baseSha };
}

test('exact base commit without OpenAPI file => first baseline skip', () => {
  const { root, baseSha } = createFixtureRepo({ withBaseline: false });

  const resolution = resolveOpenApiBaselineFromCommit({
    commitRef: baseSha,
    specRelativePath: SPEC_RELATIVE_PATH,
    cwd: root,
  });

  assert.equal(resolution.status, BASELINE_RESOLUTION.BASELINE_FILE_ABSENT);
  assert.equal(resolution.baseRef, baseSha);
});

test('exact base commit with baseline and additive head => pass resolution', () => {
  const { root, baseSha } = createFixtureRepo({ withBaseline: true });

  const resolution = resolveOpenApiBaselineFromCommit({
    commitRef: baseSha,
    specRelativePath: SPEC_RELATIVE_PATH,
    cwd: root,
  });

  assert.equal(resolution.status, BASELINE_RESOLUTION.BASELINE_AVAILABLE);
  assert.match(resolution.source, /openapi: 3\.0\.3/);
});

test('explicit base SHA cannot be resolved => unavailable', () => {
  const { root } = createFixtureRepo({ withBaseline: true });

  const resolution = resolveOpenApiBaselineFromCommit({
    commitRef: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
    specRelativePath: SPEC_RELATIVE_PATH,
    cwd: root,
  });

  assert.equal(resolution.status, BASELINE_RESOLUTION.BASELINE_UNAVAILABLE);
  assert.match(resolution.reason, /could not be resolved/i);
});

test('unresolvable fallback refs fail closed when baseline exists locally', () => {
  const { root } = createFixtureRepo({ withBaseline: true });

  const resolution = resolveOpenApiBaseline({
    cwd: root,
    specRelativePath: SPEC_RELATIVE_PATH,
    explicitBaseSha: undefined,
    fallbackRefs: ['ffffffffffffffffffffffffffffffffffffffff'],
  });

  assert.equal(resolution.status, BASELINE_RESOLUTION.BASELINE_UNAVAILABLE);
  assert.match(resolution.reason, /fallback refs/i);
});

test('explicit base SHA is required for fail-closed resolution without fallbacks', () => {
  const { root } = createFixtureRepo({ withBaseline: true });

  const resolution = resolveOpenApiBaseline({
    cwd: root,
    specRelativePath: SPEC_RELATIVE_PATH,
    explicitBaseSha: '',
    fallbackRefs: [],
  });

  assert.equal(resolution.status, BASELINE_RESOLUTION.BASELINE_UNAVAILABLE);
});

test('fallback refs resolve absent baseline for first-baseline branches', () => {
  const { root, baseSha } = createFixtureRepo({ withBaseline: false });

  const resolution = resolveOpenApiBaseline({
    cwd: root,
    specRelativePath: SPEC_RELATIVE_PATH,
    explicitBaseSha: undefined,
    fallbackRefs: [baseSha],
  });

  assert.equal(resolution.status, BASELINE_RESOLUTION.BASELINE_FILE_ABSENT);
});
