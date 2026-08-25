import {
  buildPreviewAuthDiagnosticsReport,
  isPreviewAuthDiagnosticsEnabled,
} from '../../../../lib/auth/preview-auth-diagnostics';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!isPreviewAuthDiagnosticsEnabled()) {
    return new Response('Not found', { status: 404 });
  }

  const report = await buildPreviewAuthDiagnosticsReport(request);

  console.info(
    '[preview-auth-diagnostics]',
    JSON.stringify({
      gitCommitSha: report.deployment.gitCommitSha,
      browserHost: report.request.browserHost,
      likelyFailureCategory: report.flowHints.likelyFailureCategory,
      authConfigured: report.authEnvironment.configured,
      configurationFailureStage:
        report.authEnvironment.configurationFailureStage,
      sessionCookiePresent: report.session.sessionCookiePresent,
      getSessionReturnedPrincipal: report.session.getSessionReturnedPrincipal,
      hostMismatch: report.hosts.hostMismatchVercelUrlVsBranchUrl,
      databaseOk: report.database.connectionOk,
    }),
  );

  return Response.json(report, {
    headers: {
      'cache-control': 'no-store',
    },
  });
}
