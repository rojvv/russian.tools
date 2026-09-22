<script lang="ts">
import type { MessageKey } from "$lib/i18n";
import { getI18n } from "$lib/i18n-context";
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
  sections.filter((section) =>
    section.title !== "Present" && section.title !== "Future"
  ),
);
const shortLabel = (label: string) => label.split(" (")[0];
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
</script>

<svelte:head>
  <title>{i18n.t("verbTitle")} | russian.tools</title>
  <meta name="description" content={i18n.t("verbDescription")} />
</svelte:head>

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
      {i18n.t("closestMatch")} “{query.trim()}”: <strong lang="ru">{
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
  <h3 lang="ru">{verb.infinitive}</h3>
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
  <div class="conjugations">
    {#each finiteSections as section}
      <section aria-labelledby={`paired-${section.title.toLowerCase()}`}>
        <h4 id={`paired-${section.title.toLowerCase()}`}>
          {i18n.t(section.title as MessageKey)}
        </h4>
        <div class="paired">
          {#each ["Singular", "Plural"] as const as number, group}
            <div>
              <h5>{i18n.t(number)}</h5>
              <ul lang="ru">
                {#each section.rows.slice(group * 3, group * 3 + 3) as row}<li>
                    <span class="pronoun">{row.label}</span> {row.form || "—"}
                  </li>{/each}
              </ul>
            </div>
          {/each}
        </div>
      </section>
    {/each}
    {#each otherSections as section}
      <section aria-labelledby={`paired-${section.title.toLowerCase()}`}>
        <h4 id={`paired-${section.title.toLowerCase()}`}>
          {i18n.t(section.title as MessageKey)}
        </h4>
        <div class="paired">
          <div>
            <h5>
              {
                i18n.t(section.title === "Past" ? "Singular" : "singularInformal")
              }
            </h5>
            <ul lang="ru">
              {#each section.rows.slice(0, -1) as row}<li>
                  <span class="pronoun">{shortLabel(row.label)}</span> {
                    row.form || "—"
                  }
                </li>{/each}
            </ul>
          </div>
          <div>
            <h5>
              {i18n.t(section.title === "Past" ? "Plural" : "pluralFormal")}
            </h5>
            <ul lang="ru">
              {#each section.rows.slice(-1) as row}<li>
                  <span class="pronoun">{shortLabel(row.label)}</span> {
                    row.form || "—"
                  }
                </li>{/each}
            </ul>
          </div>
        </div>
      </section>
    {/each}
  </div>
  {#if sections.some((section) => section.rows.some((row) => !row.form.trim()))}
    <p class="hint">{i18n.t("missingForm")}</p>
  {/if}
{/if}

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
.conjugations { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px 32px; margin-top: 18px; }
.conjugations section { min-width: 0; }
.paired { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
h4 { margin: 0 0 6px; font-size: 15px; font-weight: 600; }
h5 { margin: 0 0 3px; font-size: 11px; font-weight: 400; color: var(--subtle); }
ul { list-style: none; margin: 0; padding: 0; }
li { padding: 1px 0; font-size: 15px; line-height: 1.6; overflow-wrap: anywhere; }
.pronoun { color: var(--muted); }
@media (max-width: 800px) { .conjugations { grid-template-columns: 1fr; gap: 18px; } }
</style>
