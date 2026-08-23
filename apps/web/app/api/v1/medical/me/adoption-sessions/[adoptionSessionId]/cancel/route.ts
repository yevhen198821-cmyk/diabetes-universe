import { handleCancelAdoptionSession } from '../../../../../../../../lib/medical/server/medical-adoption-handlers';

export async function POST(
  request: Request,
  context: { params: Promise<{ adoptionSessionId: string }> },
) {
  const { adoptionSessionId } = await context.params;
  return handleCancelAdoptionSession(request, adoptionSessionId);
}
