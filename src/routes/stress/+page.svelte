<script lang="ts">
import type { MessageKey } from "$lib/i18n";
import { getI18n } from "$lib/i18n-context";
import Seo from "$lib/Seo.svelte";
const i18n = getI18n();
import StressWorker from "$lib/workers/stress.worker?worker";
import { onMount } from "svelte";

let editor: HTMLTextAreaElement;
let ready = $state(false);
let javascriptEnabled = $state(false);
let busy = $state(false);
let error = $state<MessageKey | "">("");
let composing = false;
let revision = 0;
let worker: Worker;
let timer: ReturnType<typeof setTimeout>;
const textLimit = 20000;

const unmark = (value: string) => value.replaceAll("\u0301", "");

type Snapshot = {
  value: string;
  start: number;
  end: number;
  direction: "forward" | "backward" | "none";
};
let undo: Snapshot[] = [];
let redo: Snapshot[] = [];
let beforeEdit: Snapshot | undefined;
let compositionStart: Snapshot | undefined;
let lastValue = "";

function snapshot(): Snapshot {
  return {
    value: editor.value,
    start: editor.selectionStart,
    end: editor.selectionEnd,
    direction: editor.selectionDirection,
  };
}

function remember(previous: Snapshot) {
  undo = [...undo.slice(-99), previous];
  redo = [];
}

// Automatic marking replaces the textarea value and clears native history.
// Track user edits separately so accents never become extra undo steps.
function travel(back: boolean) {
  if (composing) return;
  const source = back ? undo : redo;
  const next = source.pop();
  if (!next) return;
  (back ? redo : undo).push(snapshot());
  const { scrollTop, scrollLeft } = editor;
  editor.value = lastValue = next.value;
  editor.setSelectionRange(next.start, next.end, next.direction);
  editor.scrollTop = scrollTop;
  editor.scrollLeft = scrollLeft;
  beforeEdit = undefined;
  schedule();
}

function beforeInput(event: InputEvent) {
  if (event.inputType === "historyUndo" || event.inputType === "historyRedo") {
    event.preventDefault();
    travel(event.inputType === "historyUndo");
    return;
  }
  beforeEdit = snapshot();
}

function input() {
  if (!composing && editor.value !== lastValue) {
    remember(
      beforeEdit ?? {
        value: lastValue,
        start: lastValue.length,
        end: lastValue.length,
        direction: "none",
      },
    );
  }
  lastValue = editor.value;
  beforeEdit = undefined;
  schedule();
}

function keydown(event: KeyboardEvent) {
  if (
    composing || event.isComposing || event.altKey
    || !(event.ctrlKey || event.metaKey)
  ) return;
  if (event.code === "KeyZ" || event.code === "KeyY") {
    event.preventDefault();
    travel(event.code === "KeyZ" && !event.shiftKey);
  }
}

// Map selection boundaries through added/removed accents without moving the cursor
// relative to the letters the user is editing.
function mapPosition(before: string, after: string, position: number) {
  const letters = unmark(before.slice(0, position)).length;
  let index = 0;
  let count = 0;
  while (index < after.length && count < letters) {
    if (after[index] !== "\u0301") count++;
    index++;
  }
  while (after[index] === "\u0301") index++;
  return index;
}

function schedule() {
  clearTimeout(timer);
  const id = ++revision;
  if (composing || !ready) return;
  error = "";
  busy = Boolean(editor.value.trim());
  if (!busy) return;
  timer = setTimeout(() => {
    // Recompute stress so an accent on a partially typed word never becomes fixed.
    worker.postMessage({ id, text: unmark(editor.value), single: false });
  }, 350);
}

onMount(() => {
  javascriptEnabled = true;
  lastValue = editor.value;
  worker = new StressWorker();
  worker.onmessage = ({ data }) => {
    if (data.type === "ready") {
      ready = true;
      schedule();
      return;
    }
    if (data.id !== undefined && data.id !== revision) return;
    if (data.type === "error") {
      error = data.code;
      busy = false;
      return;
    }
    if (data.type !== "result" || composing) return;
    busy = false;
    const before = editor.value;
    const after: string = data.text;
    if (before === after || unmark(before) !== unmark(after)) return;
    // Programmatic assignments bypass maxlength. Keep the original text intact
    // if the added accents would exceed the editor's limit.
    if (after.length > textLimit) {
      error = "stressLimitError";
      return;
    }
    const start = mapPosition(before, after, editor.selectionStart);
    const end = mapPosition(before, after, editor.selectionEnd);
    const direction = editor.selectionDirection;
    const { scrollTop, scrollLeft } = editor;
    editor.value = lastValue = after;
    editor.setSelectionRange(start, end, direction);
    editor.scrollTop = scrollTop;
    editor.scrollLeft = scrollLeft;
  };
  worker.onerror = () => {
    error = "stressLoadError";
    busy = false;
  };
  return () => {
    worker.terminate();
    clearTimeout(timer);
  };
});
</script>

<Seo
  title={`${i18n.t("stressSeoTitle")} | russian.tools`}
  description={i18n.t("stressDescription")}
  canonical="https://russian.tools/stress"
/>

<div class="stress-tool">
  <noscript><p>{i18n.t("stressJavascript")}</p></noscript>
  <textarea
    bind:this={editor}
    aria-describedby="privacy"
    lang="ru"
    spellcheck="false"
    autocapitalize="off"
    maxlength={textLimit}
    placeholder="Пишите здесь…"
    onkeydown={keydown}
    onbeforeinput={beforeInput}
    oninput={input}
    oncompositionstart={() => {
      compositionStart = snapshot();
      composing = true;
      clearTimeout(timer);
      revision++;
    }}
    oncompositionend={() => {
      if (compositionStart && compositionStart.value !== editor.value) {
        remember(compositionStart);
      }
      compositionStart = undefined;
      beforeEdit = undefined;
      lastValue = editor.value;
      composing = false;
      schedule();
    }}
  ></textarea>
  <div class="notes">
    <p id="privacy">
      {i18n.t("review")}
      {i18n.t("extension")}
      <a
        href="https://chromewebstore.google.com/detail/russian-stress-marker/dcbcimammngjhlmgdeejadiofgcjipec"
      >Chrome</a>
      {i18n.t("or")}
      <a
        href="https://addons.mozilla.org/en-US/firefox/addon/russian-stress-marker/"
      >Firefox</a>.
    </p>
    <p class:error role="status">
      {
        error
        ? i18n.t(error)
        : javascriptEnabled && !ready
        ? i18n.t("loading")
        : busy
        ? i18n.t("marking")
        : ""
      }
    </p>
  </div>
</div>

<style>
.stress-tool { display: flex; flex-direction: column; flex: 1; min-height: 0; }
textarea { display: block; flex: 1; width: 100%; height: 0; min-height: 80px; margin: 0; padding: 6px 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--background); color: inherit; font: inherit; font-size: 20px; line-height: 1.8; resize: none; }
textarea::placeholder { color: var(--placeholder); }
.notes { flex-shrink: 0; margin-top: 10px; }
.notes [role="status"] { min-height: 1.6em; }
.notes p { margin: 4px 0; font-size: 12px; }
.error { color: var(--error); }
</style>
