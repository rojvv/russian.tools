<script lang="ts">
import { afterNavigate, replaceState } from "$app/navigation";
import { page } from "$app/state";
import { getI18n } from "$lib/i18n-context";
import { matchesSearch } from "$lib/search-text";
import { languagePath } from "$lib/seo";
import Seo from "$lib/Seo.svelte";
import {
  matchesPrefixVerb,
  prefixCopy,
  readPrefixQuery,
  searchVerbFamilies,
  writePrefixQuery,
} from "$lib/verb-prefix";
import { verbFamilies } from "$lib/verb-prefix-data";
import { onMount, untrack } from "svelte";

const i18n = getI18n();
const locale = $derived(i18n.locale === "ru" ? "ru" : "en");
const copy = $derived(prefixCopy[locale]);
const initial = untrack(() => readPrefixQuery(page.url));
let query = $state(initial.query);
let family = $state(initial.family);
const families = $derived(searchVerbFamilies(query, family));
let familyOpen = $state(false);
let familySearch = $state("");
let activeOption = $state(0);
const familyOptions = $derived([
  { id: "all", label: copy.all },
  ...verbFamilies.map((item) => ({
    id: item.id,
    label: `${item.base} — ${item.meaning[locale]}`,
  })),
]);
const filteredOptions = $derived(
  familyOptions.filter((item) => matchesSearch(item.label, familySearch, true)),
);
const selectedFamily = $derived(
  familyOptions.find((item) => item.id === family)?.label ?? copy.all,
);

function chooseFamily(id: string) {
  family = id;
  query = "";
  familyOpen = false;
  persist();
}

function openFamilies() {
  if (familyOpen) return;
  familySearch = "";
  activeOption = Math.max(
    0,
    familyOptions.findIndex((item) => item.id === family),
  );
  familyOpen = true;
}

function familyKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    familyOpen = false;
  } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    if (!familyOpen) openFamilies();
    else {activeOption = Math.max(
        0,
        Math.min(
          filteredOptions.length - 1,
          activeOption + (event.key === "ArrowDown" ? 1 : -1),
        ),
      );}
    requestAnimationFrame(() =>
      document.getElementById(`family-option-${activeOption}`)?.scrollIntoView({
        block: "nearest",
      })
    );
  } else if (event.key === "Enter" && familyOpen) {
    event.preventDefault();
    const option = filteredOptions[activeOption];
    if (option) chooseFamily(option.id);
  }
}

function persist() {
  const current = new URL(window.location.href);
  const next = writePrefixQuery(current, { query, family });
  if (next.href !== current.href) replaceState(next, page.state);
}

