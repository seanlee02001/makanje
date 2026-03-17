-- Pantry items: ingredients the family already has at home
-- These are subtracted from the shopping list at generation time.

CREATE TABLE pantry_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name       text NOT NULL,
  quantity   numeric,
  unit       text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "family pantry select" ON pantry_items
  FOR SELECT USING (family_id = get_family_id());

CREATE POLICY "family pantry insert" ON pantry_items
  FOR INSERT WITH CHECK (family_id = get_family_id());

CREATE POLICY "family pantry update" ON pantry_items
  FOR UPDATE USING (family_id = get_family_id());

CREATE POLICY "family pantry delete" ON pantry_items
  FOR DELETE USING (family_id = get_family_id());

GRANT SELECT, INSERT, UPDATE, DELETE ON pantry_items TO anon, authenticated;
