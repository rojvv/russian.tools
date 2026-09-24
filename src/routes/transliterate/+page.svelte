<script lang="ts">
import { goto } from "$app/navigation";
import { page } from "$app/state";
import type { MessageKey } from "$lib/i18n";
import { getI18n } from "$lib/i18n-context";
import { cyrillicSegments, renderCyrillic } from "$lib/latin-to-cyrillic";
import Seo from "$lib/Seo.svelte";
import { transliterate } from "$lib/transliteration";

const i18n = getI18n();
const direction = $derived(
  page.url.searchParams.get("direction") === "l2c"
    ? "l2c"
    : "c2l",
);
const toCyrillic = $derived(direction === "l2c");
let text = $state("");
let editor: HTMLTextAreaElement;
let output: HTMLTextAreaElement;
let status = $state<MessageKey | "">("");
let revision = 0;
let choices = $state<Record<number, string>>({});
let visible = $state(20);
const segments = $derived(cyrillicSegments(toCyrillic ? text : ""));
const ambiguities = $derived(
  segments.filter((segment) => segment.options.length > 1),
);
const result = $derived(
  toCyrillic ? renderCyrillic(segments, choices) : transliterate(text),
);

function choose(start: number, value: string) {
  choices[start] = value;
  revision++;
  status = "";
}

function setDirection(value: "l2c" | "c2l") {
  const url = new URL(window.location.href);
  url.searchParams.set("direction", value);
  edited();
  void goto(url, { keepFocus: true, noScroll: true });
}

function edited() {
  choices = {};
  visible = 20;
  revision++;
  status = "";
}

async function copy() {
  const current = ++revision;
  status = "";
  try {
    await navigator.clipboard.writeText(result);
    if (current === revision) status = "transliterateCopied";
  } catch {
    if (current !== revision) return;
    output.focus();
    output.select();
    status = "transliterateCopyError";
  }
}
</script>

<Seo
  title={`${i18n.t("transliterateSeoTitle")} | russian.tools`}
  description={i18n.t("transliterateDescription")}
  canonical="https://russian.tools/transliterate"
/>

<div
  class="directions"
  role="group"
  aria-label={i18n.t("transliterateDirection")}
>
  <button
    aria-pressed={!toCyrillic}
    onclick={() => {
      setDirection("c2l");
    }}
  >
    {i18n.t("transliterateToLatin")}
  </button>
  <button
    aria-pressed={toCyrillic}
    onclick={() => {
      setDirection("l2c");
    }}
  >
    {i18n.t("latinTitle")}
  </button>
</div>
<div class="editors">
  <div>
    <label for="source">{
      i18n.t(toCyrillic ? "transliterateOutput" : "transliterateInput")
    }</label>
    <textarea
      id="source"
      bind:this={editor}
      bind:value={text}
      oninput={edited}
      lang={toCyrillic ? "ru-Latn" : "ru"}
      spellcheck="false"
      autocapitalize="off"
      maxlength={20000}
      placeholder={toCyrillic ? "Kak proshli vykhodnye?" : "Как прошли выходные?"}
    ></textarea>
  </div>
  <div>
    <label for="result">{
      i18n.t(toCyrillic ? "transliterateInput" : "transliterateOutput")
    }</label>
    <textarea
      id="result"
      bind:this={output}
      value={result}
      readonly
      lang={toCyrillic ? "ru" : "ru-Latn"}
      spellcheck="false"
      placeholder={toCyrillic ? "Как прошли выходные?" : "Kak proshli vykhodnye?"}
    ></textarea>
  </div>
</div>
<div class="actions">
  <button disabled={!result} onclick={copy}>
    {i18n.t("transliterateCopy")}
  </button>
  <button
    disabled={!text}
    onclick={() => {
      text = "";
      edited();
      editor.focus();
    }}
  >
    {i18n.t("transliterateClear")}
  </button>
  <span role="status">{status ? i18n.t(status) : ""}</span>
</div>
{#if ambiguities.length}
  <section aria-labelledby="ambiguities">
    <h2 id="ambiguities">
      {i18n.t("latinAmbiguities")} ({ambiguities.length})
    </h2>
    <p>{i18n.t("latinChoicesNote")}</p>
    {#each ambiguities.slice(0, visible) as segment (segment.start)}
      <fieldset>
        <legend>
          <span class="context">{
              text.slice(Math.max(0, segment.start - 12), segment.start)
            }<strong>{segment.source}</strong>{
              text.slice(
                segment.start + segment.source.length,
                segment.start + segment.source.length + 12,
              )
            }</span> · {i18n.t("latinPosition")} {segment.start + 1}
        </legend>
        {#each segment.options as option}
          <button
            lang="ru"
            aria-pressed={(choices[segment.start] ?? segment.options[0]) === option}
            onclick={() => choose(segment.start, option)}
          >
            {option}
          </button>
        {/each}
      </fieldset>
    {/each}
    {#if visible < ambiguities.length}
      <button onclick={() => visible += 20}>{i18n.t("latinMore")}</button>
    {/if}
  </section>
{/if}
<noscript><p class="note">{i18n.t("transliterateJavascript")}</p></noscript>

<style>
.directions { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
section { margin-top: 24px; }
h2 { font-size: 18px; margin: 0 0 8px; }
fieldset { min-width: 0; margin: 16px 0; padding: 12px; border: 1px solid var(--border); border-radius: 8px; }
legend { max-width: 100%; overflow-wrap: anywhere; font-size: 13px; color: var(--muted); }
.context { white-space: pre-wrap; }
strong { color: var(--foreground); text-decoration: underline; }
fieldset button { margin: 4px; }
button[aria-pressed="true"] { background: var(--foreground); color: var(--background); }

.editors { display: grid; flex: 1; min-height: 114px; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: minmax(114px, 1fr); gap: 20px; }
.editors > div { display: flex; flex-direction: column; min-height: 0; }
label { display: block; margin-bottom: 8px; font-weight: 500; }
textarea { display: block; flex: 1; width: 100%; height: 220px; min-height: 150px; padding: 12px 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--background); color: inherit; font: inherit; font-size: 18px; line-height: 1.8; resize: vertical; }
textarea::placeholder { color: var(--placeholder); }
.actions { display: flex; flex-shrink: 0; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 16px; }
button { min-height: 44px; padding: 9px 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--background); color: inherit; font: inherit; cursor: pointer; }
button:disabled { opacity: .5; cursor: default; }
@media (hover: hover) { button:not(:disabled):hover { border-color: var(--focus); } }
[role="status"] { font-size: 12px; color: var(--muted); }
.note { flex-shrink: 0; margin-top: 12px; font-size: 12px; }
@media (max-width: 600px) { .editors { min-height: 248px; grid-template-columns: 1fr; grid-template-rows: repeat(2, minmax(114px, 1fr)); } }
</style>
