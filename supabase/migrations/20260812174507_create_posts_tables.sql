/*
# Create posts and post_attempts tables for Driftwood content pipeline

1. New Tables
  - `posts`
    - `id` (uuid, primary key) - unique post identifier
    - `topic` (text, not null) - the input topic for generation
    - `content` (text, nullable) - final published content, null if held
    - `status` (text, not null) - one of: generating, published, held
    - `attempt_count` (smallint) - how many generation attempts were made
    - `held_reasons` (text array) - why the post was held after max failures
    - `created_at` (timestamptz) - when the post was requested
    - `published_at` (timestamptz) - when the post was approved for publish

  - `post_attempts`
    - `id` (uuid, primary key) - unique attempt identifier
    - `post_id` (uuid, FK to posts) - which post this attempt belongs to
    - `attempt_number` (smallint) - 1, 2, or 3
    - `content` (text) - what the LLM generated for this attempt
    - `validator_result` (jsonb) - deterministic validator output: { passed, violations }
    - `reviewer_result` (jsonb, nullable) - LLM reviewer output: { score, concerns } or null
    - `passed` (boolean) - whether this attempt passed all checks
    - `rejection_reasons` (text array) - human-readable reasons for rejection
    - `created_at` (timestamptz) - when this attempt was made

2. Security
  - RLS enabled on both tables
  - anon + authenticated can SELECT (frontend reads)
  - anon + authenticated can INSERT/UPDATE/DELETE (no auth in this app)

3. Indexes
  - posts: (status, created_at desc) for list view
  - post_attempts: (post_id, attempt_number) for audit trail lookups
*/

-- posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  content text,
  status text NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'published', 'held')),
  attempt_count smallint NOT NULL DEFAULT 0,
  held_reasons text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_posts" ON posts;
CREATE POLICY "anon_select_posts" ON posts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_posts" ON posts;
CREATE POLICY "anon_insert_posts" ON posts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_posts" ON posts;
CREATE POLICY "anon_update_posts" ON posts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_posts" ON posts;
CREATE POLICY "anon_delete_posts" ON posts FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_posts_status_created ON posts (status, created_at DESC);

-- post_attempts table
CREATE TABLE IF NOT EXISTS post_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  attempt_number smallint NOT NULL,
  content text NOT NULL,
  validator_result jsonb NOT NULL,
  reviewer_result jsonb,
  passed boolean NOT NULL,
  rejection_reasons text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, attempt_number)
);

ALTER TABLE post_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_attempts" ON post_attempts;
CREATE POLICY "anon_select_attempts" ON post_attempts FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_attempts" ON post_attempts;
CREATE POLICY "anon_insert_attempts" ON post_attempts FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_attempts" ON post_attempts;
CREATE POLICY "anon_update_attempts" ON post_attempts FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_attempts" ON post_attempts;
CREATE POLICY "anon_delete_attempts" ON post_attempts FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_attempts_post_id ON post_attempts (post_id, attempt_number);
