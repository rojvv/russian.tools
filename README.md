# russian.tools

A collection of browser-based Russian language tools, built with SvelteKit and TypeScript.

## Development

Use Node.js 24 or later and pnpm 12.4.2.

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

The first tool adds Russian vowel stress marks with [`@roj/rustress`](https://jsr.io/@roj/rustress) 0.0.8. The home page lists available tools. At `/stress`, type or paste into a single editor and accents appear directly in the text. Stress is recomputed after edits, preserving the cursor, selection, whitespace, and scroll position. Composition input is allowed to finish before marking. Input is limited to 20,000 characters (including accents).

Inference runs in a module Web Worker, with debounced requests, bounded inference batches, and stale-result suppression. The dictionary, model, ONNX WebAssembly runtime, and Open Sans fonts are served locally; text is never submitted to a server. After the engine loads, processing works without a network connection. Reloading offline requires the site's assets to be available in the browser cache; this is not an offline-installable app.

The runtime has an approximately 14 MB WebAssembly asset (about 3.7 MB with gzip). Enable compression and caching on the deployment host. A modern browser supporting WebAssembly, module workers, and ES2023 is required. Clipboard access requires HTTPS or localhost. Predictions may be uncertain or context-dependent and should be reviewed.

Open Sans's variable font and their SIL Open Font License are in `static/fonts`.

## Cloudflare Workers deployment

The app uses `@sveltejs/adapter-cloudflare` with Workers Static Assets. `wrangler.jsonc` defines the `russian-tools` Worker and its `ASSETS` binding. Pages are server-rendered so language cookies, browser language preferences, and conjugation query URLs work on the first request. Dictionary, model, WASM, and font files are deployed as static assets; SvelteKit adds immutable caching for fingerprinted assets.

```sh
pnpm install --frozen-lockfile
pnpm check
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

At `/conjugation`, type a Russian infinitive to automatically look up its forms in a locally hosted OpenRussian dictionary of 14,870 entries. Partial input uses a clearly labeled closest match (prefixes first, then edit distance). Select the intended entry for homonyms, or the intended aspect for a verb with both aspects. View compact singular/plural lists for present, future, past, and imperative forms. Tense sections sit side by side on wide screens and stack on smaller screens. Perfective entries have no present tense; imperfective futures use быть plus the infinitive (with a special case for быть itself). Missing forms are left blank.

Share a verb with a bare query string, for example `/conjugation?читать`. The first query entry initializes the textbox (named values such as `?verb=читать` also work). Typing replaces the URL query without adding history entries; clearing the field clears the query. Server rendering includes the matching forms in the initial HTML, even without JavaScript. Browser autofill and form restoration trigger lookup on startup. The client dictionary loads only when a new lookup is needed; initial server results do not require downloading the entire dictionary. It comes from an older OpenRussian export and can contain errors; review the dictionary forms before using them. Source, revision, transformations, and the CC BY-SA 4.0 data license are recorded in `static/data/verbs-SOURCE.md` and `static/data/verbs-LICENSE.txt`. Rebuild the data with `python3 scripts/import-verbs.py /path/to/verbs.csv`.

Run conjugation checks with `node --test tests/*.test.mjs` (Node 24 or later).

## Language and appearance

The interface uses `sveltekit-i18n` v3 for English and Russian translations. Each layout tree gets its own library instance, keeping concurrent SSR requests isolated; the small catalogs are preloaded for immediate rendering and switching. On the first visit, the server follows the browser's preferred supported language; the header language switch saves a persistent `language` cookie for server rendering. Browsers cap its lifetime at up to 400 days, and it is renewed on visits. Without a valid cookie, the server uses the `Accept-Language` HTTP header, falling back to English when no supported language is preferred. Switching languages updates the interface without resetting the editor or verb query. Dictionary glosses remain in English and are labeled accordingly in the Russian interface.

Appearance always follows the system color scheme through CSS (`prefers-color-scheme`), including before hydration. Dark mode uses a pure `#000` background across the page, editor, and inputs. There is no theme selector; older theme cookies are ignored. The language attribute is rendered on the server.
