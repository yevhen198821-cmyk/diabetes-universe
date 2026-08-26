import {
  handleDeleteGlucoseTargetProfile,
  handleGetGlucoseTargetProfile,
  handlePutGlucoseTargetProfile,
} from '../../../../../../lib/medical/server/medical-diabetes-settings-handlers';

export async function GET(request: Request) {
  return handleGetGlucoseTargetProfile(request);
}

export async function PUT(request: Request) {
  return handlePutGlucoseTargetProfile(request);
}

export async function DELETE(request: Request) {
  return handleDeleteGlucoseTargetProfile(request);
}
