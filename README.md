# Movies: based on true story

A static catalogue of feature films based on real events, rated 7.4 or higher on IMDb with at least 5,000 votes. Thrillers and horror are kept behind a separate toggle; documentaries, series and TV movies are excluded.

The catalogue is kept separately in `data/films.json`; personal marks and ratings are stored in Supabase and sync after password login. A small dependency-free script validates the catalogue and prepares the browser and CSV copies.

> The interface and film notes are in Ukrainian. Only the title and this README are in English.

## What's inside

| File | What it is |
|---|---|
| `index.html` | the site interface: filters, search, personal marks, export |
| `data/films.json` | the single source of truth for all films |
| `data/films.js` | generated browser copy, including support for opening `index.html` directly |
| `data/films.csv` | generated table (UTF-8 with BOM, opens in Excel and Numbers) |
| `data/README.md` | short Ukrainian catalogue update guide and a film template |
| `data/skins.js` | selectable site skins and their colour palettes |
| `scripts/build-catalog.mjs` | validates `films.json` and generates the JS and CSV copies |
| `supabase/schema.sql` | database schema, RLS policies and profile trigger — ready to run |
| `supabase/README.md` | step-by-step Supabase setup |
| `.github/workflows/deploy.yml` | automatic deploy to GitHub Pages on every push to `main` |
| `.nojekyll` | disables Jekyll processing — otherwise Pages ignores files and folders starting with an underscore |

## Deploy to GitHub Pages

**Option 1 — via the workflow (already set up).** Create a repository, push the contents of this folder to `main`, then open **Settings → Pages** and set *Source* to **GitHub Actions**. The next push publishes the site; the address appears in that same section and in the workflow logs.

```bash
git init
git add .
git commit -m "Films based on real events"
git branch -M main
git remote add origin git@github.com:USER/REPO.git
git push -u origin main
```

One caveat: if you enable Pages *after* the first push, that first run fails with `Get Pages site failed` — the workflow started before Pages existed. Just re-run it, or push again.

**Option 2 — no Actions, straight from the branch.** If you'd rather not enable Actions: **Settings → Pages → Source: Deploy from a branch**, branch `main`, folder `/ (root)`. You can then delete `.github/workflows/deploy.yml`.

Both options give you an address like `https://USER.github.io/REPO/`. The first publish takes a minute or two.

## Run locally

Just open `index.html` in a browser — `data/films.js` works without a local server.

If you want it "like production":

```bash
python3 -m http.server 8000
# then http://localhost:8000
```

## Accounts

Four password-protected accounts share the catalogue: **ira**, **olena**, **alex**, **laverka**, each with its own colour. Sign in with the corresponding Supabase email and password in the compact form at the top right; the profile is detected automatically.

Every account keeps its own "watched", "together", "no translation", and "watch with a child" flags plus a 1–5 rating for every film. The personal *подивитись з дитиною* filter turns the last flag into a private watchlist. Each card shows the whole group — who has seen it and how they rated it — plus the group average next to the IMDb score. Extra filters include *нема перекладу* (no translation) and *ніхто з нас* (nobody in the group has seen it) for picking something for a movie night, along with sorting by the group's rating.

Signed-in users can also open a collapsed comments section on any film, read the group's comments, and add their own. Comment counts appear on film cards after sign-in; comment bodies are fetched only when the section is opened. Comments are hidden completely from signed-out visitors.

Marks from the previous localStorage version are migrated to the corresponding Supabase account once, with their original timestamps. Newer data wins if the local and remote versions conflict.

## Where the data lives

Supabase stores the shared data. The page uses Supabase Auth for password login and the `profiles` and `marks` tables for group state. Row Level Security lets every signed-in account read the group while only changing its own rows.

See `supabase/README.md` for the setup. The publishable key is intentionally present in the page — protection comes from the RLS policies in `schema.sql`, not from hiding that key. The `service_role` key never goes near the browser.

## Moving marks between devices

Marks now sync automatically. Export/import remains available for backup or manual recovery:

1. **Export** → **Copy JSON** on the first device
2. **Export** → paste the text into the field → **Import** on the second

Export covers the account you're currently signed in as, and the file records which one, so an import lands where you expect.

Import *merges* marks rather than overwriting them: where the two states differ, the more recent one wins. The export format is plain and fit for further analysis — every film with its metadata, flags, rating and the timestamp of the mark.

Passwords are handled by Supabase Auth and are never stored in this repository or in the site's own localStorage.

## Update the catalogue

Edit only the `films` array in `data/films.json`, then run:

```bash
node scripts/build-catalog.mjs
```

The command validates every record and duplicate IMDb IDs, then regenerates `data/films.js` for the site and `data/films.csv` for spreadsheets. The deploy workflow runs the same validation in check mode, so an outdated generated copy cannot be published accidentally. See `data/README.md` for a Ukrainian walkthrough and a copy-ready record template.

## Site skins

The skin picker offers system, light, night, archive and cinema palettes. The selected skin is stored only in the visitor's browser. To add another palette, copy one entry in the `SKINS` array in `data/skins.js`, give it a unique `id` and label, and change its colour variables; no catalogue, Supabase or HTML changes are needed.

Record fields:

```
imdb_id, title, title_uk, year, rating, votes, genres[], country,
country_main, region, language, theme, who_what, basis, note,
thriller_flag, decade, desc
```

`basis` has three reliability levels: a documented real story, a free interpretation inspired by real events, or a real historical backdrop with fictional characters. The same level appears as a label on every film card and can be selected in the reliability filter. `note` is a caveat about historical accuracy, shown in red; `thriller_flag` hides the film behind the "+ thrillers" button.

## How the list was assembled

Candidates were gathered by decade and by region: lists of biographical and historical films, per-year wiki lists of "films based on actual events", and a separate sweep of Asian cinema. The rating, vote count, year and title type of every film were verified against IMDb's rating API — not taken from search snippets, which are often stale.

Data as of **2 September 2026**.

Excluded: documentaries, series, TV movies and recorded stage productions; films with fewer than 5,000 votes; anything released before 1990. Films with a real historical backdrop but fictional characters remain in the catalogue under a separate reliability label and filter.

India accounts for 107 of the 501 entries. That isn't sampling bias — Indian audiences rate systematically higher, so more Indian films clear the 7.4 threshold. The region filter sorts this out.

## License

Do whatever you like with the page's code. The film metadata (titles, years, ratings) belongs to IMDb and is used here for a personal, non-commercial catalogue; the descriptions were written for this project.
