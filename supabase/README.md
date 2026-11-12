# Folio and Supabase

## Migration history

Use the versioned files in [migrations](migrations) for new environments. The baseline reflects the hosted PostgreSQL 17 schema, including the five original public tables, constraints, indexes, RLS policies, the Auth signup trigger, the private asset bucket and its storage policies, and legacy table grants. [schema.sql](schema.sql) is the historical SQL Editor setup.

The existing hosted Folio project was bootstrapped through the SQL Editor. It had no recorded migrations when the baseline was prepared. Compare the hosted catalog with a clean application of the baseline before reconciling its migration history. Include effective privileges in that comparison. Once verified again in the target project, mark only `20261112000100` applied through migration repair and inspect a dry run before applying the later versions. See [Supabase migration guidance](https://supabase.com/docs/guides/deployment/database-migrations).

- `20261112000200` revokes direct execution of the profile trigger function and unused legacy table privileges, including `TRUNCATE`. Signup still invokes the function through the trigger. The existing CRUD grants and publishing policies are preserved.
- `20261112000300` adds a single versioned snapshot per authenticated owner. Its RLS policies enforce ownership independently of browser filtering. A revision check prevents competing editor sessions from silently overwriting one another.

## Test private drafts

Apply all migrations to a disposable Supabase environment. Copy [the environment template](../.env.example) to `.env.local`, set the local or disposable project URL and publishable key, and set `VITE_FOLIO_CLOUD_DRAFTS=true`. Add the app origin to that environment's Auth redirect URLs if testing confirmation links.

With the flag enabled, a signed-in account opens a separate private workspace. Browser-only portfolios and assets can be copied into an empty cloud workspace after confirmation. That copies editor data and omits the local profile and publishing state. It leaves the source in IndexedDB. The public route continues to use the existing local publishing path.

Drafts save after edits settle. Save errors leave the edited state open and allow a retry. A revision conflict requires reopening the latest saved draft. Folio warns before a reload or sign-out with unsaved changes. An external sign-out or account switch discards the prior in-memory editor session, so any changes that had not reached Supabase may be lost.

Snapshots preserve local editor IDs and include embedded image and font data. Large asset libraries can exceed API request limits. A private Storage upload flow and offline recovery are outside this version.

Run `node --test tests/cloudDrafts.unit.mts` for the snapshot and revision tests. Before enabling hosted drafts, verify with two disposable accounts against the target Supabase stack that each can save and reopen its own work and cannot read or update the other's drafts. Also verify signup and the existing local publishing path.
