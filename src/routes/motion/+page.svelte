<script lang="ts">
import { goto } from "$app/navigation";
import { page } from "$app/state";
import { getI18n } from "$lib/i18n-context";
import {
  chooseMotion,
  motionCopy,
  type MotionSituation,
  type TravelMode,
} from "$lib/motion";
import {
  catalogCopy,
  motionEntries,
  motionFamilies,
  type MotionMeaning,
  motionMeanings,
  motionStarts,
  transportPhrases,
} from "$lib/motion-catalog";
import { readMotionQuery, writeMotionQuery } from "$lib/motion-url";
import Seo from "$lib/Seo.svelte";
import { onMount, untrack } from "svelte";

const i18n = getI18n();
const locale = $derived(i18n.locale === "ru" ? "ru" : "en");
const copy = $derived(motionCopy[locale]);
const labels = $derived(catalogCopy[locale]);
const simple = $derived(
  locale === "en"
    ? {
      how: "Movement",
      where: "Direction",
      action: "Action",
      whole: "One whole event",
      process: "In progress / repeated",
      why: "Why this verb?",
      browse: "Find another verb",
      personal: "Moving yourself",
      carrying: "Moving someone or something",
      basic: "General movement",
      destination: "Destination",
      path: "Route",
      meanings: {
        base: "Going / moving",
        enter: "Into a place",
        exit: "Out of a place",
        arrive: "Arriving",
        leave: "Leaving",
        approach: "Coming closer",
        away: "Moving away",
        cross: "Crossing / relocating",
        reach: "Reaching a place",
        pass: "Passing by / through",
        around: "Going around",
        visit: "Stopping by / going behind",
        up: "Up",
        down: "Down",
        start: "Setting off",
      },
      situations: {
        direction: "One direction, now",
        habit: "Regular trips",
        wandering: "Moving around",
        return: "Went and came back",
      },
    }
    : {
      how: "Способ движения",
      where: "Направление",
      action: "Действие",
      whole: "Одно целое событие",
      process: "Процесс / повторение",
      why: "Почему этот глагол?",
      browse: "Найти другой глагол",
      personal: "Двигаться самому",
      carrying: "Перемещать кого-то или что-то",
      basic: "Общее движение",
      destination: "Цель",
      path: "Маршрут",
      meanings: {
        base: "Двигаться",
        enter: "Внутрь",
        exit: "Наружу",
        arrive: "Прибыть",
        leave: "Покинуть место",
        approach: "Приблизиться",
        away: "Отдалиться",
        cross: "Пересечь / сменить место",
        reach: "Добраться",
        pass: "Мимо / сквозь",
        around: "В обход / вокруг",
        visit: "По пути / за предмет",
        up: "Вверх",
        down: "Вниз",
        start: "Отправиться",
      },
      situations: {
        direction: "В одном направлении сейчас",
        habit: "Регулярно",
        wandering: "В разных направлениях",
        return: "Туда и обратно в прошлом",
      },
    },
);
const initial = untrack(() => readMotionQuery(page.url));
let familyId = $state(initial.family);
let meaning = $state<MotionMeaning>(initial.meaning);
let aspect = $state<"imperfective" | "perfective">(initial.aspect);
let situation = $state<MotionSituation>(initial.situation);
let query = $state(initial.query);

onMount(persist);

$effect(() => {
  const restored = readMotionQuery(page.url);
  familyId = restored.family;
  meaning = restored.meaning;
  aspect = restored.aspect;
  situation = restored.situation;
  query = restored.query;
});

