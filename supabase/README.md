# Supabase setup

The production schema is versioned in the migrations directory.

## Apply the migrations

Until the repository is linked to the Supabase CLI, open the project's SQL
Editor and run every SQL file in `migrations` in filename order. If the initial
schema is already live, apply only the newer files that have not been run yet.

The migration creates the application tables, constraints, indexes, explicit
Data API grants, per-user Row Level Security policies, and the signup trigger
that initializes a profile and settings row. The account-deletion migration
adds the authenticated, self-only deletion function used by the Privacy screen;
its foreign-key cascades remove all records owned by that account.

Never put the database password, secret API key, or service_role key in this
repository or in an EXPO_PUBLIC environment variable.
