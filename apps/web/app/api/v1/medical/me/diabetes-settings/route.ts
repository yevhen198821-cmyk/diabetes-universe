import {
  handleGetDiabetesSettings,
  handlePatchDiabetesSettings,
} from '../../../../../../lib/medical/server/medical-diabetes-settings-handlers';

export async function GET(request: Request) {
  return handleGetDiabetesSettings(request);
}

export async function PATCH(request: Request) {
  return handlePatchDiabetesSettings(request);
}
