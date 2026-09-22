# Folio + Supabase

This folder is Folio's hand-off point from a local-first prototype to a hosted product.

## Before connecting the app

1. Create a Supabase project for Folio.
2. In **Authentication**, configure the email provider and set redirect URLs for:
   - `http://127.0.0.1:5174`
   - `http://localhost:5174`
   - the eventual production domain
3. Run [`schema.sql`](schema.sql) in the Supabase SQL Editor.
4. Copy `.env.example` to `.env.local` and add the project URL and **publishable** key from Supabase's Connect dialog.

Do not add `.env.local` to Git. Do not put a Supabase secret key in this Vite app.

## What the schema protects

- A signed-in person can create, read, change, and delete only their own private work.
- A visitor can read only portfolios the owner has published, plus their pages and blocks.
- Assets live in a private bucket. Their storage path begins with the owner's user ID, and storage policies enforce that ownership.
- The `profiles` table contains a display name only—not a duplicate email address. Supabase Auth owns sign-in emails and passwords.

## Connection order

The current app remains local-first even if environment variables are present. The next implementation step is a `SupabaseWorkspaceRepository` that maps the existing local workspace into the normalized database tables, migrates a user's local work after sign-in, and only then changes the UI to use remote data.

Before enabling real sign-ups, test the RLS policies with two separate test accounts and verify that neither can read the other's unpublished portfolio or assets.
