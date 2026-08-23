import { handleAdoptBatch } from '../../../../../../../../lib/medical/server/medical-adoption-handlers';

export async function POST(
  request: Request,
  context: { params: Promise<{ adoptionSessionId: string }> },
) {
  const { adoptionSessionId } = await context.params;
  return handleAdoptBatch(request, adoptionSessionId);
}
