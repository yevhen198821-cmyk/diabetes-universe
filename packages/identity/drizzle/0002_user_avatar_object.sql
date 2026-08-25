CREATE TABLE IF NOT EXISTS "user_avatar_object" (
  "user_id" text PRIMARY KEY NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "content_type" text NOT NULL,
  "byte_size" integer NOT NULL,
  "content" bytea NOT NULL,
  "updated_at" timestamptz NOT NULL
);