function persist() {
  const next = writeMotionQuery(new URL(window.location.href), {
    family: familyId,
    meaning,
    aspect,
    situation,
    query,
  });
  // A router navigation also updates the URL restored by Back/Forward.
  // Shallow replaceState only changes the address bar in this SvelteKit version.
  if (next.href !== window.location.href) {
    void goto(next, { replaceState: true, noScroll: true, keepFocus: true });
  }
}
const family = $derived(motionFamilies.find((item) => item.id === familyId)!);
const available = $derived(
  motionEntries.filter((entry) => entry.family === familyId),
);
const entry = $derived(available.find((item) => item.meaning === meaning));
const baseVerb = $derived(
  situation === "direction" ? family.directed : family.multidirectional,
);
const verb = $derived(
  meaning === "base"
    ? baseVerb
    : meaning === "start"
    ? motionStarts[familyId]
    : entry?.[aspect] ?? "",
);
const other = $derived(
  meaning === "base"
    ? (situation === "direction" ? family.multidirectional : family.directed)
    : meaning === "start"
    ? ""
    : entry?.[aspect === "perfective" ? "imperfective" : "perfective"] ?? "",
);
const original = $derived(
  meaning === "base" && ["foot", "transport", "air"].includes(familyId)
    ? chooseMotion(familyId as TravelMode, situation)
    : null,
);
const phrase = $derived(
  meaning === "base"
    ? `${verb} ${family.phrase}`
    : familyId === "transport" && transportPhrases[meaning]
    ? `${verb} ${transportPhrases[meaning]}`
    : "",
);
const situations: MotionSituation[] = [
  "direction",
  "habit",
  "wandering",
  "return",
];
const browse = motionFamilies.flatMap((item) => [
  {
    family: item.id,
    meaning: "base" as MotionMeaning,
    verbs: [item.directed, item.multidirectional],
  },
  ...motionEntries.filter((value) => value.family === item.id).map((value) => ({
    family: item.id,
    meaning: value.meaning,
    verbs: [value.imperfective, value.perfective],
  })),
  {
    family: item.id,
    meaning: "start" as MotionMeaning,
    verbs: [motionStarts[item.id]],
  },
]);
const matches = $derived(browse.filter((item) => {
  const needle = query.trim().toLowerCase().normalize("NFC").replaceAll(
    "\u0301",
    "",
  );
  return needle
    ? item.verbs.some((word) => word.includes(needle))
    : item.family === familyId;
}));
function changeFamily() {
  if (
    meaning !== "base" && meaning !== "start"
    && !motionEntries.some((item) =>
      item.family === familyId && item.meaning === meaning
    )
  ) meaning = "base";
  persist();
}
function select(item: typeof browse[number]) {
  familyId = item.family;
  meaning = item.meaning;
  const needle = query.trim().toLowerCase().replaceAll("\u0301", "");
  if (meaning === "base") {
    situation = needle === item.verbs[1]
      ? "habit"
      : "direction";
  } else if (meaning !== "start") {
    aspect = needle === item.verbs[0]
      ? "imperfective"
      : "perfective";
  }
  persist();
}
const link = (word: string) =>
  `/conjugator?${encodeURIComponent(word)}&lang=${locale}`;
</script>

<Seo
  title={`${i18n.t("motionTitle")} | russian.tools`}
  description={i18n.t("motionDescription")}
  canonical="https://russian.tools/motion"
/>

