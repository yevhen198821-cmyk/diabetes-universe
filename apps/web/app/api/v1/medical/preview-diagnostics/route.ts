import { ensureMedicalApiRuntimeReady } from '../../../../../lib/medical/server/ensure-medical-api-runtime';
import {
  buildPreviewMedicalDiagnosticsReport,
  isPreviewMedicalDiagnosticsEnabled,
} from '../../../../../lib/medical/server/preview-medical-diagnostics';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isPreviewMedicalDiagnosticsEnabled()) {
    return new Response('Not found', { status: 404 });
  }

  ensureMedicalApiRuntimeReady();

  const report = buildPreviewMedicalDiagnosticsReport();

  console.info(
    '[preview-medical-diagnostics]',
    JSON.stringify({
      capability: report.medicalRuntime.capability,
      rateLimitProductionReady: report.medicalRuntime.rateLimitProductionReady,
      adapterRegistered: report.medicalRuntime.adapterRegistered,
      databaseUrl: report.medicalRuntime.databaseUrl,
      rateLimitBackend: report.medicalRuntime.rateLimitBackend,
    }),
  );

  return Response.json(report, {
    headers: {
      'cache-control': 'no-store',
    },
  });
}
