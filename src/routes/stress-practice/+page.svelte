<script lang="ts">
import type { MessageKey } from "$lib/i18n";
import { getI18n } from "$lib/i18n-context";
import Seo from "$lib/Seo.svelte";
import {
  createStressQuestions,
  practiceSample,
  stressAt,
  type StressQuestion,
} from "$lib/stress-practice";
import StressWorker from "$lib/workers/stress.worker?worker";
import { onMount, tick } from "svelte";

const i18n = getI18n();
let text = $state("");
let ready = $state(false);
let javascriptEnabled = $state(false);
let busy = $state(false);
let error = $state<MessageKey | "">("");
let questions = $state<StressQuestion[]>([]);
let active = $state(false);
let index = $state(0);
let choice = $state<number | null>(null);
let revealed = $state(false);
let score = $state(0);
let revision = 0;
let worker: Worker | undefined;
let questionHeading = $state<HTMLHeadingElement>();
let editor = $state<HTMLTextAreaElement>();
const current = $derived(questions[index]);
const answered = $derived(choice !== null || revealed);

onMount(() => {
  javascriptEnabled = true;
  try {
    worker = new StressWorker();
    worker.onmessage = ({ data }) => {
      if (data.type === "ready") {
        ready = true;
        return;
      }
      if (data.id !== undefined && data.id !== revision) return;
      if (data.type === "error") {
        error = data.code;
        busy = false;
      } else if (data.type === "result") {
        busy = false;
        questions = createStressQuestions(data.text);
        if (!questions.length) {
          error = "practiceNoWords";
          return;
        }
        restart();
      }
    };
    worker.onerror = () => {
      ready = false;
      busy = false;
      error = "stressLoadError";
    };
  } catch {
    error = "stressLoadError";
  }
  return () => worker?.terminate();
});

function edited() {
  revision++;
  busy = false;
  if (ready) error = "";
}

function start() {
  if (!worker || !ready || busy || !text.trim()) return;
  error = "";
  busy = true;
  worker.postMessage({
    id: ++revision,
    text: text.normalize("NFC"),
    single: false,
  });
}

async function focusQuestion() {
  await tick();
  questionHeading?.focus();
}

function restart() {
  index = 0;
  choice = null;
  revealed = false;
  score = 0;
  active = true;
  void focusQuestion();
}

function choose(position: number) {
  if (answered || !current) return;
  choice = position;
  if (position === current.stress) score++;
}

function next() {
  index++;
  choice = null;
  revealed = false;
  void focusQuestion();
}

async function editText() {
  active = false;
  await tick();
  editor?.focus();
}
</script>

<Seo
  title={`${i18n.t("practiceSeoTitle")} | russian.tools`}
  description={i18n.t("practiceDescription")}
  canonical="https://russian.tools/stress-practice"
/>

