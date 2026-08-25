import {
  handleDeleteCurrentUserAvatar,
  handleGetCurrentUserAvatar,
  handleUploadCurrentUserAvatar,
} from '../../../../../../lib/identity/user-avatar-handlers';

export async function GET(request: Request) {
  return handleGetCurrentUserAvatar(request);
}

export async function POST(request: Request) {
  return handleUploadCurrentUserAvatar(request);
}

export async function DELETE(request: Request) {
  return handleDeleteCurrentUserAvatar(request);
}
