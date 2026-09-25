<script lang="ts">
import type { MessageKey } from "$lib/i18n";
import { getI18n } from "$lib/i18n-context";
import {
  type Edit,
  editText,
  fixKeyboardLayout,
  keyboardLimit,
  keyboardRows,
  keyCharacter,
  type LayoutDirection,
  physicalCharacter,
} from "$lib/keyboard";
import Seo from "$lib/Seo.svelte";

const i18n = getI18n();
let editor: HTMLTextAreaElement;
let text = $state("");
let mapping = $state(true);
let shift = $state(false);
let caps = $state(false);
let status = $state<MessageKey | "">("");
let undo = $state<Edit[]>([]);
let redo = $state<Edit[]>([]);
let before: Edit | undefined;
let composing: Edit | undefined;
let revision = 0;

function snapshot(): Edit {
  return {
    value: editor.value,
    start: editor.selectionStart,
    end: editor.selectionEnd,
  };
}

function changed() {
  revision++;
  status = "";
}

function remember(previous: Edit) {
  undo = [...undo.slice(-99), previous];
  redo = [];
}

function restore(next: Edit) {
  text = next.value;
  editor.value = next.value;
  editor.setSelectionRange(next.start, next.end);
  changed();
}

function insert(value: string | null) {
  if (composing) return;
  const previous = snapshot();
  const next = editText(previous, value);
  if (next.value !== previous.value) {
    remember(previous);
    restore(next);
  } else {
    editor.setSelectionRange(next.start, next.end);
  }
  if (value !== null) shift = false;
}

function travel(back: boolean) {
  if (composing) return;
  const source = back ? undo : redo;
  const next = source.at(-1);
  if (!next) return;
  const current = snapshot();
  if (back) {
    undo = undo.slice(0, -1);
    redo = [...redo, current];
  } else {
    redo = redo.slice(0, -1);
    undo = [...undo, current];
  }
  restore(next);
}

function fixLayout(direction: LayoutDirection) {
  if (composing) return;
  const previous = snapshot();
  const selected = previous.start !== previous.end;
  const start = selected ? previous.start : 0;
  const end = selected ? previous.end : previous.value.length;
  const value = previous.value.slice(0, start)
    + fixKeyboardLayout(previous.value.slice(start, end), direction)
    + previous.value.slice(end);
  if (value === previous.value) return;
  remember(previous);
  restore({ ...previous, value });
}

function keydown(event: KeyboardEvent) {
  if (event.isComposing || composing) return;
  if ((event.ctrlKey || event.metaKey) && !event.altKey) {
    if (event.code === "KeyZ" || event.code === "KeyY") {
      event.preventDefault();
      travel(event.code === "KeyZ" && !event.shiftKey);
    }
    return;
  }
  if (!mapping) return;
  const character = physicalCharacter(event);
  if (character !== null) {
    event.preventDefault();
    insert(character);
  }
}

function beforeInput(event: InputEvent) {
  if (event.inputType === "historyUndo" || event.inputType === "historyRedo") {
    event.preventDefault();
    travel(event.inputType === "historyUndo");
    return;
  }
  before = snapshot();
}

function input() {
  if (!composing && editor.value !== text) {
    remember(before ?? { value: text, start: text.length, end: text.length });
  }
  text = editor.value;
  before = undefined;
  changed();
}

async function copy() {
  const current = ++revision;
  status = "";
  try {
    await navigator.clipboard.writeText(text);
    if (current === revision) status = "keyboardCopied";
  } catch {
    if (current !== revision) return;
    editor.focus();
    editor.select();
    status = "keyboardCopyError";
  }
}

// Mouse clicks keep the editor's caret; touch and keyboard users retain normal button focus.
function preserveCaret(event: PointerEvent) {
  if (event.pointerType === "mouse") event.preventDefault();
}
</script>

<Seo
  title={`${i18n.t("keyboardSeoTitle")} | russian.tools`}
  description={i18n.t("keyboardDescription")}
  canonical="https://russian.tools/keyboard"
/>

<noscript><p class="note">{i18n.t("keyboardJavascript")}</p></noscript>

<textarea
  id="keyboard-text"
  aria-label={i18n.t("keyboardTitle")}
  bind:this={editor}
  value={text}
  onkeydown={keydown}
  onbeforeinput={beforeInput}
  oninput={input}
  oncompositionstart={() => composing = snapshot()}
  oncompositionend={() => {
    if (composing && composing.value !== editor.value) remember(composing);
    composing = undefined;
    text = editor.value;
    before = undefined;
    changed();
  }}
  lang="ru"
  spellcheck="false"
  autocapitalize="off"
  autocomplete="off"
  maxlength={keyboardLimit}
  placeholder="Пишите здесь…"
></textarea>

