import { handleSync } from '../../../../../../../lib/medical/server/medical-sync-handlers';
export async function GET(request: Request) {
  return handleSync(request, 'pull');
}
