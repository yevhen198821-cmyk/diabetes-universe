export interface MagicLinkEmailPayload {
  readonly email: string;
  readonly url: string;
}

export interface AuthEmailDelivery {
  sendMagicLinkEmail(payload: MagicLinkEmailPayload): Promise<void>;
}
