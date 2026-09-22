<script lang="ts">
import { loadDictionary } from "$lib/dictionary-data";
import type { MessageKey } from "$lib/i18n";
import { getI18n } from "$lib/i18n-context";
import { dictionarySeo } from "$lib/seo";
import Seo from "$lib/Seo.svelte";
const i18n = getI18n();
import { afterNavigate, replaceState } from "$app/navigation";
import { page } from "$app/state";
import {
  createTable,
  type Declinable,
  normalizeWord,
  suggestDeclinables,
} from "$lib/declension";
import { readDeclensionQuery, writeDeclensionQuery } from "$lib/declension-url";
import { onDestroy, onMount, untrack } from "svelte";
import type { PageData } from "./$types";

let { data }: { data: PageData } = $props();
const initial = untrack(() => data);
let input: HTMLInputElement;
let query = $state(initial.query);
let loading = $state(false);
let message = $state<MessageKey | "">(initial.message);
let matches = $state<Declinable[]>(initial.matches);
let selected = $state(0);
let word = $state<Declinable | null>(initial.matches[0] ?? null);
let sections = $state(
  initial.matches[0] ? createTable(initial.matches[0]) : [],
);
let dataset: Declinable[] | undefined;
let dictionaryRequest: Promise<Declinable[]> | undefined;
let timer: ReturnType<typeof setTimeout>;
onDestroy(() => {
  clearTimeout(timer);
  request++;
});
const suggested = $derived(
  word
    && normalizeWord(query).replaceAll("ё", "е")
      !== normalizeWord(word.bare).replaceAll("ё", "е"),
);

function syncUrl() {
  const current = new URL(window.location.href);
  const next = writeDeclensionQuery(current, query);
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
  const incoming = readDeclensionQuery(url);
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
    if (readDeclensionQuery(new URL(window.location.href)) !== initial.query) {
      restoreUrl(new URL(window.location.href));
    } else {
      readInput();
      if (query !== initial.query) scheduleLookup();
    }
    if (query.trim() && !word && !message) scheduleLookup();
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
  word = matches[index];
  sections = createTable(word);
}

function resetResult() {
  request++;
  loading = false;
  word = null;
  matches = [];
  sections = [];
  message = "";
}

async function lookup() {
  resetResult();
  if (!/^[а-яё]+(?:-[а-яё]+)*$/u.test(normalizeWord(query))) {
    message = "invalidNoun";
    return;
  }
  const id = request;
  loading = true;
  try {
    if (!dataset) {
      dictionaryRequest ??= Promise.all([
        loadDictionary<Declinable>(fetch, "nouns"),
        loadDictionary<Declinable>(fetch, "adjectives"),
      ]).then((dictionaries) => dictionaries.flat()).catch((error) => {
        dictionaryRequest = undefined;
        throw error;
      });
      dataset = await dictionaryRequest;
    }
    if (id !== request) return;
    matches = suggestDeclinables(dataset!, query);
    if (matches.length) choose(0);
    else message = "nounNotFound";
  } catch {
    if (id === request) message = "nounDictionaryError";
  } finally {
    if (id === request) loading = false;
  }
}
const resultTitle = $derived(
  word
    ? i18n.locale === "ru"
      ? `Склонение слова «${word.bare}»`
      : `Declensions for ${word.bare}`
    : i18n.t("nounSeoTitle"),
);
</script>

<Seo
  title={`${resultTitle} | russian.tools`}
  description={word ? `${word.bare}: ${i18n.t("nounDescription")}` : i18n.t("nounDescription")}
  {...dictionarySeo("/decliner", query, word?.bare)}
/>

<div class="lookup">
  <input
    id="word"
    name="word"
    lang="ru"
    bind:this={input}
    bind:value={query}
    oninput={handleInput}
    onchange={readInput}
    placeholder={i18n.t("nominative")}
    aria-label={i18n.t("declensionInput")}
    spellcheck="false"
    autocapitalize="off"
    maxlength="40"
  />
</div>
<p class="status" role="status">
  {loading ? i18n.t("lookingUp") : message ? i18n.t(message) : ""}
</p>

{#if word}
  {#if suggested}<p class="match">
      {i18n.t("closestMatch")} {i18n.locale === "ru" ? "«" : "“"}{
        query.trim()
      }{i18n.locale === "ru" ? "»" : "”"}: <strong lang="ru">{
        word.nominative
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
          {entry.nominative} — {
            i18n.t(entry.kind === "adjective" ? "adjective" : "noun")
          } — {entry.meaning}
        </option>{/each}
    </select>
  {/if}
  <h2>{resultTitle}</h2>
  <p lang="ru">{word.nominative}</p>
  <p class="meaning" lang="en">
    {#if i18n.locale === "ru"}<span lang="ru">{
          i18n.t("meaningEnglish")
        }:</span>{" "}{/if}{word.meaning}
  </p>
  <p class="hint">{i18n.t(word.kind === "adjective" ? "adjective" : "noun")}</p>
  {#if word.kind !== "adjective"}
    {#if word.indeclinable}<p class="hint">{i18n.t("indeclinable")}</p>{/if}
    {#if word.singularOnly}<p class="hint">{i18n.t("singularOnly")}</p>{/if}
    {#if word.pluralOnly}<p class="hint">{i18n.t("pluralOnly")}</p>{/if}
  {/if}
  <div class="declensions">
    <table>
      <caption>{i18n.t("declension")}</caption>
      <thead>
        <tr>
          <td></td>
          {#each sections as section}<th scope="col">
              {i18n.t(section.title)}
            </th>{/each}
        </tr>
      </thead>
      <tbody>
        {#each sections[0].rows as row, index}
          <tr>
            <th scope="row">{i18n.t(row.label)}</th>
            {#each sections as section}
              <td lang="ru">
                {#each (section.rows[index].form || "—").split(/,\s*/) as form}
                  <span class="form">{form}</span>
                {/each}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  {#if sections.some((section) => section.rows.some((row) => !row.form.trim()))}
    <p class="hint">{i18n.t("missingForm")}</p>
  {/if}
{/if}

<style>
h2 { margin: 16px 0 0; font-size: 20px; font-weight: 500; }
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
 .declensions { margin-top: 24px; max-width: 100%; overflow-x: auto; }
table { border-collapse: collapse; text-align: left; }
caption { text-align: left; font-size: 15px; font-weight: 600; color: var(--foreground); margin-bottom: 14px; }
th, td { vertical-align: top; padding: 5px 24px 5px 0; }
th { font-size: 13px; font-weight: 400; color: var(--muted); }
thead th { padding-bottom: 7px; }
tbody th { padding-top: 7px; }
td { font-size: 15px; line-height: 1.5; }
th:last-child, td:last-child { padding-right: 0; }
.form { display: block; }
@media (max-width: 400px) { th, td { padding-right: 14px; } }
</style>
