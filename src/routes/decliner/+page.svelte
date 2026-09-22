<script lang="ts">
import type { MessageKey } from "$lib/i18n";
import { getI18n } from "$lib/i18n-context";
const i18n = getI18n();
import { afterNavigate, replaceState } from "$app/navigation";
import { page } from "$app/state";
import {
  createTable,
  normalizeNoun,
  type Noun,
  suggestNouns,
} from "$lib/declension";
import { readNounQuery, writeNounQuery } from "$lib/declension-url";
import { onDestroy, onMount, untrack } from "svelte";
import type { PageData } from "./$types";

let { data }: { data: PageData } = $props();
const initial = untrack(() => data);
let input: HTMLInputElement;
let query = $state(initial.query);
let loading = $state(false);
let message = $state<MessageKey | "">(initial.message);
let matches = $state<Noun[]>(initial.matches);
let selected = $state(0);
let noun = $state<Noun | null>(initial.matches[0] ?? null);
let sections = $state(
  initial.matches[0] ? createTable(initial.matches[0]) : [],
);
let dataset: Noun[] | undefined;
let dictionaryRequest: Promise<Noun[]> | undefined;
let timer: ReturnType<typeof setTimeout>;
onDestroy(() => {
  clearTimeout(timer);
  request++;
});
const suggested = $derived(
  noun
    && normalizeNoun(query).replaceAll("ё", "е")
      !== normalizeNoun(noun.bare).replaceAll("ё", "е"),
);

function syncUrl() {
  const current = new URL(window.location.href);
  const next = writeNounQuery(current, query);
  if (next.href !== current.href) replaceState(next, page.state);
}

function scheduleLookup(updateUrl = true) {
  if (updateUrl) syncUrl();
  clearTimeout(timer);
  resetResult();
  if (query.trim()) timer = setTimeout(() => void lookup(), 250);
}
let request = 0;

function restoreUrl(url: URL) {
  const incoming = readNounQuery(url);
  if (incoming === query) return;
  query = incoming;
  if (input) input.value = incoming;
  clearTimeout(timer);
  resetResult();
  if (data.query === incoming) {
    matches = data.matches;
    message = data.message;
    if (matches.length) choose(0);
  } else if (query.trim()) {
    timer = setTimeout(() => void lookup(), 250);
  }
}

afterNavigate(({ type }) => {
  if (type !== "enter") restoreUrl(new URL(window.location.href));
});

function handleInput() {
  query = input.value.slice(0, 40);
  scheduleLookup();
}

function readInput() {
  if (input.value !== query) {
    query = input.value.slice(0, 40);
    scheduleLookup();
  }
}

onMount(() => {
  // Wait for SvelteKit's router before synchronizing a restored value to the URL.
  const startup = setTimeout(() => {
    if (readNounQuery(new URL(window.location.href)) !== initial.query) {
      restoreUrl(new URL(window.location.href));
    } else {
      readInput();
      if (query !== initial.query) scheduleLookup();
    }
    if (query.trim() && !noun && !message) scheduleLookup();
  }, 0);
  const checks = [100, 500, 1500].map((delay) => setTimeout(readInput, delay));
  const restoreHistory = () => restoreUrl(new URL(window.location.href));
  const restoredPage = (event: PageTransitionEvent) => {
    if (event.persisted) restoreHistory();
    else readInput();
  };
  window.addEventListener("popstate", restoreHistory);
  window.addEventListener("pageshow", restoredPage);
  return () => {
    clearTimeout(startup);
    checks.forEach(clearTimeout);
    window.removeEventListener("popstate", restoreHistory);
    window.removeEventListener("pageshow", restoredPage);
  };
});

function choose(index: number) {
  selected = index;
  noun = matches[index];
  sections = createTable(noun);
}

function resetResult() {
  request++;
  loading = false;
  noun = null;
  matches = [];
  sections = [];
  message = "";
}

async function lookup() {
  resetResult();
  if (!/^[а-яё]+(?:-[а-яё]+)*$/u.test(normalizeNoun(query))) {
    message = "invalidNoun";
    return;
  }
  const id = request;
  loading = true;
  try {
    if (!dataset) {
      dictionaryRequest ??= fetch("/data/nouns.json").then((response) => {
        if (!response.ok) throw new Error("Could not load nouns");
        return response.json() as Promise<Noun[]>;
      }).catch((error) => {
        dictionaryRequest = undefined;
        throw error;
      });
      dataset = await dictionaryRequest;
    }
    if (id !== request) return;
    matches = suggestNouns(dataset!, query);
    if (matches.length) choose(0);
    else message = "nounNotFound";
  } catch {
    if (id === request) message = "nounDictionaryError";
  } finally {
    if (id === request) loading = false;
  }
}
</script>

