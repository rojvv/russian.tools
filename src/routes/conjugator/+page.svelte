<script lang="ts">
import type { MessageKey } from "$lib/i18n";
import { getI18n } from "$lib/i18n-context";
import { dictionarySeo } from "$lib/seo";
import Seo from "$lib/Seo.svelte";
const i18n = getI18n();
import { afterNavigate, replaceState } from "$app/navigation";
import { page } from "$app/state";
import {
  createTable,
  normalizeVerb,
  type Section,
  suggestVerbs,
  type Verb,
} from "$lib/conjugation";
import { readVerbQuery, writeVerbQuery } from "$lib/conjugation-url";
import { onDestroy, onMount, untrack } from "svelte";
import type { PageData } from "./$types";

let { data }: { data: PageData } = $props();
const initial = untrack(() => data);
let input: HTMLInputElement;
let query = $state(initial.query);
let loading = $state(false);
let message = $state<MessageKey | "">(initial.message);
let matches = $state<Verb[]>(initial.matches);
let selected = $state(0);
let verb = $state<Verb | null>(initial.matches[0] ?? null);
let aspect = $state<"imperfective" | "perfective">(
  initial.matches[0]?.aspect === "perfective" ? "perfective" : "imperfective",
);
let sections = $state<Section[]>(
  initial.matches[0]
    ? createTable(
      initial.matches[0],
      initial.matches[0].aspect === "perfective"
        ? "perfective"
        : "imperfective",
    )
    : [],
);
const finiteSections = $derived(
  sections.filter((section) =>
    section.title === "Present" || section.title === "Future"
  ),
);
const otherSections = $derived(
  ["Imperative", "Past"].flatMap((title) =>
    sections.filter((section) => section.title === title)
  ),
);
const pastLabels = ["masculine", "feminine", "neuter", "pluralGender"] as const;
let dataset: Verb[] | undefined;
let dictionaryRequest: Promise<Verb[]> | undefined;
let timer: ReturnType<typeof setTimeout>;
onDestroy(() => {
  clearTimeout(timer);
  request++;
});
const suggested = $derived(
  verb
    && normalizeVerb(query).replaceAll("ё", "е")
      !== normalizeVerb(verb.bare).replaceAll("ё", "е"),
);

function syncUrl() {
  const current = new URL(window.location.href);
  const next = writeVerbQuery(current, query);
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
  const incoming = readVerbQuery(url);
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
    if (readVerbQuery(new URL(window.location.href)) !== initial.query) {
      restoreUrl(new URL(window.location.href));
    } else {
      readInput();
      if (query !== initial.query) scheduleLookup();
    }
    if (query.trim() && !verb && !message) scheduleLookup();
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
  verb = matches[index];
  aspect = verb.aspect === "perfective" ? "perfective" : "imperfective";
  sections = createTable(verb, aspect);
}

function resetResult() {
  request++;
  loading = false;
  verb = null;
  matches = [];
  sections = [];
  message = "";
}

async function lookup() {
  resetResult();
  if (!/^[а-яё]+(?:-[а-яё]+)*$/u.test(normalizeVerb(query))) {
    message = "invalidVerb";
    return;
  }
  const id = request;
  loading = true;
  try {
    if (!dataset) {
      dictionaryRequest ??= fetch("/data/verbs.json").then((response) => {
        if (!response.ok) throw new Error("Could not load verbs");
        return response.json() as Promise<Verb[]>;
      }).catch((error) => {
        dictionaryRequest = undefined;
        throw error;
      });
      dataset = await dictionaryRequest;
    }
    if (id !== request) return;
    matches = suggestVerbs(dataset!, query);
    if (matches.length) choose(0);
    else message = "verbNotFound";
  } catch {
    if (id === request) message = "dictionaryError";
  } finally {
    if (id === request) loading = false;
  }
}
const resultTitle = $derived(
  verb
    ? i18n.locale === "ru"
      ? `Спряжение слова «${verb.bare}»`
      : `Conjugation of ${verb.bare}`
    : i18n.t("verbSeoTitle"),
);
</script>

