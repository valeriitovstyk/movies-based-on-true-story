# Connecting Supabase

Steps 1, 2 and 5 are done by hand in the Supabase web console.

1. **Project.** supabase.com → New project, region `eu-central` (Frankfurt).
   Put the database password in a password manager.

2. **Schema.** SQL Editor → paste all of `schema.sql` → Run.

3. **Accounts.** Authentication → Users → Add user, four times, with
   *Auto Confirm User* ticked: `ira@…`, `olena@…`, `alex@…`, `laverka@…`.
   Hand out the passwords over chat.

   We deliberately avoid Supabase's built-in email on the free tier: it is
   rate-limited to a handful of messages an hour and is meant for testing.
   That is why accounts are created by hand rather than through sign-up.

4. **Close the door.** Authentication → Sign Up → turn off
   "Allow new users to sign up". After that an outsider cannot create an
   account at all.

5. **Restrict redirects.** Authentication → URL Configuration → Redirect URLs:
   `https://valeriitovstyk.github.io/movies-based-on-true-story/**`

6. **Keys into the page.** Settings → API: the `Project URL` and the `anon`
   key (also called publishable). Both are public by design, and committing
   them to an open repository is fine: protection comes from the RLS policies
   in `schema.sql`, not from keeping the key secret.

   The `service_role` key (also called secret) never goes into the page, the
   repository, or a screenshot — it bypasses every policy.

7. **Switch the backend.** In `index.html` find `let BE=LocalBackend;` and
   point it at a Supabase implementation. The interface is already fixed:
   `currentUser`, `signIn`, `loadAll`, `setMark`, `putMany`. Nothing else on
   the page changes.

## Two things not to miss

`alter table … enable row level security` is already in `schema.sql`. Without
it the policies do nothing and the public key opens the table to the whole
internet for writing — the most common mistake people make with Supabase.

A free project sleeps after roughly a week without requests. Fix it with a
cron job in the existing GitHub Actions workflow that pokes the database
every few days.
