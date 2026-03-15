-- Grant table-level privileges to Supabase roles.
-- Required when tables are created via raw SQL rather than the Supabase UI.
-- RLS policies sit ON TOP of these grants — without the grant, Postgres
-- rejects the operation before even reaching the policy check.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on families         to anon, authenticated;
grant select, insert, update, delete on users            to anon, authenticated;
grant select, insert, update, delete on meals            to anon, authenticated;
grant select, insert, update, delete on ingredients      to anon, authenticated;
grant select, insert, update, delete on meal_plan_slots  to anon, authenticated;
grant select, insert, update, delete on shopping_lists   to anon, authenticated;

-- Also grant on sequences so uuid primary keys can be generated
grant usage, select on all sequences in schema public to anon, authenticated;
