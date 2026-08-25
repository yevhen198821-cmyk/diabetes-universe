import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPreviewAuthDiagnosticsReport,
  isPreviewAuthDiagnosticsEnabled,
} from './preview-auth-diagnostics.ts';

const previewEnv = {
  AUTH_DATABASE_MODE: 'pglite',
  AUTH_USE_PGLITE: 'true',
  BETTER_AUTH_SECRET: 'x'.repeat(32),
  BETTER_AUTH_URL: 'https://production.example',
  NODE_ENV: 'test',
  VERCEL_BRANCH_URL:
    'diabetes-universe-web-git-implementation-profile-2b7cc9-resulto.vercel.app',
  VERCEL_ENV: 'preview',
  VERCEL_GIT_COMMIT_SHA: 'c7ff9be63189add472974a0b8bb64f1f4c9f2323',
  VERCEL_URL: 'diabetes-universe-web-ft5kujfzn-resulto.vercel.app',
};

test('preview diagnostics disabled outside preview runtime', () => {
  assert.equal(isPreviewAuthDiagnosticsEnabled({ VERCEL_ENV: 'production' }), false);
  assert.equal(isPreviewAuthDiagnosticsEnabled(previewEnv), true);
});

test('preview diagnostics report maps branch alias host mismatch safely', async () => {
  const originalEnv = { ...process.env };
  process.env = { ...originalEnv, ...previewEnv };

  try {
    const request = new Request(
      'https://diabetes-universe-web-git-implementation-profile-2b7cc9-resulto.vercel.app/api/auth/preview-diagnostics',
      {
        headers: {
          host: 'diabetes-universe-web-git-implementation-profile-2b7cc9-resulto.vercel.app',
          'x-forwarded-host':
            'diabetes-universe-web-git-implementation-profile-2b7cc9-resulto.vercel.app',
          'x-forwarded-proto': 'https',
        },
      },
    );

    const report = await buildPreviewAuthDiagnosticsReport(request, previewEnv);

    assert.equal(report.deployment.gitCommitSha, previewEnv.VERCEL_GIT_COMMIT_SHA);
    assert.equal(report.hosts.hostMismatchVercelUrlVsBranchUrl, true);
    assert.equal(report.hosts.browserHostMatchesBranchUrl, true);
    assert.equal(report.hosts.browserHostMatchesVercelUrl, false);
    assert.equal(report.hosts.configuredAuthBaseUrlHost, previewEnv.VERCEL_BRANCH_URL);
    assert.equal(
      report.flowHints.likelyFailureCategory,
      'C_OR_UNAUTHENTICATED_NO_COOKIE',
    );
    assert.equal(report.runtimeEnvPresence.DATABASE_URL, 'MISSING');
    assert.equal(report.authEnvironment.configured, true);
    assert.equal(report.session.sessionCookiePresent, false);
  } finally {
    process.env = originalEnv;
  }
});
