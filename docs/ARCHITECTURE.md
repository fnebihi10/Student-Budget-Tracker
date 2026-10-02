# Architecture and synchronization

Expo, React Native, React Navigation and Supabase remain the application stack.
`App.js` keys the complete finance provider/navigation subtree by authenticated
user, recovery mode, demo or signed-out scope. `AuthContext.js` owns sessions;
finance contexts own their feature state. Screens present those contexts.

Strict TypeScript currently covers financial/domain utilities, export contracts,
navigation routes, database contracts, diagnostics and the confirmed store.
JavaScript screens, contexts and `cloudData.js` remain an incremental migration
boundary (`allowJs`, without `checkJs`). Type checking does not certify those files.

## Confirmed mutations

`confirmedStore.ts` and `useConfirmedStore.js` replace collection autosync.
Initial cloud reads must succeed before mutations are enabled. States are
`loading`, `pending`, `failed`, and `synced`; verification is tracked separately.
A synchronous busy guard prevents duplicate submissions. Failed or ambiguous
writes leave the form and confirmed snapshot intact, invalidate verification,
and require a successful reload before another mutation. Retry is explicit.

Authenticated offline mutations are disabled. There is no persisted mutation
queue and no automatic replay after restart. Demo edits are local and persist
in their own namespace. Cloud caches are scoped record caches, not an offline
source for authenticated cold starts; a failed cloud load requires retry.

`scopedCache.js` uses `@pocketwise/v2/user/{id}/{feature}/…` and a separate demo
namespace. A single edit serializes only its changed record. Legacy global
caches are quarantined and preserved, never automatically attached to an
account. Logout invalidates stores synchronously; generation guards discard
late responses, and queued cache writes are drained before account deletion.

## Concurrency and deletion

New records use stable UUIDs with conflict-ignore inserts. Existing updates
match owner, ID and expected revision; the database requires revision + 1.
Conflicts require reload and manual reapplication, rather than last-write-wins.
Deletes match owner and ID and are idempotent. Database tombstones prevent a
stale insert/upsert from recreating a deleted UUID, including older clients.
Deleted IDs are never reused. Authentication boundaries invalidate all requests.

Feature commands currently modify one row, or settings JSON in one row. Goal
contributions and bill occurrence histories are atomic within their owning row.
There is no command that jointly creates a payment transaction and changes a
tracker; those are explicitly separate actions. Multi-row import is unavailable.
Profile identity and budget settings are separate saves, not an atomic pair.

Cloud reads use UUID keyset pagination (500 rows/page), avoiding API row caps.
Complete UI totals derive from all loaded rows. `monthly_totals` provides an
owner-scoped database aggregate independent of row caps, with a typed adapter.
It is not yet the reports UI source. Multi-page reads are eventually consistent,
not a transaction snapshot across concurrent devices; reload reconciles them.

## Boundaries

`domain/` contains pure validated financial rules; `utils/` contains typed
presentation calculations; `services/` handles cloud/cache/export operations;
`components/` contains reusable buttons, inputs, cards and the error boundary.
Runtime validators reject malformed financial rows rather than silently treating
partial data as verified. Diagnostics retain bounded codes, not record contents,
session tokens or raw backend errors. No service-role key is used in the client.

Settings plan/status are not trusted paid entitlements. Purchases remain disabled.
Future billing needs server verification before any paid capability is enabled.
