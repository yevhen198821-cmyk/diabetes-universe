import type {
  AuthEmailDelivery,
  MagicLinkEmailPayload,
} from './auth-email-delivery';

export interface CapturedMagicLinkEmail extends MagicLinkEmailPayload {
  readonly capturedAt: string;
}

type CaptureGlobal = typeof globalThis & {
  __duCapturedMagicLinkEmail?: CapturedMagicLinkEmail | null;
};

function readCaptureStore(): CapturedMagicLinkEmail | null {
  return (globalThis as CaptureGlobal).__duCapturedMagicLinkEmail ?? null;
}

function writeCaptureStore(payload: CapturedMagicLinkEmail | null): void {
  (globalThis as CaptureGlobal).__duCapturedMagicLinkEmail = payload;
}

export function createCapturingAuthEmailDelivery(): AuthEmailDelivery {
  return {
    async sendMagicLinkEmail(payload: MagicLinkEmailPayload) {
      writeCaptureStore({
        ...payload,
        capturedAt: new Date().toISOString(),
      });
    },
  };
}

export function getLastCapturedMagicLinkEmail(): CapturedMagicLinkEmail | null {
  return readCaptureStore();
}

export function resetCapturedMagicLinkEmail(): void {
  writeCaptureStore(null);
}