<svelte:head>
  <title>{i18n.t("nounTitle")} | russian.tools</title>
  <meta name="description" content={i18n.t("nounDescription")} />
</svelte:head>

<div class="lookup">
  <input
    id="noun"
    name="noun"
    lang="ru"
    bind:this={input}
    bind:value={query}
    oninput={handleInput}
    onchange={handleInput}
    placeholder={i18n.t("nominative")}
    aria-label={i18n.t("nominative")}
    spellcheck="false"
    autocapitalize="off"
    maxlength="40"
  />
</div>
<p class="status" role="status">
  {loading ? i18n.t("lookingUp") : message ? i18n.t(message) : ""}
</p>

{#if noun}
  {#if suggested}<p class="match">
      {i18n.t("closestMatch")} “{query.trim()}”: <strong lang="ru">{
        noun.nominative
      }</strong>
    </p>{/if}
  {#if matches.length > 1}
    <label for="meaning">{i18n.t("chooseEntry")}</label>
    <select
      id="meaning"
      value={selected}
      onchange={(event) => choose(Number(event.currentTarget.value))}
    >
      {#each matches as entry, i}<option value={i}>
          {entry.nominative} — {entry.meaning}
        </option>{/each}
    </select>
  {/if}
  <h3 lang="ru">{noun.nominative}</h3>
  <p class="meaning" lang="en">
    {#if i18n.locale === "ru"}<span lang="ru">{
          i18n.t("meaningEnglish")
        }:</span>{" "}{/if}{noun.meaning}
  </p>
  {#if noun.indeclinable}<p class="hint">{i18n.t("indeclinable")}</p>{/if}
  {#if noun.singularOnly}<p class="hint">{i18n.t("singularOnly")}</p>{/if}
  {#if noun.pluralOnly}<p class="hint">{i18n.t("pluralOnly")}</p>{/if}
  <div class="declensions">
    {#each sections as section}
      <section aria-labelledby={section.title}>
        <h4 id={section.title}>{i18n.t(section.title)}</h4>
        <ul>
          {#each section.rows as row}<li>
              <span class="case">{i18n.t(row.label)}</span><span lang="ru">{
                row.form || "—"
              }</span>
            </li>{/each}
        </ul>
      </section>
    {/each}
  </div>
  {#if sections.some((section) => section.rows.some((row) => !row.form.trim()))}
    <p class="hint">{i18n.t("missingForm")}</p>
  {/if}
{/if}

<p class="source">
  <a href="https://en.openrussian.org/">OpenRussian</a> · <a
    href="/data/nouns-SOURCE.md"
  >CC BY-SA 4.0</a> · {i18n.t("nounDataNote")}
</p>
<style>
h3 { margin: 16px 0 0; font-size: 20px; font-weight: 500; }
.lookup { margin-top: 18px; }
label { display: block; margin-bottom: 6px; font-size: 14px; }
.lookup input { width: 100%; }
.match { margin-top: 18px; font-size: 13px; }
input, select { font: inherit; color: inherit; background: var(--background); border: 1px solid var(--border); border-radius: 4px; padding: 8px 10px; }
select { max-width: 100%; margin-bottom: 10px; }
.status { font-size: 14px; margin-top: 6px; }
.status:empty { margin: 0; }
.meaning { margin-bottom: 2px; }
.hint  { font-size: 12px; margin-top: 8px; }
.declensions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 32px; margin-top: 18px; }
.declensions section { min-width: 0; }
h4 { margin: 0 0 6px; font-size: 15px; font-weight: 600; }
ul { list-style: none; margin: 0; padding: 0; }
li { display: grid; grid-template-columns: minmax(110px, 0.8fr) minmax(0, 1fr); gap: 12px; padding: 1px 0; font-size: 15px; line-height: 1.6; overflow-wrap: anywhere; }
.case { color: var(--muted); }
.source { margin-top: 24px; font-size: 12px; }
@media (max-width: 800px) { .declensions { grid-template-columns: 1fr; gap: 18px; } }
</style>
