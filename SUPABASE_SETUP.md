# Supabase user storage

1. Create a Supabase project.
2. Open **SQL Editor**, paste and run `supabase/schema.sql`.
   - If the project previously ran an older schema and reports that `create_app_user` is missing from the schema cache, run `supabase/migrations/20261022_create_app_user.sql` once.
3. Copy `.env.example` values into `.env.local`:
   - `SUPABASE_URL`: Project Settings → API → Project URL.
   - `SUPABASE_SERVICE_ROLE_KEY`: Project Settings → API Keys → service role. Keep this server-only.
   - `AUTH_SESSION_SECRET`: a random value with at least 32 characters.
4. Restart `npm run dev`.
5. Create the first admin in SQL Editor using the commented `create_app_user` example at the bottom of `supabase/schema.sql`. Replace both placeholders with your own email and a strong password.
6. On Vercel, add the same three variables for Production and redeploy.

The schema enables RLS and grants no browser access. User CRUD runs through protected Next.js API routes. Passwords are chosen during account creation and stored only as bcrypt hashes.
