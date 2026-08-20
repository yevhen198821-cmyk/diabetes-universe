import type { MedicalEnvironment } from '@diabetes-universe/medical-persistence/server';
import {
  closeMedicalDatabase,
  createMedicalDatabase,
  createMedicalSubjectRepository,
  type MedicalDatabase,
} from '@diabetes-universe/medical-persistence/server';

import { createMedicalEventService } from './services/medical-event-service';
import { createMedicalSubjectService } from './services/medical-subject-service';

export interface MedicalServiceBundle {
  readonly database: MedicalDatabase;
  readonly subjectService: ReturnType<typeof createMedicalSubjectService>;
  readonly eventService: ReturnType<typeof createMedicalEventService>;
}

export async function createMedicalServiceBundle(
  environment: MedicalEnvironment,
): Promise<MedicalServiceBundle> {
  const database = await createMedicalDatabase(environment);
  const subjectRepository = createMedicalSubjectRepository(database);

  return {
    database,
    subjectService: createMedicalSubjectService(subjectRepository),
    eventService: createMedicalEventService(database, environment),
  };
}

export async function closeMedicalServiceBundle(
  bundle: MedicalServiceBundle,
): Promise<void> {
  void bundle;
  await closeMedicalDatabase();
}

export type { AuthorizationScope } from './types/authorization-scope';
export { createMedicalSubjectService } from './services/medical-subject-service';
export { createMedicalEventService } from './services/medical-event-service';
