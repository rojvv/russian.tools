<script lang="ts">
import { afterNavigate, replaceState } from "$app/navigation";
import { page } from "$app/state";
import {
  abbreviationCopy,
  findAbbreviations,
  readAbbreviationQuery,
  searchAbbreviations,
  writeAbbreviationQuery,
} from "$lib/abbreviation";
import {
  abbreviationCategories,
  type AbbreviationCategory,
  abbreviations,
} from "$lib/abbreviation-data";
import { getI18n } from "$lib/i18n-context";
import Seo from "$lib/Seo.svelte";
import { onMount, untrack } from "svelte";

const i18n = getI18n();
const locale = $derived(i18n.locale === "ru" ? "ru" : "en");
const copy = $derived(abbreviationCopy[locale]);
const initial = untrack(() => readAbbreviationQuery(page.url));
let query = $state(initial.query);
let directory = $state(initial.directory);
let category = $state(initial.category);
const exact = $derived(findAbbreviations(query));
const partial = $derived(
  query.trim() && !exact.length ? searchAbbreviations(query) : [],
);
const matches = $derived(exact.length ? exact : partial.slice(0, 8));
const entries = $derived(searchAbbreviations(directory, category));

function persist() {
  const current = new URL(window.location.href);
  const next = writeAbbreviationQuery(current, { query, directory, category });
  if (next.href !== current.href) replaceState(next, page.state);
}

function restore(url: URL) {
  const state = readAbbreviationQuery(url);
  query = state.query;
  directory = state.directory;
  category = state.category;
}

afterNavigate(({ type }) => {
  if (type !== "enter") restore(new URL(window.location.href));
});

