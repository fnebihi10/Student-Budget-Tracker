# Supabase setup

Migrations are the versioned schema, not sample data. Never place secret keys,
database passwords or a service_role key in this repository or client config.

Read [the forward migration and recovery guide](../docs/MIGRATIONS.md) before
applying unapplied files in filename order. Back up and rehearse on a disposable
Supabase project first. The upgrade requires revision-aware clients and includes
owner protections, precision checks, goal reconciliation and deletion tombstones.
No production database was modified as part of the workspace implementation.

Use Supabase migration tooling to track versions. If using SQL Editor, maintain
an explicit applied-version record; do not blindly rerun initial schema files.
Account deletion is authenticated and self-only, with foreign-key cascades.

`npm run test:database` exercises all migrations with actual SQL in disposable
PGlite and modeled anonymous/two-user roles. This is not a live Supabase Auth or
PostgREST test. Complete those checks before deployment; see
[verification](../docs/VERIFICATION.md).
