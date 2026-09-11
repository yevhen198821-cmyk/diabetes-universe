export interface MedicalApiTestAuthPolicyInput {
  readonly nodeEnv?: string;
  readonly enableTestAuth?: string;
  readonly vercelEnv?: string;
  readonly authRuntimeEnv?: string;
}

let testAuthEnvOverride: MedicalApiTestAuthPolicyInput | null = null;

export function setMedicalApiTestAuthEnvForTests(
  env: MedicalApiTestAuthPolicyInput | null,
): void {
  testAuthEnvOverride = env;
}

export function readMedicalApiTestAuthEnv(): MedicalApiTestAuthPolicyInput {
  if (testAuthEnvOverride) {
    return testAuthEnvOverride;
  }

  return {
    nodeEnv: process.env.NODE_ENV,
    enableTestAuth: process.env.MEDICAL_API_ENABLE_TEST_AUTH,
    vercelEnv: process.env.VERCEL_ENV,
    authRuntimeEnv: process.env.AUTH_RUNTIME_ENV,
  };
}

function isProductionMedicalApiRuntime(
  input: MedicalApiTestAuthPolicyInput,
): boolean {
  return (
    input.nodeEnv === 'production' ||
    input.vercelEnv === 'production' ||
    input.authRuntimeEnv === 'production'
  );
}

export function isMedicalApiTestAuthAllowed(
  input?: MedicalApiTestAuthPolicyInput,
): boolean {
  const resolved = input ?? readMedicalApiTestAuthEnv();
  if (isProductionMedicalApiRuntime(resolved)) {
    return false;
  }

  return resolved.nodeEnv === 'test' || resolved.enableTestAuth === '1';
}
