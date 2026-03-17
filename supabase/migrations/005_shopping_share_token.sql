-- Add share_token to shopping_lists for public read-only share links

ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS share_token uuid DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS shopping_lists_share_token_idx ON shopping_lists(share_token);

-- Allow anyone with the token to read the list (no auth required)
CREATE POLICY "public share read" ON shopping_lists
  FOR SELECT USING (share_token IS NOT NULL);
