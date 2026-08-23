import { handleCreateAdoptionSession } from '../../../../../../lib/medical/server/medical-adoption-handlers';

export async function POST(request: Request) {
  return handleCreateAdoptionSession(request);
}