<div class="practice-tool">
  <noscript><p>{i18n.t("practiceJavascript")}</p></noscript>
  {#if !active}
    <p id="practice-instructions">{i18n.t("practiceIntro")}</p>
    <textarea
      id="practice-text"
      bind:this={editor}
      bind:value={text}
      oninput={edited}
      aria-describedby="practice-instructions practice-note"
      lang="ru"
      spellcheck="false"
      autocapitalize="off"
      maxlength={20000}
      placeholder="Пишите здесь…"
    ></textarea>
    <div class="actions">
      <button
        class="primary"
        disabled={!ready || busy || !text.trim()}
        onclick={start}
      >
        {i18n.t(busy ? "practicePreparing" : "practiceStart")}
      </button>
      <button
        onclick={() => {
          text = practiceSample;
          edited();
        }}
      >
        {i18n.t("practiceSample")}
      </button>
    </div>
  {:else if current}
    <div class="progress">
      <span>{i18n.t("practiceProgress")} {index + 1} / {questions.length}</span>
      <span>{i18n.t("practiceScore")} {score} / {
          index + (answered ? 1 : 0)
        }</span>
    </div>
    <progress
      value={index + (answered ? 1 : 0)}
      max={questions.length}
      aria-label={i18n.t("practiceProgress")}
    >
    </progress>
    <section class="exercise" aria-labelledby="question-heading">
      <h2 id="question-heading" bind:this={questionHeading} tabindex="-1">
        {i18n.t("practiceChoose")}
      </h2>
      <p class="context" lang="ru">
        {current.before}<strong>{current.word}</strong>{current.after}
      </p>
      <div class="word" role="group" aria-label={current.word} lang="ru">
        {#each [...current.word] as letter, position}
          {#if current.vowels.includes(position)}
            <button
              class="vowel"
              class:correct={answered && position === current.stress}
              class:incorrect={choice === position && position !== current.stress}
              aria-label={`${i18n.t("practiceStressOn")} ${stressAt(current.word, position)}`}
              aria-pressed={choice === position}
              aria-disabled={answered}
              onclick={() => choose(position)}
            >
              {letter}{
                answered && position === current.stress && letter.toLowerCase() !== "ё"
                ? "\u0301"
                : ""
              }
            </button>
          {:else}
            <span aria-hidden="true">{letter}</span>
          {/if}
        {/each}
      </div>
      <p class="feedback" aria-live="polite" aria-atomic="true">
        {#if answered}
          {
            i18n.t(
              revealed
                ? "practiceAnswer"
                : choice === current.stress
                ? "practiceCorrect"
                : "practiceIncorrect",
            )
          }
          <strong lang="ru">{current.answer}</strong>
        {/if}
      </p>
      <div class="actions">
        {#if answered}
          <button class="primary" onclick={next}>
            {
              i18n.t(index + 1 === questions.length ? "practiceFinish" : "practiceNext")
            }
          </button>
        {:else}
          <button
            onclick={() => {
              revealed = true;
            }}
          >
            {i18n.t("practiceReveal")}
          </button>
        {/if}
        <button onclick={editText}>{i18n.t("practiceEdit")}</button>
      </div>
    </section>
  {:else}
    <section class="exercise">
      <h2 bind:this={questionHeading} tabindex="-1">
        {i18n.t("practiceComplete")}
      </h2>
      <p class="result">
        {i18n.t("practiceScore")} <strong>{score} / {questions.length}</strong>
      </p>
      <p>{i18n.t("practiceScoreNote")}</p>
      <div class="actions">
        <button class="primary" onclick={restart}>
          {i18n.t("practiceRetry")}
        </button>
        <button onclick={editText}>{i18n.t("practiceEdit")}</button>
      </div>
    </section>
  {/if}
  <p id="practice-note" class="note">{i18n.t("practiceNote")}</p>
  <p class="status" class:error={Boolean(error)} role="status">
    {
      error
      ? i18n.t(error)
      : javascriptEnabled && !ready
      ? i18n.t("loading")
      : busy
      ? i18n.t("practicePreparing")
      : ""
    }
  </p>
</div>

<style>
.practice-tool { max-width: 720px; }
textarea { margin: 20px 0 8px; display: block; width: 100%; min-height: 220px; padding: 12px 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--background); color: inherit; font: inherit; font-size: 18px; line-height: 1.8; resize: vertical; }
textarea::placeholder { color: var(--placeholder); }
.actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
button { min-height: 44px; padding: 9px 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--background); color: inherit; font: inherit; cursor: pointer; }
button.primary { border-color: var(--foreground); background: var(--foreground); color: var(--background); }
button:disabled { opacity: .5; cursor: default; }
button[aria-disabled="true"] { cursor: default; }
@media (hover: hover) { button:not(:disabled):not([aria-disabled="true"]):hover { border-color: var(--focus); } }
.progress { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; color: var(--muted); font-size: 13px; }
progress { display: block; width: 100%; height: 5px; margin-top: 10px; accent-color: var(--foreground); }
.exercise { margin-top: 28px; }
h2 { margin: 0 0 16px; font-size: 20px; font-weight: 500; }
.context { white-space: pre-wrap; overflow-wrap: anywhere; }
.context strong { color: var(--foreground); text-decoration: underline; text-underline-offset: 4px; }
.word { display: flex; flex-wrap: wrap; align-items: baseline; margin: 28px 0 12px; font-size: clamp(24px, 5vw, 36px); line-height: 1.8; }
.vowel { min-width: 44px; margin: 4px 2px; padding: 0 6px; font-size: inherit; border-bottom: 2px solid var(--focus); }
.vowel.correct { color: var(--background); background: var(--foreground); border-color: var(--foreground); }
.vowel.incorrect { color: var(--error); border-color: var(--error); text-decoration: line-through; }
.feedback { min-height: 3.2em; }
.feedback strong { color: var(--foreground); }
.result { margin-bottom: 8px; font-size: 24px; }
.result strong { color: var(--foreground); }
.note { margin-top: 24px; font-size: 12px; }
.status { min-height: 1.6em; margin-top: 8px; font-size: 12px; }
.error { color: var(--error); }
</style>
