import { handleSync } from '../../../../../../../lib/medical/server/medical-sync-handlers';
export async function POST(request: Request) {
  return handleSync(request, 'push');
}
