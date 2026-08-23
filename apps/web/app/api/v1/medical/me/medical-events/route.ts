import {
  handleCreateMedicalEvent,
  handleListMedicalEvents,
} from '../../../../../../lib/medical/server/medical-events-handlers';

export async function GET(request: Request) {
  return handleListMedicalEvents(request);
}

export async function POST(request: Request) {
  return handleCreateMedicalEvent(request);
}
