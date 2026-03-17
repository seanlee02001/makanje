-- Phase 1: Dish/Meal Split Migration
-- Rename old meals table → dishes; create new meals table as collections

-- Rename meals → dishes
ALTER TABLE meals RENAME TO dishes;

-- Rename FK column on ingredients
ALTER TABLE ingredients RENAME COLUMN meal_id TO dish_id;

-- Create meals as named collections of dishes
CREATE TABLE meals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name        text NOT NULL,
  created_by  uuid REFERENCES users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Join table: meal → dishes
CREATE TABLE meal_dishes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id    uuid NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  dish_id    uuid NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0
);

-- RLS on new tables
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_dishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read family meals" ON meals
  FOR SELECT USING (family_id = get_family_id());
CREATE POLICY "insert family meals" ON meals
  FOR INSERT WITH CHECK (family_id = get_family_id());
CREATE POLICY "update family meals" ON meals
  FOR UPDATE USING (family_id = get_family_id());
CREATE POLICY "delete family meals" ON meals
  FOR DELETE USING (family_id = get_family_id());

CREATE POLICY "read family meal_dishes" ON meal_dishes
  FOR SELECT USING (
    meal_id IN (SELECT id FROM meals WHERE family_id = get_family_id())
  );
CREATE POLICY "insert family meal_dishes" ON meal_dishes
  FOR INSERT WITH CHECK (
    meal_id IN (SELECT id FROM meals WHERE family_id = get_family_id())
  );
CREATE POLICY "delete family meal_dishes" ON meal_dishes
  FOR DELETE USING (
    meal_id IN (SELECT id FROM meals WHERE family_id = get_family_id())
  );

-- Clear stale slot references FIRST (old IDs pointed to dishes, not new meals)
UPDATE meal_plan_slots SET meal_id = NULL;

-- Then re-point the FK to the new meals table
ALTER TABLE meal_plan_slots DROP CONSTRAINT IF EXISTS meal_plan_slots_meal_id_fkey;
ALTER TABLE meal_plan_slots ADD CONSTRAINT meal_plan_slots_meal_id_fkey
  FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE SET NULL;

-- Grants for new tables
GRANT SELECT, INSERT, UPDATE, DELETE ON meals      TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON meal_dishes TO anon, authenticated;
