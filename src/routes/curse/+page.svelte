<script lang="ts">
import { afterNavigate, replaceState } from "$app/navigation";
import { page } from "$app/state";
import {
  curseCopy,
  readCurseQuery,
  searchCurses,
  writeCurseQuery,
} from "$lib/curse";
import {
  type CurseLevel,
  curseLevels,
  type CurseType,
  curseTypes,
  curseWords,
} from "$lib/curse-data";
import CurseEntryCard from "$lib/CurseEntryCard.svelte";
import { getI18n } from "$lib/i18n-context";
import { languagePath } from "$lib/seo";
import Seo from "$lib/Seo.svelte";
import { onMount, untrack } from "svelte";

const i18n = getI18n();
const locale = $derived(i18n.locale === "ru" ? "ru" : "en");
const copy = $derived(curseCopy[locale]);
const initial = untrack(() => readCurseQuery(page.url));
let query = $state(initial.query);
let level = $state(initial.level);
let type = $state(initial.type);
const entries = $derived(searchCurses(query, level, type));
const filtered = $derived(Boolean(query || level || type));

function persist() {
  const current = new URL(window.location.href);
  const next = writeCurseQuery(current, { query, level, type });
  if (next.href !== current.href) replaceState(next, page.state);
}
function restore() {
  const state = readCurseQuery(new URL(window.location.href));
  query = state.query;
  level = state.level;
  type = state.type;
}
afterNavigate(({ type }) => {
  if (type !== "enter") restore();
});
onMount(() => {
  const startup = setTimeout(persist, 0);
  const restorePage = (event: PageTransitionEvent) => {
    if (event.persisted) restore();
  };
  window.addEventListener("popstate", restore);
  window.addEventListener("pageshow", restorePage);
  return () => {
    clearTimeout(startup);
    window.removeEventListener("popstate", restore);
    window.removeEventListener("pageshow", restorePage);
  };
});
</script>

<Seo
  title={`${i18n.t("curseTitle")} | russian.tools`}
  description={copy.description}
  canonical="https://russian.tools/curse"
  noindex={filtered}
/>

<p>{copy.intro}</p>
<form
  action="/curse"
  method="GET"
  onsubmit={(event) => {
    event.preventDefault();
    persist();
  }}
>
  <input type="hidden" name="lang" value={locale} />
  <label for="curse-query">{copy.search}</label>
  <input
    id="curse-query"
    name="q"
    type="search"
    bind:value={query}
    oninput={(event) => {
      query = event.currentTarget.value;
      persist();
    }}
    maxlength="120"
    placeholder={copy.placeholder}
    aria-describedby="search-hint"
    spellcheck="false"
    autocapitalize="off"
  />
  <p id="search-hint" class="hint">{copy.hint}</p>
  <div class="filters">
    <div>
      <label for="curse-level">{copy.level}</label>
      <select
        id="curse-level"
        name="level"
        bind:value={level}
        onchange={(event) => {
          level = event.currentTarget.value as CurseLevel | "";
          persist();
        }}
      >
        <option value="">{copy.allLevels}</option>
        {#each Object.entries(curseLevels) as [value, label]}
          <option {value}>{label[locale]}</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="curse-type">{copy.type}</label>
      <select
        id="curse-type"
        name="type"
        bind:value={type}
        onchange={(event) => {
          type = event.currentTarget.value as CurseType | "";
          persist();
        }}
      >
        <option value="">{copy.allTypes}</option>
        {#each Object.entries(curseTypes) as [value, label]}
          <option {value}>{label[locale]}</option>
        {/each}
      </select>
    </div>
  </div>
  <noscript><button class="native-submit" type="submit">
      {copy.submit}
    </button></noscript>
</form>

<div class="results-bar" id="curse-results">
  <p role="status">
    {copy.count} {entries.length} {copy.of} {curseWords.length}
  </p>
  {#if filtered}
    <a href={languagePath("/curse", locale)}>{copy.clear}</a>
  {/if}
</div>
<div class="entries">
  {#each entries as entry (entry.id)}
    <CurseEntryCard {entry} {locale} linked />
  {:else}
    <p class="empty">{copy.empty}</p>
  {/each}
</div>
<p class="scope">{copy.scope}</p>
<p class="hint">
  {copy.attribution} <a href="https://creativecommons.org/licenses/by-sa/4.0/"
  >CC BY-SA 4.0</a>.
  <a href={languagePath("/acknowledgements", locale)}>{
    locale === "ru" ? "Источники" : "Sources"
  }</a>
</p>

<style>
form { margin-top: 24px; }
label { display: block; font-weight: 500; margin-bottom: 8px; }
input[type="search"], select { width: 100%; min-width: 0; min-height: 48px; padding: 10px 14px; border: 1px solid var(--border); border-radius: 4px; background: var(--background); color: var(--foreground); font: inherit; }
input::placeholder { color: var(--placeholder); }
.hint { margin-top: 8px; font-size: 13px; }
.filters { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 20px; }
.results-bar { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; margin: 24px 0 12px; font-size: 13px; }
.entries { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.scope { margin-top: 24px; font-size: 13px; }
.empty { grid-column: 1 / -1; padding: 24px 0; }
@media (max-width: 600px) { .entries, .filters { grid-template-columns: minmax(0, 1fr); } }
</style>
