<script lang="ts">
import { afterNavigate, replaceState } from "$app/navigation";
import { page } from "$app/state";
import {
  diminutiveCopy,
  findNames,
  normalizeName,
  readDiminutiveQuery,
  searchNames,
  writeDiminutiveQuery,
} from "$lib/diminutive";
import { russianNames } from "$lib/diminutive-data";
import { getI18n } from "$lib/i18n-context";
import { matchesSearch } from "$lib/search-text";
import Seo from "$lib/Seo.svelte";
import { onMount, untrack } from "svelte";

const i18n = getI18n();
const locale = $derived(i18n.locale === "ru" ? "ru" : "en");
const copy = $derived(diminutiveCopy[locale]);
const initial = untrack(() => readDiminutiveQuery(page.url));
let query = $state(initial.query);
let directory = $state(initial.directory);
const exact = $derived(findNames(query));
const partial = $derived(
  normalizeName(query) && !exact.length ? searchNames(query) : [],
);
const matches = $derived(exact.length ? exact : partial.slice(0, 8));
const entries = $derived(searchNames(directory));

function persist() {
  const current = new URL(window.location.href);
  const next = writeDiminutiveQuery(current, { query, directory });
  if (next.href !== current.href) replaceState(next, page.state);
}

function restore(url: URL) {
  const state = readDiminutiveQuery(url);
  query = state.query;
  directory = state.directory;
}

afterNavigate(({ type }) => {
  if (type !== "enter") restore(new URL(window.location.href));
});

onMount(() => {
  // Bindings can restore text entered before hydration without an input event.
  // Wait for the router to initialize before preserving that text in the URL.
  const startup = setTimeout(persist, 0);
  const restoreHistory = () => restore(new URL(window.location.href));
  const restorePage = (event: PageTransitionEvent) => {
    if (event.persisted) restoreHistory();
  };
  window.addEventListener("popstate", restoreHistory);
  window.addEventListener("pageshow", restorePage);
  return () => {
    clearTimeout(startup);
    window.removeEventListener("popstate", restoreHistory);
    window.removeEventListener("pageshow", restorePage);
  };
});

function lookupLink(name: string): string {
  const next = writeDiminutiveQuery(
    new URL("https://russian.tools/diminutive"),
    { query: name, directory },
  );
  next.searchParams.set("lang", locale);
  return `${next.pathname}${next.search}#finder`;
}
</script>

<Seo
  title={`${i18n.t("diminutiveTitle")} | russian.tools`}
  description={copy.description}
  canonical="https://russian.tools/diminutive"
  noindex={Boolean(query || directory)}
/>

