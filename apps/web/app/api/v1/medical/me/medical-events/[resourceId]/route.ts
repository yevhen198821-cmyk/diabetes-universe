import {
  handleDeleteMedicalEvent,
  handleGetMedicalEvent,
  handleUpdateMedicalEvent,
} from '../../../../../../../lib/medical/server/medical-events-handlers';

interface RouteContext {
  params: Promise<{ resourceId: string }>;
}

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { resourceId } = await context.params;
  return handleGetMedicalEvent(request, resourceId);
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { resourceId } = await context.params;
  return handleUpdateMedicalEvent(request, resourceId);
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { resourceId } = await context.params;
  return handleDeleteMedicalEvent(request, resourceId);
}
