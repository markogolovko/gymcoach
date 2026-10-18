# Future Supabase adapter (not implemented)

The `Storage` interface in `src/storage/types.ts` deliberately exposes async domain operations and snapshot import/export rather than IndexedDB transactions. A future sync adapter can implement the same interface without leaking Supabase types into screens.

## Suggested tables

- `profiles`: `id uuid` references `auth.users`, `settings jsonb`, `created_at`, `updated_at`.
- `capabilities`: `(user_id, exercise_id)` primary key, capability fields, `updated_at`.
- `weight_entries`: `id uuid`, `user_id`, `measured_at`, `weight_kg`, `updated_at`.
- `workout_sessions`: `id uuid`, `user_id`, status, created/started/finished timestamps, RPE, note, usage, request summary, `updated_at`.
- `workout_blocks`: `id uuid`, `session_id`, sort index, type.
- `workout_items`: `id uuid`, `block_id`, sort index, exercise ID/custom name and prescription fields.
- `set_logs`: `id uuid`, `item_id`, set index, done, reps, load kg, completion timestamp.
- `device_sync_state`: user/device ID, last successful cursor, schema version.

Enable row-level security on every user-owned table and scope reads/writes to `auth.uid()`. Never store an OpenAI API key in Supabase by default; syncing credentials would need a separate security and consent design.

## Sync approach

Keep IndexedDB as the offline-first working store. Add an outbox of changed record IDs and `updated_at` values. After authentication and connectivity, push outbox entries, pull records newer than the device cursor, then clear acknowledged entries. Use stable UUIDs for sessions, blocks, items, and set logs; exercise IDs remain catalog IDs. Avoid whole-database last-write-wins: merge independent set logs by ID and show a conflict when the same set or settings field changed on two devices. Tombstones are needed for deletions. Version every serialized record and write migrations before sending newer rows.

The future adapter can keep the existing UI calls (`saveSession`, `listSessions`, etc.) unchanged and add explicit sync status methods only when cross-device sync is in scope. No Supabase client, schema, or credentials ship in this repository today.
