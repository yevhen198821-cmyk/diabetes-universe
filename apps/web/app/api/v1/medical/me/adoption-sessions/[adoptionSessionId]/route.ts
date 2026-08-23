import { handleGetAdoptionSession } from '../../../../../../../lib/medical/server/medical-adoption-handlers';

export async function GET(
  request: Request,
  context: { params: Promise<{ adoptionSessionId: string }> },
) {
  const { adoptionSessionId } = await context.params;
  return handleGetAdoptionSession(request, adoptionSessionId);
}