<div class="chooser">
  <form onsubmit={(event) => event.preventDefault()}>
    <label class="field" for="family">{simple.how}</label>
    <select
      id="family"
      value={familyId}
      onchange={(event) => {
        familyId = event.currentTarget.value;
        changeFamily();
      }}
    >
      <optgroup label={simple.personal}>
        {#each motionFamilies.slice(0, 8) as item}<option value={item.id}>
            {item.label[locale]}
          </option>{/each}
      </optgroup>
      <optgroup label={simple.carrying}>
        {#each motionFamilies.slice(8) as item}<option value={item.id}>
            {item.label[locale]}
          </option>{/each}
      </optgroup>
    </select>
    <label class="field" for="meaning">{simple.where}</label>
    <select
      id="meaning"
      value={meaning}
      onchange={(event) => {
        meaning = event.currentTarget.value as MotionMeaning;
        persist();
      }}
    >
      <optgroup label={simple.basic}>
        <option value="base">{simple.meanings.base}</option>
        <option value="start">{simple.meanings.start}</option>
      </optgroup>
      <optgroup label={simple.destination}>
        {#each available.filter(item =>
          ["enter", "exit", "arrive", "leave", "approach", "away", "reach"].includes(
            item.meaning,
          )
        ) as item}
          <option value={item.meaning}>{simple.meanings[item.meaning]}</option>
        {/each}
      </optgroup>
      <optgroup label={simple.path}>
        {#each available.filter(item =>
          ["cross", "pass", "around", "visit", "up", "down"].includes(item.meaning)
        ) as item}
          <option value={item.meaning}>{simple.meanings[item.meaning]}</option>
        {/each}
      </optgroup>
    </select>
    {#if meaning === "base"}
      <label class="field" for="situation">{simple.action}</label>
      <select
        id="situation"
        value={situation}
        onchange={(event) => {
          situation = event.currentTarget.value as MotionSituation;
          persist();
        }}
      >
        {#each situations as value}<option {value}>
            {simple.situations[value]}
          </option>{/each}
      </select>
    {:else if meaning !== "start"}
      <label class="field" for="aspect">{simple.action}</label>
      <select
        id="aspect"
        value={aspect}
        onchange={(event) => {
          aspect = event.currentTarget.value as typeof aspect;
          persist();
        }}
      >
        <option value="perfective">{simple.whole}</option>
        <option value="imperfective">{simple.process}</option>
      </select>
    {/if}
  </form>

  <section class="result" aria-live="polite" aria-atomic="true">
    <h2 lang="ru">{verb}</h2>
    <p class="aspect">
      {
        i18n.t(
          meaning === "base"
            ? "imperfective"
            : meaning === "start"
            ? "perfective"
            : aspect,
        )
      }
    </p>
    {#if original}
      <h3>{copy.example}</h3><p class="example" lang="ru">
        {original.example[0]}
      </p>
      {#if locale === "en"}<p>{original.example[1]}</p>{/if}
    {:else if phrase}
      <h3>{labels.examplePhrase}</h3><p class="example" lang="ru">{phrase}</p>
    {/if}
    <a class="conjugation" href={link(verb)}>{copy.conjugation}</a>
    <details class="explanation">
      <summary>{simple.why}</summary>
      {#if other}
        <div class="comparison">
          <h3>{copy.compare}</h3>
          <a class="example" lang="ru" href={link(other)}>{other}</a>
          {#if meaning !== "base"}<p>
              {i18n.t(aspect === "perfective" ? "imperfective" : "perfective")}
            </p>{/if}
          {#if original}<p lang="ru">
              {original.contrast[0]}
            </p>{#if locale === "en"}<p>{original.contrast[1]}</p>{/if}{/if}
        </div>
      {/if}
      <p class="detail">
        {
          meaning === "base"
          ? copy[`${situation}Reason`]
          : meaning === "start"
          ? labels.startNote
          : labels[`${aspect}Note`]
        }
      </p>
      {#if meaning === "base"}<p class="detail">{labels.baseNote}</p>{/if}
      {#if familyId === "transport" && meaning === "cross"}<p class="detail">
          {labels.relocation}
        </p>{/if}
      {#if familyId === "drive" && meaning === "reach"}<p class="detail">
          {labels.driveReach}
        </p>{/if}
      {#if familyId === "drive" && meaning === "around"}<p class="detail">
          {labels.driveAround}
        </p>{/if}
      {#if familyId === "air" && meaning === "down"}<p class="detail">
          {labels.flightDown}
        </p>{/if}
      {#if familyId === "climb" && meaning === "base"}<p class="detail">
          {labels.climbNote}
        </p>{/if}
    </details>
  </section>
</div>

<details class="catalog" open={query.length > 0}>
  <summary>{simple.browse}</summary>
  <div class="catalog-content">
    <label class="field" for="search">{labels.search}</label>
    <input
      id="search"
      type="search"
      value={query}
      maxlength="200"
      oninput={(event) => {
        query = event.currentTarget.value;
        persist();
      }}
      placeholder={labels.placeholder}
    />
    <p class="count" role="status">{matches.length} {labels.results}</p>
    <table>
      <thead>
        <tr>
          <th>{labels.verbs}</th>
          <th>{labels.meaning}</th>
        </tr>
      </thead>
      <tbody>
        {#each matches.slice(0, 50) as item}
          <tr class:selected={item.family === familyId && item.meaning === meaning}>
            <td>
              <button
                type="button"
                onclick={() => select(item)}
                aria-pressed={item.family === familyId && item.meaning === meaning}
                lang="ru"
              >
                {item.verbs.join(" / ")}
              </button>
            </td>
            <td>{motionMeanings[item.meaning][locale]}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    {#if !matches.length}<p>{labels.empty}</p>{/if}
    {#if matches.length > 50}<p>{labels.more}</p>{/if}
    <p class="note">{labels.scope}</p>
  </div>
</details>
<noscript><p>{copy.javascript}</p></noscript>

<style>
.chooser { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 56px; margin-top: 40px; align-items: start; }
form { min-width: 0; }
.field { display: block; font-weight: 500; margin-bottom: 12px; }
select, input[type="search"] { width: 100%; min-width: 0; min-height: 54px; padding: 14px 16px; font: inherit; color: var(--foreground); background: var(--background); border: 1px solid var(--border); border-radius: 4px; }
select { text-overflow: ellipsis; margin-bottom: 28px; }
form select:last-child { margin-bottom: 0; }
.result { padding: 4px 0 4px 32px; border-left: 1px solid var(--border); }
summary { cursor: pointer; font-size: 14px; font-weight: 500; }
.explanation { margin-top: 28px; }
.explanation[open] summary { margin-bottom: 16px; }
.catalog-content { margin-top: 20px; }
.catalog-content .field { margin-bottom: 10px; }
h2 { font-size: 36px; line-height: 1.2; margin: 0 0 12px; font-weight: 500; overflow-wrap: anywhere; }
h3 { font-size: 14px; font-weight: 500; margin: 20px 0 8px; }
.aspect { font-size: 13px; margin-bottom: 28px; }
.example { color: var(--foreground); font-size: 20px; margin-bottom: 8px; }
.conjugation { display: inline-block; margin-top: 24px; font-size: 14px; }
.comparison, .catalog { border-top: 1px solid var(--border); margin-top: 24px; }
.catalog { padding-top: 24px; margin-top: 40px; }
.detail { margin-top: 20px; }
.count { font-size: 12px; margin: 8px 0; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid var(--border); overflow-wrap: anywhere; }
th { font-size: 13px; font-weight: 500; }
td { font-size: 14px; }
button { font: inherit; text-align: left; color: inherit; background: none; border: 0; padding: 4px 0; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; overflow-wrap: anywhere; }
tr.selected { background: var(--hover); }
.note { border-top: 1px solid var(--border); margin-top: 24px; padding-top: 20px; font-size: 13px; }
@media (max-width: 700px) { .chooser { grid-template-columns: minmax(0, 1fr); gap: 32px; margin-top: 32px; } .result { border-left: 0; border-top: 1px solid var(--border); padding: 28px 0 0; } }
</style>
