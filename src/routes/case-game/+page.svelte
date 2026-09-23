<script lang="ts">
import {
  type CaseQuestion,
  createCaseRound,
  isCaseAnswer,
  type WordKind,
} from "$lib/case-game";
import type { Declinable } from "$lib/declension";
import { loadDictionary } from "$lib/dictionary-data";
import type { MessageKey } from "$lib/i18n";
import { getI18n } from "$lib/i18n-context";
import Seo from "$lib/Seo.svelte";
import { tick } from "svelte";

const i18n = getI18n();
let words: Declinable[] = [];
let kind = $state<WordKind>("both");
let questions = $state<CaseQuestion[]>([]);
let active = $state(false);
let busy = $state(false);
let error = $state<MessageKey | "">("");
let index = $state(0);
let answer = $state("");
let result = $state<"correct" | "incorrect" | "revealed" | null>(null);
let score = $state(0);
let input = $state<HTMLInputElement>();
let nextButton = $state<HTMLButtonElement>();
let heading = $state<HTMLHeadingElement>();
const current = $derived(questions[index]);

async function start() {
  if (busy) return;
  busy = true;
  error = "";
  try {
    if (!words.length) {
      const dictionaries = await Promise.all([
        loadDictionary<Declinable>(fetch, "nouns"),
        loadDictionary<Declinable>(fetch, "adjectives"),
      ]);
      words = dictionaries.flat();
    }
    questions = createCaseRound(words, kind);
    if (!questions.length) {
      error = "caseGameEmpty";
      return;
    }
    index = 0;
    score = 0;
    answer = "";
    result = null;
    active = true;
    await tick();
    input?.focus();
  } catch {
    error = "nounDictionaryError";
  } finally {
    busy = false;
  }
}
async function check(reveal = false) {
  if (!current || result || (!reveal && !answer.trim())) return;
  result = reveal
    ? "revealed"
    : isCaseAnswer(current, answer)
    ? "correct"
    : "incorrect";
  if (result === "correct") score++;
  await tick();
  nextButton?.focus();
}
async function next() {
  index++;
  answer = "";
  result = null;
  await tick();
  if (current) input?.focus();
  else heading?.focus();
}
</script>

<Seo
  title={`${i18n.t("caseGameTitle")} | russian.tools`}
  description={i18n.t("caseGameDescription")}
  canonical="https://russian.tools/case-game"
/>

<div class="game">
  {#if !active || !current}
    {#if active}
      <h2 bind:this={heading} tabindex="-1">{i18n.t("practiceComplete")}</h2>
      <p class="score">
        {i18n.t("practiceScore")} {score} / {questions.length}
      </p>
    {:else}
      <p>{i18n.t("caseGameIntro")}</p>
    {/if}
    <label for="word-kind">{i18n.t("caseGameKind")}</label>
    <select id="word-kind" bind:value={kind} disabled={busy}>
      <option value="both">{i18n.t("caseGameBoth")}</option>
      <option value="noun">{i18n.t("noun")}</option>
      <option value="adjective">{i18n.t("adjective")}</option>
    </select>
    <div class="actions">
      <button class="primary" onclick={start} disabled={busy}>
        {
          i18n.t(busy ? "practicePreparing" : active ? "practiceRetry" : "practiceStart")
        }
      </button>
    </div>
  {:else}
    <p class="progress">{index + 1} / {questions.length}</p>
    <section aria-label={i18n.t("caseGameTitle")}>
      <p class="word" lang="ru">{current.source}</p>
      <p class="context">
        {i18n.t(current.sourceCase)} · {i18n.t(current.section)}
      </p>
      <form
        onsubmit={(event) => {
          event.preventDefault();
          void check();
        }}
      >
        <label for="answer">{i18n.t("caseGameTo")}: <strong>{
            i18n.t(current.targetCase)
          }</strong></label>
        <input
          id="answer"
          bind:this={input}
          bind:value={answer}
          readonly={Boolean(result)}
          lang="ru"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder={i18n.t("caseGameAnswer")}
          maxlength={100}
        />
        {#if !result}
          <div class="actions">
            <button class="primary" type="submit" disabled={!answer.trim()}>
              {i18n.t("caseGameCheck")}
            </button>
            <button class="reveal" type="button" onclick={() => check(true)}>
              {i18n.t("practiceReveal")}
            </button>
          </div>
        {/if}
      </form>
      <p
        class="feedback"
        class:incorrect={result === "incorrect"}
        aria-live="polite"
        aria-atomic="true"
      >
        {#if result}{
            i18n.t(
              result === "correct"
                ? "practiceCorrect"
                : result === "incorrect"
                ? "practiceIncorrect"
                : "practiceAnswer",
            )
          } <strong lang="ru">{current.answers.join(", ")}</strong>{/if}
      </p>
      {#if result}<button class="primary" bind:this={nextButton} onclick={next}>
          {
            i18n.t(index + 1 === questions.length ? "practiceFinish" : "practiceNext")
          }
        </button>{/if}
    </section>
  {/if}
  <p role="status" class="error">{error ? i18n.t(error) : ""}</p>
  <noscript><p>{i18n.t("caseGameJavascript")}</p></noscript>
</div>

<style>
.game { max-width: 520px; }
h2 { margin: 24px 0 12px; font-size: 20px; font-weight: 500; }
label { display: block; margin-top: 20px; margin-bottom: 8px; }
input, select, button { min-height: 44px; padding: 9px 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--background); color: inherit; font: inherit; }
input { display: block; width: 100%; font-size: 22px; }
select { max-width: 100%; }
button { cursor: pointer; }
button.primary { border-color: var(--foreground); background: var(--foreground); color: var(--background); }
button:disabled { opacity: .5; cursor: default; }
.actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
.progress { color: var(--subtle); font-size: 13px; }
section { margin-top: 24px; }
.word { margin: 0 0 4px; font-size: clamp(28px, 6vw, 40px); color: var(--foreground); overflow-wrap: anywhere; }
.feedback { margin: 20px 0; }
.score { font-size: 24px; }
.context { font-size: 13px; text-transform: lowercase; }
button.reveal { border-color: transparent; color: var(--muted); }
.error, .incorrect { color: var(--error); }
</style>
