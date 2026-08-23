# Movies: based on true story

A static site: **317 feature films from 2000–2026 based on real events**, rated 7.4 or higher on IMDb with at least 5,000 votes. Thrillers and horror are kept behind a separate toggle; documentaries, series and TV movies are excluded.

One page, no build step, no dependencies, no backend. All data is embedded in `index.html` — the file opens by double-clicking it from disk.

> The interface and film notes are in Ukrainian. Only the title and this README are in English.

## What's inside

| File | What it is |
|---|---|
| `index.html` | the site itself: catalogue, filters, search, personal marks, export |
| `data/films.json` | the same 317 films as JSON — for any use of your own |
| `data/films.csv` | the same as a table (UTF-8 with BOM, opens in Excel and Numbers) |
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

Just open `index.html` in a browser — the data is baked into the page, no server needed.

If you want it "like production":

```bash
python3 -m http.server 8000
# then http://localhost:8000
```

## Marks and moving them between devices

The "watched" checkboxes, the shared-viewing flag and the 1–5 ratings live in the browser's `localStorage`. There is no backend, so they don't sync between people or devices on their own — you move them by hand:

1. **Export** → **Copy JSON** on the first device
2. **Export** → paste the text into the field → **Import** on the second

Import *merges* marks rather than overwriting them: where the two states differ, the more recent one wins. The export format is plain and fit for further analysis — every film with its metadata, flags, rating and the timestamp of the mark.

Because storage is per-browser and per-origin, two people using the same published URL on different machines still keep entirely separate marks. Nothing you tick is visible to anyone else.

## Update the catalogue

The data is embedded in `index.html` as a `DATA` array (search for `const DATA = [` near the top of the `<script>` block). The same array sits in `data/films.json` under the `films` key. To change the data, edit both places or regenerate `index.html` from your own source.

Record fields:

```
imdb_id, title, title_uk, year, rating, votes, genres[], country,
country_main, region, language, theme, who_what, basis, note,
thriller_flag, decade, desc
```

`basis` is either "real story" or "inspired by real events"; `note` is a caveat about historical accuracy, shown in red; `thriller_flag` hides the film behind the "+ thrillers" button.

## How the list was assembled

Candidates were gathered by decade and by region: lists of biographical and historical films, per-year wiki lists of "films based on actual events", and a separate sweep of Asian cinema. The rating, vote count, year and title type of every film were verified against IMDb's rating API — not taken from search snippets, which are often stale.

Data as of **23 August 2026**.

Excluded: documentaries, series, TV movies and recorded stage productions; fiction set against a real backdrop ("1917", "All Quiet on the Western Front", "Blood Diamond", "RRR"); films with fewer than 5,000 votes; anything released before 2000.

India accounts for 81 of the 317 entries. That isn't sampling bias — Indian audiences rate systematically higher, so more Indian films clear the 7.4 threshold. The region filter sorts this out.

## License

Do whatever you like with the page's code. The film metadata (titles, years, ratings) belongs to IMDb and is used here for a personal, non-commercial catalogue; the descriptions were written for this project.
