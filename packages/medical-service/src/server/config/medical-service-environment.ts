import {
  resolveMedicalEnvironment,
  type MedicalEnvironment,
} from '@diabetes-universe/medical-persistence/server';

export function resolveMedicalServiceEnvironment(
  env: Record<string, string | undefined> = process.env,
): MedicalEnvironment {
  return resolveMedicalEnvironment(env);
}

export type { MedicalEnvironment };
