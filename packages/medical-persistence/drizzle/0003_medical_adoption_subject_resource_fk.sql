-- P10 adoption mapping same-subject canonical resource integrity

ALTER TABLE medical.medical_adoption_mappings
  DROP CONSTRAINT IF EXISTS medical_adoption_mappings_canonical_resource_id_medical_event_resou;

ALTER TABLE medical.medical_adoption_mappings
  DROP CONSTRAINT IF EXISTS medical_adoption_mappings_canonical_resource_id_fkey;

ALTER TABLE medical.medical_adoption_mappings
  ADD CONSTRAINT medical_adoption_mappings_canonical_subject_resource
  FOREIGN KEY (subject_id, canonical_resource_id)
  REFERENCES medical.medical_event_resources (subject_id, resource_id)
  ON DELETE RESTRICT;