function restore(url: URL) {
  const state = readPrefixQuery(url);
  query = state.query;
  family = state.family;
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

function conjugationLink(verb: string) {
  return languagePath(`/conjugator?${encodeURIComponent(verb)}`, locale);
}
</script>

<Seo
  title={`${i18n.t("prefixTitle")} | russian.tools`}
  description={copy.description}
  canonical="https://russian.tools/verb-prefixes"
  noindex={Boolean(query.trim() || family !== "speak")}
/>

<div class="controls">
  <form
    class="search-form"
    action="/verb-prefixes"
    method="GET"
    onsubmit={(event) => {
      event.preventDefault();
      family = "all";
      persist();
    }}
  >
    <input type="hidden" name="lang" value={locale} />
    <input type="hidden" name="family" value="all" />
    <div class="search-field">
      <label for="prefix-query">{copy.search}</label>
      <input
        id="prefix-query"
        name="q"
        type="search"
        bind:value={query}
        oninput={(event) => {
          query = event.currentTarget.value;
          family = "all";
          persist();
        }}
        maxlength="120"
        placeholder={copy.placeholder}
        spellcheck="false"
        autocapitalize="off"
      />
    </div>
    <noscript><button type="submit">{copy.apply}</button></noscript>
  </form>
  <div class="family-picker">
    <label for="prefix-family">{copy.family}</label>
    <input
      id="prefix-family"
      type="text"
      role="combobox"
      aria-expanded={familyOpen}
      aria-controls="family-options"
      aria-autocomplete="list"
      aria-activedescendant={familyOpen && filteredOptions[activeOption]
      ? `family-option-${activeOption}`
      : undefined}
      value={familyOpen ? familySearch : selectedFamily}
      placeholder={selectedFamily}
      autocomplete="off"
      spellcheck="false"
      onfocus={openFamilies}
      onclick={openFamilies}
      onblur={() => {
        familyOpen = false;
      }}
      oninput={(event) => {
        familySearch = event.currentTarget.value;
        activeOption = 0;
        familyOpen = true;
      }}
      onkeydown={familyKeydown}
    />
    {#if familyOpen}
      <div class="family-menu">
        <div id="family-options" role="listbox" aria-label={copy.family}>
          {#each filteredOptions as option, index (option.id)}
            <button
              id={`family-option-${index}`}
              type="button"
              role="option"
              aria-selected={family === option.id}
              class:active={activeOption === index}
              tabindex="-1"
              onpointerdown={(event) => event.preventDefault()}
              onclick={() => chooseFamily(option.id)}
            >
              {option.label}
            </button>
          {/each}
        </div>
        {#if !filteredOptions.length}<p role="status">{copy.noFamilies}</p>{/if}
      </div>
    {/if}
  </div>
</div>
<div class="results-bar">
  <p class="count" role="status">{copy.count} {families.length}</p>
  {#if query.trim() || family !== "speak"}
    <a class="reset" href={languagePath("/verb-prefixes", locale)}>{
      copy.reset
    }</a>
  {/if}
</div>
{#each families as item (item.id)}
  <section aria-labelledby={`family-${item.id}`}>
    <div class="family-heading">
      <h2 id={`family-${item.id}`}>
        <span lang="ru">{item.base}</span> <span class="family-meaning">— {
            item.meaning[locale]
          }</span>
      </h2>
      {#if families.length > 1}<a
          class="family-link"
          href={languagePath(`/verb-prefixes?family=${item.id}`, locale)}
        >{copy.familyLink}</a>{/if}
    </div>
    <div class="cards">
      {#each item.entries as entry (entry.id)}
        <article class:match={Boolean(query.trim()) && matchesPrefixVerb(entry, query)}>
          <div class="card-label">
            <span>
              {#if entry.prefix}
                {entry.prefix.includes("-ся") ? copy.reflexive : copy.prefix}{
                  ": "
                }<span lang="ru">{entry.prefix}</span>
              {:else}{copy.base}{/if}
            </span>
            {#if query.trim() && matchesPrefixVerb(entry, query)}<span
                class="match-label"
              >{copy.match}</span>{/if}
          </div>
          <dl class="forms">
            {#if entry.imperfective && (!entry.prefix || entry.imperfective !== item.base)}
              <div>
                <dt>{copy.imperfective}</dt>
                <dd>
                  <a href={conjugationLink(entry.imperfective)} lang="ru">{
                    entry.imperfective
                  }</a>
                </dd>
              </div>
            {/if}
            {#if entry.perfective && (!entry.prefix || entry.perfective !== item.base)}
              <div>
                <dt>{copy.perfective}</dt>
                <dd>
                  <a href={conjugationLink(entry.perfective)} lang="ru">{
                    entry.perfective
                  }</a>
                </dd>
              </div>
            {/if}
          </dl>
          <h3>{entry.meaning[locale]}</h3>
          <details>
            <summary>{copy.details}</summary>
            <p class="note">{entry.note[locale]}</p>
            <blockquote>
              <p lang="ru">{entry.example.ru}</p>
              {#if locale === "en"}<p class="translation" lang="en">
                  {entry.example.en}
                </p>{/if}
            </blockquote>
            <a
              class="reference"
              href={conjugationLink(entry.perfective || entry.imperfective)}
            >{copy.reference}</a>
          </details>
        </article>
      {/each}
    </div>
  </section>
{:else}
  <p class="empty">{copy.empty}</p>
{/each}

<p class="scope">
  {copy.scope} <a href={languagePath("/motion", locale)}>{copy.motion}</a>
</p>

<style>
.controls { display: flex; flex-wrap: wrap; gap: 16px; }
.search-form { flex: 1 1 320px; }
form { display: flex; align-items: end; gap: 8px; min-width: 0; }
.search-field { flex: 1; min-width: 0; }
label { display: block; font-weight: 500; margin-bottom: 8px; }
input[type="search"], button { min-height: 48px; padding: 10px 12px; font: inherit; color: var(--foreground); background: var(--background); border: 1px solid var(--border); border-radius: 4px; }
input[type="search"] { width: 100%; min-width: 0; }
.family-picker { position: relative; flex: 1 1 240px; min-width: 0; }
.family-picker > input { width: 100%; min-height: 48px; padding: 10px 12px; font: inherit; color: var(--foreground); background: var(--background); border: 1px solid var(--border); border-radius: 4px; }
.family-menu { position: absolute; z-index: 10; top: 100%; left: 0; right: 0; max-height: 280px; overflow-y: auto; margin-top: 4px; padding: 4px; background: var(--background); border: 1px solid var(--border); border-radius: 4px; box-shadow: 0 4px 12px #0002; }
.family-menu button { display: block; width: 100%; min-height: 40px; padding: 8px; border: 0; text-align: left; overflow-wrap: anywhere; }
.family-menu button.active { background: var(--hover); outline: 1px solid var(--border); outline-offset: -1px; }
.family-menu button[aria-selected="true"] { font-weight: 600; }
.family-menu p { padding: 8px; font-size: 13px; }
input::placeholder { color: var(--placeholder); }
button { cursor: pointer; }
button:hover { background: var(--hover); }
.results-bar { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; margin-top: 12px; font-size: 12px; }
.scope { font-size: 13px; }
section { margin-top: 24px; }
.family-heading { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px 16px; margin-bottom: 16px; }
h2 { margin: 0; font-size: 22px; font-weight: 500; }
.family-meaning { color: var(--muted); font-size: 16px; font-weight: 400; }
.family-link { margin-left: auto; font-size: 12px; }
.cards { border-top: 1px solid var(--border); }
article { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 4px 24px; padding: 18px 12px; border-bottom: 1px solid var(--border); overflow-wrap: anywhere; }
article.match { background: var(--hover); }
.card-label { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px 12px; color: var(--muted); font-size: 12px; }
.card-label { grid-column: 1 / -1; }
.match-label { font-weight: 600; color: var(--foreground); }
h3 { grid-column: 2; align-self: center; margin: 0; font-size: 16px; font-weight: 500; line-height: 1.4; }
.forms { grid-column: 1; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin: 0; }
dt { font-size: 11px; color: var(--muted); }
dd { margin: 2px 0 0; font-size: 16px; font-weight: 500; }
details { grid-column: 1 / -1; margin-top: 8px; }
summary { width: fit-content; cursor: pointer; color: var(--muted); font-size: 12px; }
details[open] summary { margin-bottom: 12px; }
.note { font-size: 13px; }
blockquote { margin: 16px 0; padding-left: 12px; border-left: 2px solid var(--border); }
blockquote p { color: var(--foreground); }
blockquote .translation { color: var(--muted); font-size: 13px; margin-top: 4px; }
.reference { align-self: start; margin-top: auto; font-size: 11px; color: var(--muted); }
.empty { margin-top: 24px; }
.scope { margin-top: 28px; }
@media (max-width: 600px) { .family-link { margin-left: 0; } article { grid-template-columns: minmax(0, 1fr); padding: 16px 0; } .forms { margin-top: 8px; } h3 { grid-column: 1; margin-top: 8px; } }
</style>