<Seo
  title={`${resultTitle} | russian.tools`}
  description={verb ? `${verb.bare}: ${i18n.t("verbDescription")}` : i18n.t("verbDescription")}
  {...dictionarySeo("/conjugator", query, verb?.bare)}
/>

<div class="lookup">
  <input
    id="verb"
    name="verb"
    lang="ru"
    bind:this={input}
    bind:value={query}
    oninput={handleInput}
    onchange={handleInput}
    placeholder={i18n.t("infinitive")}
    aria-label={i18n.t("infinitive")}
    spellcheck="false"
    autocapitalize="off"
    maxlength="40"
  />
</div>
<p class="status" role="status">
  {loading ? i18n.t("lookingUp") : message ? i18n.t(message) : ""}
</p>

{#if verb}
  {#if suggested}<p class="match">
      {i18n.t("closestMatch")} {i18n.locale === "ru" ? "«" : "“"}{
        query.trim()
      }{i18n.locale === "ru" ? "»" : "”"}: <strong lang="ru">{
        verb.infinitive
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
          {entry.infinitive} — {i18n.t(entry.aspect)} — {entry.meaning}
        </option>{/each}
    </select>
  {/if}
  <h2>{resultTitle}</h2>
  <p lang="ru">{verb.infinitive}</p>
  <p class="meaning" lang="en">
    {#if i18n.locale === "ru"}<span lang="ru">{
          i18n.t("meaningEnglish")
        }:</span>{" "}{/if}{verb.meaning}
  </p>
  {#if verb.aspect === "both"}
    <label for="aspect">{i18n.t("bothAspectPrompt")}</label>
    <select
      id="aspect"
      bind:value={aspect}
      onchange={() => {
        sections = createTable(verb!, aspect);
        message = "";
      }}
    >
      <option value="imperfective">{i18n.t("imperfectiveUse")}</option>
      <option value="perfective">{i18n.t("perfectiveUse")}</option>
    </select>
  {:else}
    <p class="hint">
      {i18n.t(aspect === "perfective" ? "perfectiveNote" : "imperfective")}
    </p>
  {/if}
  <section class="conjugation" aria-labelledby="conjugation-title">
    <h3 id="conjugation-title">{i18n.t("conjugation")}</h3>
    <div class="conjugations">
      <div class="table-wrap">
        <table aria-labelledby="conjugation-title">
          <thead>
            <tr>
              <td></td>
              {#each finiteSections as section}<th scope="col">
                  {i18n.t(section.title as MessageKey)}
                </th>{/each}
            </tr>
          </thead>
          <tbody>
            {#each finiteSections[0].rows as row, index}
              <tr>
                <th scope="row" lang="ru">
                  {row.label.replaceAll(" / ", "/")}
                </th>
                {#each finiteSections as section}
                  <td lang="ru">
                    {#each (section.rows[index].form || "—").split(/,\s*/) as form}<span
                        class="form"
                      >{form}</span>{/each}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      {#each otherSections as section}
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="colgroup" colspan="2">
                  {i18n.t(section.title as MessageKey)}
                </th>
              </tr>
            </thead>
            <tbody>
              {#each section.rows as row, index}
                <tr>
                  <th
                    scope="row"
                    lang={section.title === "Past" ? i18n.locale : "ru"}
                  >
                    {
                      section.title === "Past" ? i18n.t(pastLabels[index]) : row.label
                    }
                  </th>
                  <td lang="ru">
                    {#each (row.form || "—").split(/,\s*/) as form}<span
                        class="form"
                      >{form}</span>{/each}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/each}
    </div>
  </section>
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
.conjugation { margin-top: 24px; }
h3 { margin: 0 0 14px; font-size: 15px; font-weight: 600; }
.conjugations { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 24px 48px; }
.table-wrap { max-width: 100%; overflow-x: auto; }
table { border-collapse: collapse; text-align: left; }
th, td { vertical-align: top; padding: 5px 24px 5px 0; }
th { font-size: 13px; font-weight: 400; color: var(--muted); }
thead th { padding-bottom: 7px; }
tbody th { padding-top: 7px; }
td { font-size: 15px; line-height: 1.5; }
th:last-child, td:last-child { padding-right: 0; }
.form { display: block; }
@media (max-width: 400px) { th, td { padding-right: 14px; } }
</style>
