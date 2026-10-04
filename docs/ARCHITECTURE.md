# Architecture and synchronization

Expo, React Native, React Navigation and Supabase remain the application stack.
`App.tsx` keys the complete finance provider/navigation subtree by authenticated
user, recovery mode, demo or signed-out scope. `AuthContext.tsx` owns sessions;
finance contexts own their feature state. Screens present those contexts.

Strict TypeScript covers App and every application file in src, including screens,
contexts, shared components, authentication, cloud/cache adapters and navigation.
There are no JavaScript application exclusions, blanket any or suppression comments.
`npm run types:database` generates contracts and scalar/enum runtime validators
from the migrated PostgreSQL catalog. CI checks reproducible generation. Nested
finance JSON receives explicit validation. Required contexts fail clearly outside
their provider. Demo caches validate their required shape and financial fields.

## Confirmed mutations

`confirmedStore.ts` and `useConfirmedStore.ts` replace collection autosync.
Initial cloud reads must succeed before mutations are enabled. States are
`loading`, `pending`, `failed`, and `synced`; verification is tracked separately.
A synchronous busy guard prevents duplicate submissions. Failed or ambiguous
writes leave the form and confirmed snapshot intact, invalidate verification,
and require a successful reload before another mutation. Retry is explicit.

Authenticated offline mutations are disabled. There is no persisted mutation
queue and no automatic replay after restart. Demo edits are local and persist
in their own namespace. Cloud caches are scoped record caches, not an offline
source for authenticated cold starts; a failed cloud load requires retry.

`scopedCache.ts` uses `@pocketwise/v2/user/{id}/{feature}/…` and a separate demo
namespace. A single edit serializes only its changed record. Legacy global
caches are quarantined and preserved, never automatically attached to an
account. Logout invalidates stores synchronously; generation guards discard
late responses, and queued cache writes are drained before account deletion.

## Concurrency and deletion

New records use stable UUIDs with conflict-ignore inserts. Existing updates
match owner, ID and expected revision; the database requires revision + 1.
Conflicts require reload and manual reapplication, rather than last-write-wins.
Deletes match owner, ID and expected revision. A missing version requires reload.
Database tombstones prevent a
stale insert/upsert from recreating a deleted UUID, including older clients.
Deleted IDs are never reused. Authentication boundaries invalidate all requests.

Feature commands currently modify one row, or settings JSON in one row. Goal
contributions and bill occurrence histories are atomic within their owning row.
Bill payment optionally creates an expense and updates its occurrence in one
PostgreSQL transaction through `record_bill_payment`. Immutable receipts and a
unique owner/bill/period key prevent duplicate expenses across retries and devices.
Receipt metadata is immutable, but replay returns the current bill/transaction
rows; a deliberately deleted ledger row is not recreated. The client reconciles
the server receipt against the confirmed ledger rather than publishing its
temporary synthetic expense alongside another device's operation.
The checkbox still marks tracking without creating a transaction. Operation IDs
remain stable within an intent; after restart, the occurrence key prevents replay.
Multi-row import is unavailable.
Profile identity and budget settings are separate saves, not an atomic pair.

Cloud reads use UUID keyset pagination (500 rows/page), avoiding API row caps.
Complete UI totals derive from all loaded rows. `monthly_totals` provides an
owner-scoped database aggregate independent of row caps, with a typed adapter.
Reports use that aggregate for selected-month totals, with a labeled loaded-history
fallback when unavailable. Category and historical breakdowns use all loaded rows.
Superseded aggregate requests are aborted and their results ignored.
Multi-page reads are eventually consistent,
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

## Lifecycle consistency contract

Authenticated stores refresh on native inactive/background to active, and on web
visible/focus events. Events within 250ms coalesce. Each feature has at most one
load or mutation in flight. Requests during a load join it; refresh requests during
a mutation queue one reconciliation after the write settles, including ambiguous
failures. Authentication invalidation discards queued refreshes and late results.
Refresh retains the last confirmed snapshot while loading; a failed load disables
writes. Refresh and Reload controls remain visible without obscuring the editor.

Editors keep local input and their opening revision through refresh. Changed or
deleted records show a notice, and stale saves cannot recreate or overwrite them.
Recovery is explicit: preserve/copy the draft, close, and reopen the refreshed record.
Drafts are memory-only and are discarded on account boundary, logout or restart;
they are never persisted across identities. No automatic field merge is claimed.

There is no realtime subscription, background polling or offline mutation queue.
Changes on another device arrive at the next successful resume/focus/manual refresh,
not continuously while this app stays active. Separate feature reads and multiple
history pages do not share a database snapshot. Reports and category details may
temporarily reflect different read instants under concurrent writes. Native event,
Auth refresh and network timing still require the isolated-project/device checks.
