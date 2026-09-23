<script lang="ts">
import type { MessageKey } from "$lib/i18n";
import { getI18n } from "$lib/i18n-context";
import Seo from "$lib/Seo.svelte";
import { transliterate } from "$lib/transliteration";

const i18n = getI18n();
let text = $state("");
let editor: HTMLTextAreaElement;
let output: HTMLTextAreaElement;
let status = $state<MessageKey | "">("");
let revision = 0;
const result = $derived(transliterate(text));

function edited() {
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

<div class="editors">
  <div>
    <label for="cyrillic">{i18n.t("transliterateInput")}</label>
    <textarea
      id="cyrillic"
      bind:this={editor}
      bind:value={text}
      oninput={edited}
      lang="ru"
      spellcheck="false"
      autocapitalize="off"
      maxlength={20000}
      placeholder="Пишите здесь…"
    ></textarea>
  </div>
  <div>
    <label for="latin">{i18n.t("transliterateOutput")}</label>
    <textarea
      id="latin"
      bind:this={output}
      value={result}
      readonly
      lang="ru-Latn"
      spellcheck="false"
      placeholder="Privet, mir!"
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
<noscript><p class="note">{i18n.t("transliterateJavascript")}</p></noscript>

<style>
.editors { display: grid; flex: 1; min-height: 114px; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: minmax(114px, 1fr); gap: 20px; }
.editors > div { display: flex; flex-direction: column; min-height: 0; }
label { display: block; margin-bottom: 8px; font-weight: 500; }
textarea { display: block; flex: 1; width: 100%; height: 0; min-height: 80px; padding: 12px 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--background); color: inherit; font: inherit; font-size: 18px; line-height: 1.8; resize: none; }
textarea::placeholder { color: var(--placeholder); }
.actions { display: flex; flex-shrink: 0; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 16px; }
button { min-height: 44px; padding: 9px 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--background); color: inherit; font: inherit; cursor: pointer; }
button:disabled { opacity: .5; cursor: default; }
@media (hover: hover) { button:not(:disabled):hover { border-color: var(--focus); } }
[role="status"] { font-size: 12px; color: var(--muted); }
.note { flex-shrink: 0; margin-top: 12px; font-size: 12px; }
@media (max-width: 600px) { .editors { min-height: 248px; grid-template-columns: 1fr; grid-template-rows: repeat(2, minmax(114px, 1fr)); } }
</style>