onMount(() => {
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

function lookupLink(short: string): string {
  const next = writeAbbreviationQuery(
    new URL("https://russian.tools/abbreviation"),
    {
      query: short,
      directory,
      category,
    },
  );
  next.searchParams.set("lang", locale);
  return `${next.pathname}${next.search}#decoder`;
}
</script>

<Seo
  title={`${i18n.t("abbreviationTitle")} | russian.tools`}
  description={copy.description}
  canonical="https://russian.tools/abbreviation"
  noindex={Boolean(query || directory || category)}
/>

<section id="decoder" aria-label={i18n.t("abbreviationTitle")}>
  <form
    action="/abbreviation"
    method="GET"
    onsubmit={(event) => {
      event.preventDefault();
      persist();
    }}
  >
    <label for="abbreviation-query">{copy.input}</label>
    <input type="hidden" name="lang" value={locale} />
    <input type="hidden" name="directory" value={directory} />
    <input type="hidden" name="category" value={category} />
    <input
      id="abbreviation-query"
      name="q"
      type="search"
      bind:value={query}
      oninput={(event) => {
        query = event.currentTarget.value;
        persist();
      }}
      maxlength="120"
      placeholder={copy.placeholder}
      aria-describedby="abbreviation-hint"
      spellcheck="false"
      autocapitalize="off"
    />

    <p id="abbreviation-hint" class="hint">{copy.hint}</p>
  </form>

  {#if query.trim()}
    <div class="results">
      <h2>{exact.length ? copy.results : copy.partial}</h2>
      <p role="status" class="result-status">
        {#if !matches.length}{copy.empty}{:else if exact.length > 1}{
            copy.ambiguous
          }{:else}{copy.count} {matches.length}{/if}
      </p>
      <div class="result-grid">
        {#each matches as entry (entry.id)}
          <article>
            <span class="subject">{
              abbreviationCategories[entry.category][locale]
            }</span>
            <h3>
              <a href={lookupLink(entry.short)} lang="ru">{entry.short}</a>
            </h3>
            <p class="expansion" lang="ru">{entry.expansion}</p>
            <p class="gloss" lang="en">
              <span class="sr-only">{copy.gloss}: </span>{entry.english}
            </p>
            {#if entry.aliases.length}
              <p class="hint">
                {copy.variants}
                {#each entry.aliases as alias, index}{#if index > 0},
                  {/if}<a href={lookupLink(alias)} lang="ru">{alias}</a>{/each}
              </p>
            {/if}
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
    action="/abbreviation"
    method="GET"
    onsubmit={(event) => {
      event.preventDefault();
      persist();
    }}
  >
    <input type="hidden" name="lang" value={locale} />
    <input type="hidden" name="q" value={query} />
    <label for="directory-query">{copy.directorySearch}</label>
    <input
      id="directory-query"
      name="directory"
      type="search"
      bind:value={directory}
      oninput={(event) => {
        directory = event.currentTarget.value;
        persist();
      }}
      maxlength="120"
      placeholder={copy.directoryPlaceholder}
      spellcheck="false"
      autocapitalize="off"
    />

    <div class="filter">
      <label for="category">{copy.category}</label>
      <select
        id="category"
        name="category"
        bind:value={category}
        onchange={(event) => {
          category = event.currentTarget.value as AbbreviationCategory | "";
          persist();
        }}
      >
        <option value="">{copy.all}</option>
        {#each Object.entries(abbreviationCategories) as [key, label]}
          <option value={key}>{label[locale]}</option>
        {/each}
      </select>
    </div>
  </form>
  <p class="count" role="status">
    {copy.count} {entries.length} {copy.of} {abbreviations.length}
  </p>
  {#if entries.length}
    <table>
      <thead>
        <tr>
          <th scope="col">{copy.short}</th>
          <th scope="col">{copy.expansion}</th>
        </tr>
      </thead>
      <tbody>
        {#each entries as entry (entry.id)}
          <tr>
            <th scope="row">
              <a href={lookupLink(entry.short)} lang="ru">{entry.short}</a>
              <span class="subject">{
                abbreviationCategories[entry.category][locale]
              }</span>
            </th>
            <td>
              <span lang="ru">{entry.expansion}</span>
              <span class="gloss" lang="en"><span class="sr-only">{copy.gloss}:
                </span>{entry.english}</span>
              {#if entry.aliases.length}
                <span class="aliases">{copy.variants} <span lang="ru">{
                    entry.aliases.join(", ")
                  }</span></span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}<p>{copy.empty}</p>{/if}
</section>
<p class="scope">{copy.scope}</p>

<style>
#decoder { margin-top: 8px; scroll-margin-top: 24px; }
label { display: block; font-weight: 500; margin-bottom: 10px; }
input[type="search"], select { min-height: 48px; padding: 10px 14px; font: inherit; color: var(--foreground); background: var(--background); border: 1px solid var(--border); border-radius: 4px; }
input[type="search"] { width: 100%; min-width: 0; }
input::placeholder { color: var(--placeholder); }
.hint, .result-status { margin-top: 10px; font-size: 13px; }
.results { margin-top: 28px; }
h2 { font-size: 20px; font-weight: 500; margin: 0 0 16px; }
.result-status { margin-bottom: 16px; }
.result-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
article { border: 1px solid var(--border); border-radius: 4px; padding: 20px; overflow-wrap: anywhere; }
h3 { font-size: 24px; font-weight: 500; margin: 4px 0 8px; }
h3 a { text-decoration: none; }
.expansion { color: var(--foreground); }
.subject, .aliases { display: block; color: var(--muted); font-size: 12px; font-weight: 400; }
.gloss { display: block; margin-top: 4px; font-size: 13px; color: var(--muted); }
.directory { margin-top: 36px; border-top: 1px solid var(--border); padding-top: 28px; }
.filter { display: flex; align-items: center; gap: 12px; margin-top: 16px; }
.filter label { margin: 0; }
select { max-width: 100%; min-width: 0; }
.count { font-size: 12px; margin: 16px 0 8px; }
table { width: 100%; table-layout: fixed; border-collapse: collapse; }
th, td { text-align: left; vertical-align: top; padding: 16px 8px; border-bottom: 1px solid var(--border); overflow-wrap: anywhere; }
th { font-weight: 500; }
thead th { font-size: 13px; }
th:first-child { width: 28%; padding-left: 0; }
tbody .subject, .aliases { margin-top: 4px; }
.scope { margin-top: 24px; font-size: 13px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (max-width: 600px) { .result-grid { grid-template-columns: minmax(0, 1fr); } th:first-child { width: 34%; } th, td { padding-right: 0; } .filter { align-items: stretch; flex-direction: column; gap: 6px; } }
</style>
