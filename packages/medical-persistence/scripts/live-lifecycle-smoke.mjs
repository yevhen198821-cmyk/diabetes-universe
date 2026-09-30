// Operator DB rehearsal, not an authenticated API or account-erasure test.
// Every synthetic lifecycle mutation is in a transaction that deliberately rolls back.
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { medicalRoleProfile } from './medical-role-profile.mjs';

const url = process.env.MEDICAL_LIFECYCLE_SMOKE_DATABASE_URL;
if (!url) throw new Error('MEDICAL_LIFECYCLE_SMOKE_DATABASE_URL is required');
const profile = medicalRoleProfile(process.env.MEDICAL_ROLE_PROFILE);
const client = neon(url);
const [connection] = await client`SELECT current_user AS name`;
if (connection.name !== (profile.medical_app ?? 'medical_app')) {
  throw new Error(
    'Lifecycle smoke must connect using the restricted application role',
  );
}
const subject = randomUUID();
const resource = randomUUID();
try {
  await client.transaction([
    client.query(
      "INSERT INTO medical.medical_subjects(subject_id,subject_kind,status,created_at,updated_at) VALUES($1,'person','active',now(),now())",
      [subject],
    ),
    client.query(
      `INSERT INTO medical.medical_event_resources(resource_id,subject_id,lifecycle_state,revision,event_observed_at,event_kind,schema_version,semantic_event,created_at,updated_at,created_by_account_id,updated_by_account_id)
      VALUES($1,$2,'active',1,now(),'glucose',1,'{"kind":"glucose","value":5,"unit":"mmol/L","synthetic":true}',now(),now(),'du-rollback-smoke','du-rollback-smoke')`,
      [resource, subject],
    ),
    client.query(
      "UPDATE medical.medical_event_resources SET revision=2,semantic_event=jsonb_set(semantic_event,'{value}','6'),updated_at=now() WHERE resource_id=$1 AND subject_id=$2 AND revision=1",
      [resource, subject],
    ),
    client.query(
      "UPDATE medical.medical_event_resources SET revision=3,lifecycle_state='deleted',deleted_at=now(),updated_at=now() WHERE resource_id=$1 AND subject_id=$2 AND revision=2",
      [resource, subject],
    ),
    client.query(
      `DO $$ BEGIN
      IF (SELECT count(*) FROM medical.sync_changes WHERE subject_id='${subject}') <> 3
        OR (SELECT sequence FROM medical.sync_subject_heads WHERE subject_id='${subject}') <> 3
        OR NOT EXISTS (SELECT 1 FROM medical.sync_changes WHERE subject_id='${subject}' AND sequence=3 AND revision=3 AND lifecycle_state='deleted')
        OR NOT EXISTS (SELECT 1 FROM medical.medical_event_resources WHERE resource_id='${resource}' AND lifecycle_state='deleted' AND revision=3 AND semantic_event->>'value'='6')
      THEN RAISE EXCEPTION 'Synthetic lifecycle or deletion feed assertion failed'; END IF;
    END $$`,
      [],
    ),
    client.query('SELECT 1 / 0', []),
  ]);
  throw new Error('Expected deliberate transaction rollback');
} catch (error) {
  if (error.code !== '22012')
    throw new Error(
      `Lifecycle smoke failed before rollback (${error.code ?? 'unknown'})`,
    );
}
const [cleanup] =
  await client`SELECT NOT EXISTS(SELECT 1 FROM medical.medical_subjects WHERE subject_id=${subject}) AS clean`;
if (!cleanup.clean)
  throw new Error('Synthetic transaction unexpectedly persisted');
console.log(
  'Medical database lifecycle PASS: create/update/soft-delete, ordered sync tombstone, and complete synthetic rollback.',
);