<section id="finder" aria-label={i18n.t("diminutiveTitle")}>
  <form
    action="/diminutive"
    method="GET"
    onsubmit={(event) => {
      event.preventDefault();
      persist();
    }}
  >
    <label for="name-query">{copy.input}</label>
    <input type="hidden" name="lang" value={locale} />
    <input type="hidden" name="directory" value={directory} />
    <input
      id="name-query"
      name="q"
      type="search"
      bind:value={query}
      oninput={(event) => {
        query = event.currentTarget.value;
        persist();
      }}
      maxlength="100"
      placeholder={copy.placeholder}
      aria-describedby="name-hint"
      spellcheck="false"
      autocapitalize="off"
    />
    <p id="name-hint" class="hint">{copy.hint}</p>
  </form>

  {#if normalizeName(query)}
    <div class="results">
      <h2>{exact.length ? copy.results : copy.partial}</h2>
      <p role="status" class="result-status">
        {#if !matches.length}{copy.empty}{:else if exact.length > 1}{
            copy.ambiguous
          }{:else}{copy.count} {matches.length}{/if}
      </p>
      <div class="result-grid">
        {#each matches as entry (entry.name)}
          <article>
            <div class="entry-heading">
              <h3>
                <a href={lookupLink(entry.name)} lang="ru">{entry.name}</a>
              </h3>
              <span class="gender">{i18n.t(entry.gender)}</span>
            </div>
            {#if entry.aliases?.length}<p class="aliases">
                {copy.variants} <span lang="ru">{
                  entry.aliases.join(", ")
                }</span>
              </p>{/if}
            <p class="form-label">{copy.forms}</p>
            <ul class="forms" lang="ru">
              {#each entry.forms as form}
                <li>
                  <a
                    href={lookupLink(form)}
                    class:matched={matchesSearch(form, query)}
                  >{form}</a>
                </li>
              {/each}
            </ul>
          </article>
        {/each}
      </div>
      {#if partial.length > 8}<p class="hint">{copy.more}</p>{/if}
    </div>
  {/if}
</section>

<section class="directory" aria-labelledby="directory-heading">
  <h2 id="directory-heading">{copy.directory}</h2>
  <form
    action="/diminutive"
    method="GET"
    onsubmit={(event) => {
      event.preventDefault();
      persist();
    }}
  >
    <label for="directory-query">{copy.directorySearch}</label>
    <input type="hidden" name="lang" value={locale} />
    <input type="hidden" name="q" value={query} />
    <input
      id="directory-query"
      name="directory"
      type="search"
      bind:value={directory}
      oninput={(event) => {
        directory = event.currentTarget.value;
        persist();
      }}
      maxlength="100"
      placeholder={copy.directoryPlaceholder}
      spellcheck="false"
      autocapitalize="off"
    />
  </form>
  <p class="count" role="status">
    {copy.count} {entries.length} {copy.of} {russianNames.length}
  </p>
  {#if entries.length}
    <table>
      <thead>
        <tr>
          <th scope="col">{copy.fullName}</th>
          <th scope="col">{copy.forms}</th>
        </tr>
      </thead>
      <tbody>
        {#each entries as entry (entry.name)}
          <tr>
            <th scope="row">
              <a href={lookupLink(entry.name)} lang="ru">{entry.name}</a>
              <span class="gender">{i18n.t(entry.gender)}</span>
              {#if entry.aliases?.length}<span class="aliases" lang="ru">{
                  entry.aliases.join(", ")
                }</span>{/if}
            </th>
            <td>
              <ul class="forms" lang="ru">
                {#each entry.forms as form}<li>
                    <a href={lookupLink(form)}>{form}</a>
                  </li>{/each}
              </ul>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}<p>{copy.empty}</p>{/if}
</section>

<p class="scope">{copy.scope}</p>

<style>
#finder { margin-top: 32px; scroll-margin-top: 24px; }
label { display: block; font-weight: 500; margin-bottom: 10px; }
input[type="search"] { width: 100%; min-width: 0; min-height: 52px; padding: 12px 16px; font: inherit; color: var(--foreground); background: var(--background); border: 1px solid var(--border); border-radius: 4px; }
input::placeholder { color: var(--placeholder); }
.hint { margin-top: 10px; font-size: 13px; }
.results { margin-top: 32px; }
h2 { font-size: 20px; font-weight: 500; margin: 0 0 16px; }
.result-status { font-size: 13px; margin-bottom: 16px; }
.result-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
article { border: 1px solid var(--border); border-radius: 4px; padding: 20px; }
.entry-heading { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 12px; }
h3 { font-size: 24px; font-weight: 500; margin: 0; }
h3 a { text-decoration: none; }
.gender, .aliases { color: var(--muted); font-size: 12px; font-weight: 400; }
.form-label { font-size: 13px; margin: 16px 0 8px; }
.forms { display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 0; padding: 0; list-style: none; }
.forms a { display: inline-block; padding: 2px 0; }
.matched { font-weight: 600; }
.directory { margin-top: 40px; border-top: 1px solid var(--border); padding-top: 28px; }
.count { font-size: 12px; margin: 16px 0 8px; }
table { width: 100%; table-layout: fixed; border-collapse: collapse; }
th, td { text-align: left; vertical-align: top; padding: 16px 8px; border-bottom: 1px solid var(--border); overflow-wrap: anywhere; }
th { font-weight: 500; }
thead th { font-size: 13px; }
th:first-child { width: 32%; padding-left: 0; }
tbody th .gender, tbody th .aliases { display: block; margin-top: 3px; }
.scope { margin-top: 24px; font-size: 13px; }
@media (max-width: 600px) { .result-grid { grid-template-columns: minmax(0, 1fr); } th:first-child { width: 40%; } th, td { padding-right: 0; } .forms { gap: 4px 12px; } }
</style>
