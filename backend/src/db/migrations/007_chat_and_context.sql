ALTER TABLE matches ADD COLUMN unit_id uuid REFERENCES units(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY,
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
