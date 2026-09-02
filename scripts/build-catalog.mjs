import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(root, 'data/films.json');
const browserPath = resolve(root, 'data/films.js');
const csvPath = resolve(root, 'data/films.csv');
const checkOnly = process.argv.includes('--check');

const requiredStrings = [
  'imdb_id', 'title', 'title_uk', 'country', 'country_main', 'region',
  'language', 'theme', 'who_what', 'basis', 'decade', 'desc'
];
const allowedBasis = new Set([
  'реальна історія',
  'натхненний реальними подіями',
  'реальне тло, вигадані герої'
]);

function fail(message) {
  throw new Error(`Помилка каталогу: ${message}`);
}

function validateFilm(film, index, seenIds) {
  const label = `запис ${index + 1}`;
  if (!film || typeof film !== 'object' || Array.isArray(film)) fail(`${label} має бути об'єктом`);

  for (const field of requiredStrings) {
    if (typeof film[field] !== 'string' || !film[field].trim()) {
      fail(`${label}: поле "${field}" має бути непорожнім текстом`);
    }
  }
  if (!/^tt\d+$/.test(film.imdb_id)) fail(`${label}: некоректний imdb_id "${film.imdb_id}"`);
  if (seenIds.has(film.imdb_id)) fail(`${label}: imdb_id "${film.imdb_id}" повторюється`);
  seenIds.add(film.imdb_id);

  if (!Number.isInteger(film.year) || film.year < 1888 || film.year > 2100) {
    fail(`${label}: некоректний рік`);
  }
  if (typeof film.rating !== 'number' || film.rating < 0 || film.rating > 10) {
    fail(`${label}: рейтинг має бути числом від 0 до 10`);
  }
  if (!Number.isInteger(film.votes) || film.votes < 0) fail(`${label}: votes має бути цілим невід'ємним числом`);
  if (!Array.isArray(film.genres) || !film.genres.length || film.genres.some(v => typeof v !== 'string' || !v)) {
    fail(`${label}: genres має бути непорожнім масивом текстових значень`);
  }
  if (!allowedBasis.has(film.basis)) fail(`${label}: невідомий рівень достовірності "${film.basis}"`);
  if (typeof film.thriller_flag !== 'boolean') fail(`${label}: thriller_flag має бути true або false`);
  if (film.note !== null && typeof film.note !== 'string') fail(`${label}: note має бути текстом або null`);

  const expectedDecade = `${Math.floor(film.year / 10) * 10}-ті`;
  if (film.decade !== expectedDecade) {
    fail(`${label}: decade має бути "${expectedDecade}" для ${film.year} року`);
  }
}

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function makeCsv(films) {
  const columns = [
    'imdb_id', 'title', 'title_uk', 'year', 'imdb_rating', 'votes', 'country',
    'region', 'language', 'theme', 'genres', 'basis', 'thriller_tag', 'decade',
    'note', 'description', 'imdb_url'
  ];
  const rows = films.map(film => [
    film.imdb_id, film.title, film.title_uk, film.year, film.rating.toFixed(1), film.votes,
    film.country, film.region, film.language, film.theme, film.genres.join('; '), film.basis,
    film.thriller_flag ? 'так' : '', film.decade, film.note, film.desc,
    `https://www.imdb.com/title/${film.imdb_id}/`
  ]);
  return `\uFEFF${[columns, ...rows].map(row => row.map(csvCell).join(',')).join('\n')}\n`;
}

const raw = await readFile(sourcePath, 'utf8');
let source;
try {
  source = JSON.parse(raw);
} catch (error) {
  fail(`data/films.json не є коректним JSON (${error.message})`);
}
if (!source || typeof source !== 'object' || !Array.isArray(source.films)) {
  fail('data/films.json повинен містити масив "films"');
}

const seenIds = new Set();
source.films.forEach((film, index) => validateFilm(film, index, seenIds));

const catalogue = {
  source: source.source || 'Movies: based on true story',
  built: source.built || '',
  count: source.films.length,
  films: source.films
};
const browserFile = `// Згенеровано з films.json. Не редагуйте цей файл вручну.\nwindow.MOVIE_CATALOG=${JSON.stringify(catalogue)};\n`;
const csvFile = makeCsv(source.films);

if (checkOnly) {
  const [currentBrowser, currentCsv] = await Promise.all([
    readFile(browserPath, 'utf8').catch(() => ''),
    readFile(csvPath, 'utf8').catch(() => '')
  ]);
  if (currentBrowser !== browserFile || currentCsv !== csvFile) {
    fail('згенеровані файли застаріли. Запустіть: node scripts/build-catalog.mjs');
  }
  console.log(`Каталог перевірено: ${source.films.length} фільмів, дублікати відсутні.`);
} else {
  await Promise.all([
    writeFile(browserPath, browserFile),
    writeFile(csvPath, csvFile)
  ]);
  console.log(`Готово: ${source.films.length} фільмів записано в data/films.js і data/films.csv.`);
}
