# russian.tools

A collection of browser-based Russian language tools, built with SvelteKit and TypeScript.

## Development

Use Node.js 24 or later and pnpm 12.4.2. When using Corepack, version
0.34.5 or newer is required for pnpm's `.mjs` entry point. For Node.js 24.0–24.14,
Corepack 0.34.7 is a compatible release:

```sh
npm install --global corepack@0.34.7
corepack enable pnpm
```

If an older Corepack already cached pnpm with a `bin/pnpm.cjs` path, run
`corepack cache clean` once after updating, then retry `pnpm install`.
[Corepack's fix](https://github.com/nodejs/corepack/releases/tag/v0.34.5).

```sh
pnpm install
pnpm dev
```

```sh
pnpm check
pnpm build
pnpm preview
```

## Stress Marker

The first tool adds Russian vowel stress marks with [`@roj/rustress`](https://jsr.io/@roj/rustress) 0.0.10. The home page lists available tools. At `/stress`, type or paste into a single editor and accents appear directly in the text. Stress is recomputed after edits, preserving the cursor, selection, whitespace, and scroll position. Composition input is allowed to finish before marking. Input is limited to 20,000 characters (including accents).

Inference runs in a module Web Worker, with debounced requests, bounded inference batches, and stale-result suppression. The dictionary, model, ONNX WebAssembly runtime, and Golos Text fonts are served locally; text is never submitted to a server. After the engine loads, processing works without a network connection. Reloading offline requires the site's assets to be available in the browser cache; this is not an offline-installable app.

The runtime has an approximately 14 MB WebAssembly asset (about 3.7 MB with gzip). Enable compression and caching on the deployment host. A modern browser supporting WebAssembly, module workers, and ES2023 is required. Clipboard access requires HTTPS or localhost. Predictions may be uncertain or context-dependent and should be reviewed.

Golos Text's variable font (weights 400–900) and SIL Open Font License are in `static/fonts`. The font supports Cyrillic text and combining acute stress marks; it is hosted locally without external font requests. Source: [Google Fonts](https://github.com/google/fonts/tree/main/ofl/golostext).

## Stress Practice

At `/stress-practice`, paste Russian text or use the sample passage to practice
word stress. Each question shows a word in its original context with selectable
vowels. An answer reveals the expected stress; only correct first answers earn
points. You can reveal an answer without scoring, view your final score, retry
the exercise, or edit the source text.

The existing stress worker prepares exercises entirely in the browser. Supplied
acute stress marks are preserved, and unmarked words use the engine's predictions,
which may need review. The exercise skips monosyllables, compounds, mixed-script
tokens, and words without one identifiable stress. Explicit accents take precedence
over ё; otherwise a single ё identifies stress. Text is limited to 20,000 characters.
English and Russian interfaces, keyboard controls, and both system color schemes
are supported.

## Cloudflare Workers deployment

The app uses `@sveltejs/adapter-cloudflare` with Workers Static Assets. `wrangler.jsonc` defines the `russian-tools` Worker and its `ASSETS` binding. Pages are server-rendered so language cookies, browser language preferences, and conjugation query URLs work on the first request. Dictionary, model, WASM, and font files are deployed as static assets; SvelteKit adds immutable caching for fingerprinted assets.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm build:index
node --test tests/*.test.mjs
pnpm deploy:check  # build and bundle locally without publishing
pnpm preview:worker  # build and serve in the local Workers runtime
```

To publish from your machine:

```sh
pnpm exec wrangler login
pnpm run deploy
```

For Cloudflare Workers Builds, use `pnpm build` as the build command and `pnpm exec wrangler deploy` as the deploy command, with Node.js 24 and the repository root as the project root. For other CI systems, supply `CLOUDFLARE_API_TOKEN` (Workers deployment permissions) and `CLOUDFLARE_ACCOUNT_ID` as CI secrets. The app requires no runtime secrets or database bindings. Connect a custom domain through the Worker's Domains & Routes settings after deployment.

## Verb Conjugator

At `/conjugator`, type a Russian infinitive or inflected form (for example `шёл` → `идти`) to automatically look up its forms in a locally hosted OpenRussian dictionary of 15,300 entries. Partial input uses a clearly labeled closest match (prefixes first, then edit distance). Exact dictionary forms take priority over spelling suggestions; compound futures such as `буду читать` are supported. Select the intended entry for ambiguous forms or homonyms, or the intended aspect for a verb with both aspects. View present and future columns alongside compact imperative and past tables. Tense sections sit side by side on wide screens and stack on smaller screens. Perfective entries have no present tense; imperfective futures use быть plus the infinitive (with a special case for быть itself). Missing forms are left blank.

Share a verb with a bare query string, for example `/conjugator?читать`. The first query entry initializes the textbox (named values such as `?verb=читать` also work). Typing replaces the URL query without adding history entries; clearing the field clears the query. Server rendering includes the matching forms in the initial HTML, even without JavaScript. Browser autofill and form restoration trigger lookup on startup. The client dictionary loads only when a new lookup is needed; initial server results do not require downloading the entire dictionary. It uses the OpenRussian public database export retrieved on 2026-09-22 and can contain errors; review the dictionary forms before using them. Source, revision, transformations, and the CC BY-SA 4.0 data license are recorded in `static/data/verbs-SOURCE.md`. Rebuild the data with `python3 scripts/import-verbs.py scripts/data/openrussian-verbs-2026-09-22.tsv.gz`.

Run conjugation checks with `node --test tests/*.test.mjs` (Node 24 or later).

## Cyrillic to Latin Transliteration

At `/transliterate`, convert Russian text to Latin letters using the letter mappings
used for Russian international passports, based on
[ICAO Doc 9303, Part 3, section 6B](https://www.icao.int/sites/default/files/publications/DocSeries/9303_p3_cons_en.pdf#page=35).
Russian consular guidance identifies ICAO as the passport transliteration standard:
[Russian Consulate FAQ](https://dk.kdmid.ru/ru/consular-functions/chasto-zadavaemye-voprosy/).
For example, `Юлия Щербакова` becomes `Iuliia Shcherbakova` and `Дмитрий` becomes
`Dmitrii`. The mappings include ё → e, й → i, ю → iu, я → ia, ъ → ie; ь is omitted.

Conversion runs immediately in the browser with no dependencies or network
requests for text processing. Both interface languages, copy with manual-selection
fallback, and clear are supported. Input is limited to 20,000 characters. The tool
preserves text case (including all-capital words), punctuation, whitespace, and
non-Russian characters; Russian combining acute stress marks are removed and
decomposed ё/й are normalized. It applies the letter mappings to general text,
without forcing passport uppercase formatting or generating a machine-readable
passport line.

Run transliteration checks with `node --test tests/transliteration.test.mjs`.

## Motion Verb Chooser

At `/motion`, choose among 14 standard motion-verb families and common spatial
prefixes, including выезжать / выехать and переезжать / переехать. Basic pairs
distinguish directed movement, habitual trips, movement in different directions,
and past round trips. Prefixed pairs distinguish imperfective and perfective;
inceptive по- forms are presented separately, without inventing aspect partners.
A searchable catalogue links to each selection and to conjugation tables.
English and Russian explanations cover context-dependent meanings such as
переехать (cross by transport or move house). Rare, figurative, and reflexive
derivatives are not exhaustively listed. Choices stay local and survive language
switching. The catalogue uses explicit lexical pairs, not automatic prefixing.
The URL preserves selections and catalogue search using `family`, `meaning`,
`aspect`, `situation`, and `q`, omitting default values. For example,
`/motion?family=air&meaning=base&situation=habit` selects летать. Changes replace
the current history entry; refreshes, shared links, and browser navigation restore
the selection, including in server-rendered HTML. Invalid choices fall back to
valid controls, and language parameters are preserved.

## Verb Prefix Explorer

At `/verb-prefixes`, compare 43 selected meanings across eight everyday verb
families: говорить, читать, писать, делать, учить, смотреть, думать, and работать.
Each card gives a meaning, explicit aspect forms, a usage distinction, and an
original Russian example with an English translation. Infinitives link to the
conjugator. The catalogue includes useful reflexive contrasts such as договорить
versus договориться; movement verbs remain in the Motion Verb Chooser.

Search infinitives in Cyrillic or Latin transliteration, or meanings in English
or Russian. Search finds whole families and marks matching cards so neighboring
meanings remain visible. A separate family selector clears the search and browses
one family or all eight. The initial view shows говорить. Both controls work as
GET forms without JavaScript; live searches run locally after loading.

Selections are shareable through `family` and `q`, for example
`/verb-prefixes?q=dogovorit&lang=en` or
`/verb-prefixes?family=read&lang=ru`. Server rendering, browser history, language
switching, responsive layouts, and system color schemes are supported. The base
tool pages appear in both language sitemaps; searches and other family selections
are noindex. No dictionary download is needed for exploration.

The catalogue lists actual lexical forms rather than generating prefixed words.
It covers selected meanings, not every derivative or sense. Editorial notes and
reference checks are in `src/lib/verb-prefixes-SOURCE.md`. Run
`node --test tests/verb-prefix.test.mjs tests/seo-http.test.mjs`.

## Name Diminutive Finder

At `/diminutive`, search by a Russian full name or a short or affectionate form.
Shared forms show every listed parent: `Саша` finds Александр and Александра,
and `Женя` finds Евгений and Евгения. A separate alphabetical directory searches
both full names and diminutives. Every displayed form links back to the finder.
Exact results take priority; partial matches are labeled separately.

The curated list contains 91 names, with selected familiar and affectionate forms
and full-name spelling variants. It is not exhaustive. Capitalization, stress
marks, and е/ё differences are ignored. The interface supports English, Russian,
and system color schemes. Searches run locally after the page loads; shared URLs
such as `/diminutive?q=Саша&directory=Женя&lang=ru` render their results on the
server and work through GET forms without JavaScript. Search URLs are noindex;
the English and Russian tool pages are included in the tools sitemap.

Selection notes and reference links are in `src/lib/diminutives-SOURCE.md`.
Run lookup, reverse mapping, normalization, directory, and URL checks with
`node --test tests/diminutive.test.mjs`.

## Abbreviation Decoder

At `/abbreviation`, look up Russian abbreviations and browse a searchable directory
of 400 meanings across 14 subjects: writing, addresses and housing, documents,
government, business, finance, education, medicine, technology, transport, science,
grammar, history, and informal chat. Each entry includes its Russian expansion,
an English gloss, a subject label, and any listed spelling variants.

Exact lookup retains every listed meaning of ambiguous forms such as `КПП`, `г.`,
and `ЕГРН`. Capitalization, dots, whitespace, stress marks, and е/ё differences are
ignored; Latin transliteration such as `SNILS` is accepted. Slashes and hyphens
remain meaningful. Partial lookup results are labeled separately. The directory
searches abbreviations, expansions, English glosses, and subject labels, with a
separate subject filter. The decoder always shows all listed exact meanings,
independently of the directory filter.

Search state is shareable through `q`, `directory`, and `category`, for example
`/abbreviation?q=КПП&directory=налог&category=documents&lang=ru`. Results render
on the server. Decoding and directory search update automatically while typing;
subject filters apply immediately. Without JavaScript, press Enter in either
search field to submit its GET form. Subsequent searches with JavaScript run locally.
English and Russian interfaces, system color schemes, browser history, and language
switching are supported. Both tool language URLs appear in the sitemap; filtered
and query URLs are noindex.

This is a curated selection, not a complete dictionary or a contextual prediction
engine. See `src/lib/abbreviations-SOURCE.md` for editorial decisions and reference
checks. Run `node --test tests/abbreviation.test.mjs tests/seo-http.test.mjs`.

## Language and appearance

The shared footer links to `/acknowledgements`, which collects the OpenRussian
attribution and data license, name dictionary references, transliteration standard,
stress engine credits, and font license in English and Russian. On short pages the
footer rests at the bottom of the viewport; on long pages it follows the content.

## Latin search

Noun, adjective, verb, name, and motion-directory searches accept Latin
transliteration as well as Cyrillic, including inflected forms and compound verb
forms: `knigami`, `novogo`, `chitat`, `budu chitat`, and `Sasha`. Common spellings
such as `Alyosha` / `Alesha`, `Dmitry` / `Dmitriy` / `Dmitrii`, and `Yuliya` /
`Julia` are accepted. Apostrophes for soft and hard signs are optional. Results
remain in Cyrillic and preserve ambiguous matches. Cyrillic searches retain their
existing exact-spelling priority. Latin matching is transliteration, not English
translation. Dictionary form keys are cached on first use.

## Interface preferences

The interface uses `sveltekit-i18n` v3 for English and Russian translations. Each layout tree gets its own library instance, keeping concurrent SSR requests isolated; the small catalogs are preloaded for immediate rendering and switching. On the first visit, the server follows the browser's preferred supported language; the header language switch saves a persistent `language` cookie for server rendering. Browsers cap its lifetime at up to 400 days, and it is renewed on visits. Without a valid cookie, the server uses the `Accept-Language` HTTP header, falling back to English when no supported language is preferred. Switching languages updates the interface without resetting the editor or verb query. Dictionary glosses remain in English and are labeled accordingly in the Russian interface.

Appearance always follows the system color scheme through CSS (`prefers-color-scheme`), including before hydration. Dark mode uses a pure `#000` background across the page, editor, and inputs. There is no theme selector; older theme cookies are ignored. The language attribute is rendered on the server.

## Noun and Adjective Decliner

At `/decliner`, look up 26,982 noun entries and 41,948 adjective entries from
OpenRussian in one search field. Nouns show all six cases in singular and plural;
adjectives show masculine, feminine, neuter, and plural columns, with separate
animate and inanimate accusative rows. Dictionary stress marks and alternative
forms are preserved. Entries that share a spelling can be selected by part of
speech and meaning. Missing forms display `—`.

Search accepts any form present in the dictionary tables, including alternative
endings: `людьми` → `человек`, `книгами` → `книга`, and `новою` → `новый`.
Stress marks and capitalization are optional; е is accepted for ё when there is
no exact spelling match. Ambiguous forms offer all matching entries, with exact
headwords listed first. Missing dictionary forms cannot be recognized.

The interface includes automatic lookup, separate labels for recognized forms and
closest suggestions, English and Russian labels, and shareable URLs such as `/decliner?книга` and
`/decliner?новый`. Named queries such as `?noun=книга` and `?adjective=новый`
also work. Initial results are server-rendered; subsequent lookups load the
compressed local noun and adjective dictionaries. Noun-only number
restrictions and indeclinable labels remain supported.

The noun dataset comes from the older OpenRussian export and can contain gaps
and errors. Rebuild it with `python3 scripts/import-nouns.py /path/to/nouns.csv`.
The adjective dataset uses the public export retrieved on 2026-09-22. Its source,
license, transformations, checksums, and reproduction instructions are in
`static/data/adjectives-SOURCE.md`. Rebuild the retained snapshot with:

```sh
python3 scripts/import-adjectives.py scripts/data/openrussian-adjectives-2026-09-22.tsv.gz
```

## Dictionary asset size

Noun, verb, and adjective dictionaries are minified and stored as deterministic
`static/data/*.json.gz` files (about 6.6 MiB combined). The import scripts write
these compressed assets directly; the formatter excludes generated dictionaries.
Both browser and server lookups decode them with the native `DecompressionStream`
API. A browser supporting gzip `DecompressionStream` is required for live lookup.
Initial query results remain server-rendered.

Decliner and conjugator server searches use static, partitioned form indexes and
small entry files generated by `pnpm build:index` (also run by `pnpm dev` and
`pnpm build`). Exact Cyrillic and Latin forms, ё folding, homonyms, and prefix
suggestions remain server-rendered. Searches without an exact or prefix match
defer edit-distance suggestions to the browser and require JavaScript. Very
ambiguous forms (over 64 matches or eight entry partitions) also defer to the
browser to bound server work. Worker
requests do not decompress or index the full dictionaries, and retain no global
search cache. Failed partition downloads return a retryable 503.

The generated `static/data/search/` directory is ignored by Git; regenerate it
before running dictionary search or HTTP tests directly. Full compressed
dictionaries remain available for browser tools and build-time sitemaps. The
case game’s server fallback still uses full dictionaries. To verify the upload
bundle locally, run `pnpm deploy:check`.

## Search indexing

English and Russian pages have explicit `lang=en` and `lang=ru` URLs, for example
`/decliner?книга&lang=ru`. The URL language overrides browser preferences and
cookies. Word pages include server-rendered forms, word-specific titles and
headings, localized canonical URLs, and reciprocal `hreflang` links. Inexact
suggestions and invalid queries remain `noindex`.

URLs without a supported language temporarily redirect to the visitor's preferred
language URL (with private, non-cacheable responses). Navigation links point directly
to the explicit language URLs. Exact dictionary spelling and named-query variants
permanently redirect to the same canonical word URL used by the sitemap; tracking
parameters are ignored when reading searches. Dictionary download failures return
`503` with `Retry-After`, so temporary failures do not mark valid entries `noindex`.
Excluded search results omit canonical links to unrelated tool pages.

Run `node --test tests/seo.test.mjs tests/seo-http.test.mjs` to check redirects,
server-rendered metadata, sitemap tool URLs, and temporary dictionary failures.
The HTTP checks start a local Vite server.

`/sitemap.xml` lists separate noun, adjective, and verb sitemaps for each language, keeping
each file below Google's 50,000-URL limit. After deployment, submit
`https://russian.tools/sitemap.xml` in Google Search Console and inspect sample
English and Russian word URLs. Indexing and rankings depend on Google's crawl
and assessment; deploying these changes does not guarantee placement.

## Case Game

At `/case-game`, choose 1–100 questions with common nouns, adjectives, or a mixture. Each question
shows an inflected word and asks for a different case while keeping number and
adjective gender fixed. Starting and target cases are labeled, including adjective
accusative animacy. Forms come from the existing OpenRussian dictionaries, loaded
when a round starts. Missing forms, indeclinable nouns, and unchanged spellings
are skipped. Answers accept dictionary alternatives, optional stress marks, and
е for ё. Typing a correct answer automatically advances to the next word. Checking an incorrect answer or revealing locks the answer; only correct answers score. A live count tracks correct answers, and the final overview shows each prompt, your answer, and the expected forms.
English and Russian interfaces, keyboard input, and system color schemes are supported.

## Virtual Russian Keyboard

At `/keyboard`, type using a clickable standard Russian ЙЦУКЕН layout, including
ё, numbers, punctuation, one-shot Shift, Caps Lock, space, newline, and backspace.
Optional physical-key mapping uses key positions while the text editor is focused;
turn it off to use the installed keyboard layout. Paste, modifier shortcuts, and
composition input are preserved. US key labels help locate Cyrillic letters.

Screen keys insert at the caret or replace the selected text. Backspace removes a
whole preceding grapheme, including emoji or a letter with a combining accent.
Undo and redo cover both screen-key and direct edits, including clearing the text,
with up to 100 previous edits retained. Copy has a manual-selection fallback.
The editor accepts up to 20,000 characters; all text processing stays local.
English and Russian interfaces, responsive keys, and system color schemes are
supported. The page is linked from the home page and both language sitemaps.

Run keyboard logic checks with `node --test tests/keyboard.test.mjs`.

## Latin to Cyrillic

At `/transliterate`, select Latin to Cyrillic to convert common Latin spellings and passport variants
into Russian letters. Ambiguous occurrences show alternatives with source
context (for example, `e` → е/ё/э, `y` → ы/й/и, `ts` → ц/тс).
Each choice updates the copyable result independently. Editing the source resets
choices; long inputs reveal ambiguity controls in batches of 20.

Defaults are mechanical transliteration, not dictionary predictions. Missing
soft signs cannot be restored automatically. Explicit `ʹ` and `ʺ` produce ь
and ъ; doubled apostrophes also produce ъ (`s''est'` → съесть). Apostrophes
following Latin letters offer signs or preserved punctuation.
Case, whitespace, and existing Cyrillic are preserved. Text stays in the browser,
with a 20,000-character input limit and English and Russian interfaces.

Run conversion checks with `node --test tests/latin-to-cyrillic.test.mjs`.

Both conversion directions share `/transliterate`, using `direction=l2c` for Latin
to Cyrillic and `direction=c2l` for Cyrillic to Latin.
