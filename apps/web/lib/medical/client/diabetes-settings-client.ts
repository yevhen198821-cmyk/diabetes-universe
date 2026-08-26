import type {
  DiabetesTypeClassification,
  GlucoseDisplayUnit,
} from '@diabetes-universe/medical-domain';

import {
  DiabetesSettingsClientError,
  type DiabetesSettingsResource,
  type GlucoseTargetProfileResource,
} from './diabetes-settings-types';

const DIABETES_SETTINGS_PATH = '/api/v1/medical/me/diabetes-settings';
const GLUCOSE_TARGET_PROFILE_PATH = '/api/v1/medical/me/glucose-target-profile';

interface MedicalApiErrorBody {
  readonly error?: {
    readonly code?: string;
    readonly message?: string;
  };
}

async function readMedicalApiError(
  response: Response,
): Promise<DiabetesSettingsClientError> {
  let code: string | undefined;

  try {
    const payload = (await response.json()) as MedicalApiErrorBody;
    code = payload.error?.code;
  } catch {
    // Fall through to status-based mapping.
  }

  if (response.status === 401) {
    return new DiabetesSettingsClientError(
      'unauthorized',
      'Authentication is required.',
    );
  }

  if (response.status === 412 || code === 'REVISION_CONFLICT') {
    return new DiabetesSettingsClientError(
      'revision_conflict',
      'The resource revision is stale.',
    );
  }

  if (response.status === 428 || code === 'PRECONDITION_REQUIRED') {
    return new DiabetesSettingsClientError(
      'precondition_required',
      'If-Match header is required.',
    );
  }

  if (response.status === 429 || code === 'RATE_LIMITED') {
    return new DiabetesSettingsClientError(
      'rate_limited',
      'Too many requests.',
    );
  }

  if (response.status === 422 || code === 'VALIDATION_FAILED') {
    return new DiabetesSettingsClientError('validation', 'Validation failed.');
  }

  if (response.status >= 500) {
    return new DiabetesSettingsClientError(
      'server',
      'The medical API is temporarily unavailable.',
    );
  }

  return new DiabetesSettingsClientError('server', 'Request failed.');
}

async function requestMedicalResource<T extends { revision: string }>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(input, {
      credentials: 'include',
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new DiabetesSettingsClientError('network', 'Network request failed.');
  }

  if (!response.ok) {
    throw await readMedicalApiError(response);
  }

  return (await response.json()) as T;
}

function withIfMatch(revision: string, headers: HeadersInit = {}): HeadersInit {
  return {
    ...headers,
    'If-Match': revision,
  };
}

export async function fetchDiabetesSettings(): Promise<DiabetesSettingsResource> {
  return requestMedicalResource<DiabetesSettingsResource>(
    DIABETES_SETTINGS_PATH,
    { method: 'GET' },
  );
}

export async function patchDiabetesSettings(
  revision: string,
  patch: {
    readonly glucoseDisplayUnit?: GlucoseDisplayUnit;
    readonly diabetesType?: DiabetesTypeClassification;
  },
): Promise<DiabetesSettingsResource> {
  return requestMedicalResource<DiabetesSettingsResource>(
    DIABETES_SETTINGS_PATH,
    {
      body: JSON.stringify(patch),
      headers: withIfMatch(revision),
      method: 'PATCH',
    },
  );
}

export async function fetchGlucoseTargetProfile(): Promise<GlucoseTargetProfileResource> {
  return requestMedicalResource<GlucoseTargetProfileResource>(
    GLUCOSE_TARGET_PROFILE_PATH,
    { method: 'GET' },
  );
}

export async function putGlucoseTargetProfile(
  revision: string,
  defaultRange: {
    readonly lowMmolPerL: number;
    readonly highMmolPerL: number;
  },
): Promise<GlucoseTargetProfileResource> {
  return requestMedicalResource<GlucoseTargetProfileResource>(
    GLUCOSE_TARGET_PROFILE_PATH,
    {
      body: JSON.stringify({ defaultRange }),
      headers: withIfMatch(revision),
      method: 'PUT',
    },
  );
}

export async function deleteGlucoseTargetProfile(
  revision: string,
): Promise<GlucoseTargetProfileResource> {
  return requestMedicalResource<GlucoseTargetProfileResource>(
    GLUCOSE_TARGET_PROFILE_PATH,
    {
      headers: withIfMatch(revision),
      method: 'DELETE',
    },
  );
}
