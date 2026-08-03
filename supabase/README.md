# Supabase setup

The production schema is versioned in the migrations directory.

## Apply the first migration

Until the repository is linked to the Supabase CLI, open the project's SQL
Editor, paste the complete contents of
migrations/20260803193000_initial_schema.sql, and run it once.

The migration creates the application tables, constraints, indexes, explicit
Data API grants, per-user Row Level Security policies, and the signup trigger
that initializes a profile and settings row.

Never put the database password, secret API key, or service_role key in this
repository or in an EXPO_PUBLIC environment variable.
