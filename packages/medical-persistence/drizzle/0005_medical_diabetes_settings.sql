-- Wave 2B diabetes settings foundation (additive).
-- Apply with medical_migrator role in deployment/CI only.

CREATE TABLE IF NOT EXISTS medical.diabetes_settings (
  settings_id UUID PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES medical.medical_subjects(subject_id) ON DELETE RESTRICT,
  -- Transitional DB state: NULL means the subject has not yet explicitly chosen a unit.
  glucose_display_unit TEXT CHECK (glucose_display_unit IN ('mmol_per_l', 'mg_per_dl')),
  diabetes_type_category TEXT NOT NULL DEFAULT 'unknown' CHECK (
    diabetes_type_category IN ('type_1', 'type_2', 'gestational', 'other', 'unknown')
  ),
  diabetes_type_other_text TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  revision BIGINT NOT NULL CHECK (
    revision > 0 AND revision <= 9007199254740991
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS diabetes_settings_subject_unique
  ON medical.diabetes_settings (subject_id);

CREATE INDEX IF NOT EXISTS diabetes_settings_subject_lookup
  ON medical.diabetes_settings (subject_id);

CREATE TABLE IF NOT EXISTS medical.glucose_target_profiles (
  profile_id UUID PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES medical.medical_subjects(subject_id) ON DELETE RESTRICT,
  low_mmol_per_l DOUBLE PRECISION,
  high_mmol_per_l DOUBLE PRECISION,
  source TEXT CHECK (
    source IN ('user_defined', 'clinician_defined', 'imported', 'system_reference')
  ),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  revision BIGINT NOT NULL CHECK (
    revision > 0 AND revision <= 9007199254740991
  ),
  CHECK (
    (
      low_mmol_per_l IS NULL
      AND high_mmol_per_l IS NULL
      AND source IS NULL
    )
    OR (
      low_mmol_per_l IS NOT NULL
      AND high_mmol_per_l IS NOT NULL
      AND source IS NOT NULL
      AND low_mmol_per_l >= 0.1
      AND high_mmol_per_l <= 100
      AND low_mmol_per_l < high_mmol_per_l
    )
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS glucose_target_profiles_subject_unique
  ON medical.glucose_target_profiles (subject_id);

CREATE INDEX IF NOT EXISTS glucose_target_profiles_subject_lookup
  ON medical.glucose_target_profiles (subject_id);
