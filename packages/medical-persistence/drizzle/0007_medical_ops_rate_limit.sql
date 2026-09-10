-- Remediation 0C operational rate-limit counters.
-- Isolated from medical event / settings tables. Keys are opaque hashes only.
-- Apply as an approved medical migration actor (medical_migrator or
-- medical_deployer) in deployment/CI only. Never use a runtime role.

CREATE SCHEMA IF NOT EXISTS medical_ops;

CREATE TABLE IF NOT EXISTS medical_ops.rate_limit_windows (
  bucket_key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count > 0),
  PRIMARY KEY (bucket_key, window_start)
);
