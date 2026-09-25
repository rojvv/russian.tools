<script lang="ts">
import { curseCopy } from "$lib/curse";
import { type CurseEntry, curseLevels, curseTypes } from "$lib/curse-data";
import { curseEntryPath } from "$lib/curse-entry";
import { languagePath } from "$lib/seo";

let { entry, locale, linked = false }: {
  entry: CurseEntry;
  locale: "en" | "ru";
  linked?: boolean;
} = $props();
const copy = $derived(curseCopy[locale]);
</script>

<article aria-labelledby={`word-${entry.id}`}>
  <div class="labels">
    <span class="level">{curseLevels[entry.level][locale]}</span>
    <span>{curseTypes[entry.type][locale]}</span>
  </div>
  <h2 id={`word-${entry.id}`} lang="ru">
    {#if linked}<a href={languagePath(curseEntryPath(entry), locale)}>{
        entry.word
      }</a>
    {:else}{entry.word}{/if}
  </h2>
  <p class="latin" lang="ru-Latn">{entry.latin}</p>
  {#if locale === "ru" && !entry.meaning.ru}
    <p class="hint">{copy.englishDefinition}</p>
  {/if}
  <p class="meaning" lang={entry.meaning[locale] ? locale : "en"}>
    {entry.meaning[locale] ?? entry.meaning.en}
  </p>
  <h3>{copy.usage}</h3>
  <p>{entry.usage[locale]}</p>
  {#if entry.aliases.length}
    <p class="hint">
      {copy.variants} <span lang="ru">{entry.aliases.join(", ")}</span>
    </p>
  {/if}
  {#if entry.example}
    <h3>{copy.example}</h3>
    <p class="example" lang="ru">{entry.example.ru}</p>
    <p lang="en">{entry.example.en}</p>
  {/if}
</article>

<style>
article { border: 1px solid var(--border); border-radius: 4px; padding: 20px; overflow-wrap: anywhere; }
.labels { display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; color: var(--muted); font-size: 12px; }
.level { border: 1px solid var(--border); border-radius: 4px; padding: 2px 8px; }
h2 { margin: 12px 0 0; font-size: 24px; font-weight: 500; }
.latin { font-size: 13px; }
.meaning { margin-top: 12px; color: var(--foreground); }
h3 { margin: 16px 0 4px; font-size: 13px; font-weight: 500; }
article p { font-size: 14px; }
.example { color: var(--foreground); }
.hint { margin-top: 8px; font-size: 13px; }
h2 a { text-decoration: none; }
h2 a:hover { text-decoration: underline; }
</style>
