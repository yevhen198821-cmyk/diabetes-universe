import { MEDICAL_MAX_REQUEST_BYTES } from './constants';
import { MedicalApiValidationError } from './medical-api-validation';

export async function readBoundedRequestBody(
  request: Request,
  maxBytes: number = MEDICAL_MAX_REQUEST_BYTES,
): Promise<string> {
  const contentLengthHeader = request.headers.get('content-length');
  if (contentLengthHeader !== null) {
    const contentLength = Number(contentLengthHeader);
    if (!Number.isFinite(contentLength) || contentLength < 0) {
      throw new MedicalApiValidationError('Content-Length header is invalid.');
    }

    if (contentLength > maxBytes) {
      throw new MedicalApiValidationError('Request body is too large.');
    }
  }

  const body = request.body;
  if (!body) {
    return '';
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new MedicalApiValidationError('Request body is too large.');
    }

    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return text;
}
