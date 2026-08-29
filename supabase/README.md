# Connecting Supabase

Steps 1, 2 and 5 are done by hand in the Supabase web console.

1. **Project.** supabase.com → New project, region `eu-central` (Frankfurt).
   Put the database password in a password manager. Keep **Enable Data API**
   on, turn **Automatically expose new tables** off, and turn
   **Enable automatic RLS** on. The schema grants the minimum API access
   explicitly.

2. **Schema.** SQL Editor → paste all of `schema.sql` → Run.

3. **Accounts.** Authentication → Users → Add user, four times, using each
   person's real email and a private password, with *Auto Confirm User*
   ticked. On first login the page associates that Supabase user with the
   selected catalogue profile (`ira`, `olena`, `alex` or `laverka`).
   Share passwords only through a secure private channel.

   We deliberately avoid Supabase's built-in email on the free tier: it is
   rate-limited to a handful of messages an hour and is meant for testing.
   That is why accounts are created by hand rather than through sign-up.

4. **Close the door.** Authentication → Sign Up → turn off
   "Allow new users to sign up". After that an outsider cannot create an
   account at all.

5. **Restrict redirects.** Authentication → URL Configuration → Redirect URLs:
   `https://valeriitovstyk.github.io/movies-based-on-true-story/**`

6. **Keys into the page — done.** The `Project URL` and publishable key are
   configured in `index.html`. Both are public by design, and committing them
   to an open repository is fine: protection comes from the RLS policies in
   `schema.sql`, not from keeping the key secret.

   The `service_role` key (also called secret) never goes into the page, the
   repository, or a screenshot — it bypasses every policy.

7. **Backend — done.** `index.html` now logs in through Supabase Auth, loads
   the whole group's marks, writes only the active user's rows, and migrates
   that user's previous localStorage marks once after the first login.

## Two things not to miss

`alter table … enable row level security` and least-privilege `grant`
statements are already in `schema.sql`. RLS decides which rows a user may
reach; grants decide which operations can reach the table at all. Anonymous
visitors receive no table privileges.

A free project sleeps after roughly a week without requests. Fix it with a
cron job in the existing GitHub Actions workflow that pokes the database
every few days.