<div class="layout-fixer" role="group" aria-label={i18n.t("keyboardFixTitle")}>
  <span>{i18n.t("keyboardFixTitle")}</span>
  <button
    disabled={!text}
    onpointerdown={preserveCaret}
    onclick={() => fixLayout("en-to-ru")}
  >
    {i18n.t("keyboardFixToRussian")}
  </button>
  <button
    disabled={!text}
    onpointerdown={preserveCaret}
    onclick={() => fixLayout("ru-to-en")}
  >
    {i18n.t("keyboardFixToEnglish")}
  </button>
</div>
<p class="note">{i18n.t("keyboardFixHint")}</p>

<label class="mapping">
  <input type="checkbox" bind:checked={mapping} />
  {i18n.t("keyboardMapping")}
</label>

<div class="keyboard" role="group" aria-label={i18n.t("keyboardTitle")}>
  {#each keyboardRows as row}
    <div class="key-row">
      {#each row as key}
        <button
          class="key"
          aria-label={keyCharacter(key, shift, caps)}
          title={`${key.hint} → ${keyCharacter(key, shift, caps)}`}
          onpointerdown={preserveCaret}
          onclick={() => insert(keyCharacter(key, shift, caps))}
        >
          <span lang="ru">{keyCharacter(key, shift, caps)}</span>
          <small aria-hidden="true">{key.hint}</small>
        </button>
      {/each}
    </div>
  {/each}
  <div class="controls">
    <button
      aria-pressed={shift}
      onpointerdown={preserveCaret}
      onclick={() => shift = !shift}
    >
      Shift
    </button>
    <button
      aria-pressed={caps}
      onpointerdown={preserveCaret}
      onclick={() => caps = !caps}
    >
      Caps Lock
    </button>
    <button
      class="space"
      onpointerdown={preserveCaret}
      onclick={() => insert(" ")}
    >
      {i18n.t("keyboardSpace")}
    </button>
    <button onpointerdown={preserveCaret} onclick={() => insert("\n")}>
      {i18n.t("keyboardEnter")}
    </button>
    <button
      aria-label={i18n.t("keyboardBackspace")}
      title={i18n.t("keyboardBackspace")}
      onpointerdown={preserveCaret}
      onclick={() => insert(null)}
    >
      ⌫
    </button>
  </div>
</div>

<div class="actions">
  <button disabled={!text} onclick={copy}>{i18n.t("keyboardCopy")}</button>
  <button
    disabled={!undo.length}
    onpointerdown={preserveCaret}
    onclick={() => travel(true)}
  >
    {i18n.t("keyboardUndo")}
  </button>
  <button
    disabled={!redo.length}
    onpointerdown={preserveCaret}
    onclick={() => travel(false)}
  >
    {i18n.t("keyboardRedo")}
  </button>
  <button
    disabled={!text}
    onclick={() => {
      remember(snapshot());
      restore({ value: "", start: 0, end: 0 });
    }}
  >
    {i18n.t("keyboardClear")}
  </button>
  <span role="status">{status ? i18n.t(status) : ""}</span>
</div>

<style>
textarea { display: block; width: 100%; min-height: 180px; padding: 12px 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--background); color: inherit; font: inherit; font-size: 20px; line-height: 1.7; resize: vertical; }
textarea::placeholder { color: var(--placeholder); }
.mapping { display: flex; align-items: center; gap: 8px; margin: 16px 0; cursor: pointer; }
.mapping input { width: 18px; height: 18px; margin: 0; accent-color: var(--foreground); }
.keyboard { display: flex; flex-direction: column; gap: 6px; }
.key-row { display: flex; justify-content: center; gap: 6px; }
button { min-height: 44px; padding: 9px 14px; border: 1px solid var(--border); border-radius: 8px; background: var(--background); color: inherit; font: inherit; cursor: pointer; touch-action: manipulation; }
button:disabled { opacity: .5; cursor: default; }
.key { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; min-width: 0; max-width: 62px; min-height: 56px; padding: 4px 0; font-size: 20px; line-height: 1.3; }
.key small { color: var(--muted); font-size: 10px; }
.controls { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; margin-top: 4px; }
.space { flex: 1; }
button[aria-pressed="true"] { border-color: var(--foreground); background: var(--foreground); color: var(--background); }
@media (hover: hover) { button:not(:disabled):hover { border-color: var(--focus); background: var(--hover); } button[aria-pressed="true"]:hover { background: var(--foreground); } }
button:not(:disabled):active { transform: translateY(1px); }
.actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 20px; }
.layout-fixer { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin: 16px 0 8px; }
[role="status"], .note { font-size: 12px; color: var(--muted); }
.note { margin-bottom: 12px; }
@media (max-width: 600px) { .key-row { gap: 3px; } .key { font-size: 17px; min-height: 48px; border-radius: 5px; } .controls button { padding: 8px; font-size: 12px; } .controls { gap: 4px; } }
</style>
