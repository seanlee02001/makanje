-- MakanJe Revamp Migration
-- Simplifies data model: removes meal wrappers, links slots directly to dishes

-- 1. Create slot_dishes join table
CREATE TABLE IF NOT EXISTS slot_dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES meal_plan_slots(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0
);

-- 2. Add new columns to dishes
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS prep_time_min INT;
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS servings INT;
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS instructions JSONB DEFAULT '[]';

-- 3. Add store_section to ingredients
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS store_section TEXT;

-- 4. Add share_token to shopping_lists
ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid();

-- 5. Migrate existing data: meal_plan_slots → slot_dishes
-- For each slot that has a meal_id, find its meal_dishes and create slot_dishes
INSERT INTO slot_dishes (slot_id, dish_id, sort_order)
SELECT mps.id, md.dish_id, md.sort_order
FROM meal_plan_slots mps
JOIN meal_dishes md ON md.meal_id = mps.meal_id
WHERE mps.meal_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 6. Drop meal_id from meal_plan_slots
ALTER TABLE meal_plan_slots DROP COLUMN IF EXISTS meal_id;

-- 7. Drop old tables (order matters for foreign keys)
DROP TABLE IF EXISTS meal_dishes;
DROP TABLE IF EXISTS meals;

-- 8. RLS on slot_dishes
ALTER TABLE slot_dishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their family slot_dishes"
  ON slot_dishes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meal_plan_slots mps
      JOIN users u ON u.family_id = mps.family_id
      WHERE mps.id = slot_dishes.slot_id
      AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their family slot_dishes"
  ON slot_dishes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_plan_slots mps
      JOIN users u ON u.family_id = mps.family_id
      WHERE mps.id = slot_dishes.slot_id
      AND u.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their family slot_dishes"
  ON slot_dishes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM meal_plan_slots mps
      JOIN users u ON u.family_id = mps.family_id
      WHERE mps.id = slot_dishes.slot_id
      AND u.id = auth.uid()
    )
  );

-- 9. Public read policy for shared shopping lists
CREATE POLICY "Public can read shared shopping lists"
  ON shopping_lists FOR SELECT
  USING (share_token IS NOT NULL);

-- 10. Index for performance
CREATE INDEX IF NOT EXISTS idx_slot_dishes_slot_id ON slot_dishes(slot_id);
CREATE INDEX IF NOT EXISTS idx_slot_dishes_dish_id ON slot_dishes(dish_id);
CREATE INDEX IF NOT EXISTS idx_dishes_tags ON dishes USING GIN(tags);
