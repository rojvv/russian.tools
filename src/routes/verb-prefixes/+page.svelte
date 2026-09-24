<script lang="ts">
import { afterNavigate, replaceState } from "$app/navigation";
import { page } from "$app/state";
import { getI18n } from "$lib/i18n-context";
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

<p class="intro">{copy.intro}</p>
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
        aria-describedby="prefix-hint"
        spellcheck="false"
        autocapitalize="off"
      />
    </div>
    <button type="submit">{copy.apply}</button>
  </form>
  <form
    class="family-form"
    action="/verb-prefixes"
    method="GET"
    onsubmit={(event) => {
      event.preventDefault();
      query = "";
      persist();
    }}
  >
    <input type="hidden" name="lang" value={locale} />
    <div class="family-field">
      <label for="prefix-family">{copy.family}</label>
      <select
        id="prefix-family"
        name="family"
        bind:value={family}
        onchange={(event) => {
          family = event.currentTarget.value;
          query = "";
          persist();
        }}
      >
        <option value="all">{copy.all}</option>
        {#each verbFamilies as item (item.id)}
          <option value={item.id}>
            {item.base} — {item.meaning[locale]}
          </option>
        {/each}
      </select>
    </div>
    <button type="submit">{copy.apply}</button>
  </form>
</div>
<p id="prefix-hint" class="hint">{copy.hint}</p>
<a class="reset" href={languagePath("/verb-prefixes", locale)}>{copy.reset}</a>

<aside class="guide">
  <p>{copy.aspectHint}</p>
  <p>{copy.formHint}</p>
</aside>

<p class="count" role="status">{copy.count} {families.length}</p>
{#each families as item (item.id)}
  <section aria-labelledby={`family-${item.id}`}>
    <div class="family-heading">
      <h2 id={`family-${item.id}`}>
        <span lang="ru">{item.base}</span> <span class="family-meaning">— {
            item.meaning[locale]
          }</span>
      </h2>
      <a
        class="family-link"
        href={languagePath(`/verb-prefixes?family=${item.id}`, locale)}
      >{copy.familyLink}</a>
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
          <h3>{entry.meaning[locale]}</h3>
          <dl class="forms">
            {#if entry.imperfective}
              <div>
                <dt>{copy.imperfective}</dt>
                <dd>
                  <a href={conjugationLink(entry.imperfective)} lang="ru">{
                    entry.imperfective
                  }</a>
                </dd>
              </div>
            {/if}
            {#if entry.perfective}
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
          <p class="note">{entry.note[locale]}</p>
          <blockquote>
            <p lang="ru">{entry.example.ru}</p>
            {#if locale === "en"}<p class="translation" lang="en">
                {entry.example.en}
              </p>{/if}
          </blockquote>
          <a
            class="reference"
            href={`https://gramota.ru/poisk?mode=slovari&query=${
              encodeURIComponent(entry.perfective || entry.imperfective)
            }`}
          >{copy.reference}</a>
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
.intro { margin: 4px 0 24px; }
.controls { display: flex; flex-wrap: wrap; gap: 16px; }
form { display: flex; align-items: end; gap: 8px; min-width: 0; }
.search-form { flex: 1 1 360px; }
.family-form { flex: 1 1 320px; }
.search-field, .family-field { flex: 1; min-width: 0; }
label { display: block; font-weight: 500; margin-bottom: 8px; }
input[type="search"], select, button { min-height: 48px; padding: 10px 12px; font: inherit; color: var(--foreground); background: var(--background); border: 1px solid var(--border); border-radius: 4px; }
input[type="search"], select { width: 100%; min-width: 0; }
input::placeholder { color: var(--placeholder); }
button { cursor: pointer; }
button:hover { background: var(--hover); }
.reset { align-self: start; margin-top: 8px; font-size: 13px; }
.hint, .guide, .scope { font-size: 13px; }
.hint { margin-top: 10px; }
.guide { margin-top: 24px; padding: 16px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.guide p + p { margin-top: 8px; }
.count { margin: 20px 0 0; font-size: 12px; }
section { margin-top: 24px; }
.family-heading { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px 16px; margin-bottom: 16px; }
h2 { margin: 0; font-size: 22px; font-weight: 500; }
.family-meaning { color: var(--muted); font-size: 16px; font-weight: 400; }
.family-link { margin-left: auto; font-size: 12px; }
.cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
article { display: flex; flex-direction: column; padding: 20px; border: 1px solid var(--border); border-radius: 4px; overflow-wrap: anywhere; }
article.match { border-color: var(--focus); background: var(--hover); }
.card-label { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px 12px; color: var(--muted); font-size: 12px; }
.match-label { font-weight: 600; color: var(--foreground); }
h3 { margin: 8px 0 16px; font-size: 18px; font-weight: 500; line-height: 1.4; }
.forms { display: flex; flex-wrap: wrap; gap: 12px 24px; margin: 0 0 16px; }
dt { font-size: 11px; color: var(--muted); }
dd { margin: 2px 0 0; font-size: 18px; font-weight: 500; }
.note { font-size: 13px; }
blockquote { margin: 16px 0; padding-left: 12px; border-left: 2px solid var(--border); }
blockquote p { color: var(--foreground); }
blockquote .translation { color: var(--muted); font-size: 13px; margin-top: 4px; }
.reference { align-self: start; margin-top: auto; font-size: 11px; color: var(--muted); }
.empty { margin-top: 24px; }
.scope { margin-top: 28px; }
@media (max-width: 600px) { .cards { grid-template-columns: minmax(0, 1fr); } .search-field, .family-field { flex-basis: 100%; } .family-link { margin-left: 0; } article { padding: 16px; } }
</style>
