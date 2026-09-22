<script lang="ts">
import { page } from "$app/state";
import favicon from "$lib/assets/favicon.svg";
import { languageCookieMaxAge, type Locale } from "$lib/i18n";
import { createI18n } from "$lib/i18n-context";
import { untrack } from "svelte";

let { children, data } = $props();
const i18n = createI18n(untrack(() => data.locale));
$effect(() => {
  document.documentElement.lang = i18n.locale ?? "en";
});
function setLanguage(locale: Locale) {
  i18n.locale = locale;
  document.cookie =
    `language=${locale}; Path=/; Max-Age=${languageCookieMaxAge}; SameSite=Lax${
      location.protocol === "https:" ? "; Secure" : ""
    }`;
}
const toolTitle = $derived(
  page.route.id === "/stress"
    ? i18n.t("stressTitle")
    : page.route.id === "/conjugator"
    ? i18n.t("verbTitle")
    : page.route.id === "/decliner"
    ? i18n.t("nounTitle")
    : "",
);
</script>

<svelte:head>
  <link
    rel="preload"
    href="/fonts/OpenSans.ttf"
    as="font"
    type="font/ttf"
    crossorigin="anonymous"
  />
  <link rel="icon" href={favicon} />
</svelte:head>

<main class:stress-layout={page.route.id === "/stress"}>
  <header>
    <h1>
      <a href="/">russian.tools</a> {#if toolTitle}<span>{toolTitle}</span>{/if}
    </h1>
    <nav aria-label={i18n.t("language")}>
      <button
        lang="en"
        aria-pressed={i18n.locale === "en"}
        onclick={() => setLanguage("en")}
      >
        English
      </button>
      <span aria-hidden="true">/</span>
      <button
        lang="ru"
        aria-pressed={i18n.locale === "ru"}
        onclick={() => setLanguage("ru")}
      >
        русский
      </button>
    </nav>
  </header>
  {@render children()}
</main>

<style>
.stress-layout { display: flex; flex-direction: column; height: calc(100dvh - 80px); min-height: 260px; }
.stress-layout header { flex-shrink: 0; }
@media (max-width: 600px) { .stress-layout { height: calc(100dvh - 64px); } }
header { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 16px; margin-bottom: 24px; }
header h1 { margin: 0; }
header h1 span { margin: 0; font-weight: 400; color: var(--subtle); }
header a { text-decoration: none; }
nav { display: flex; align-items: center; gap: 6px; margin-left: auto; font-size: 12px; color: var(--subtle); }
button { border: 0; padding: 4px 0; background: none; color: inherit; font: inherit; cursor: pointer; }
button[aria-pressed="true"] { color: var(--foreground); }
button:hover { text-decoration: underline; text-underline-offset: 3px; }

@font-face { font-family: 'Open Sans'; src: url('/fonts/OpenSans.ttf') format('truetype'); font-style: normal; font-weight: 300 800; font-display: swap; }
:global(:root) { color-scheme: light; --background: #fff; --foreground: #222; --muted: #666; --subtle: #777; --placeholder: #888; --border: #ddd; --hover: #f7f7f7; --focus: #555; --error: #a02e23; }
@media (prefers-color-scheme: dark) {
	:global(:root) { color-scheme: dark; --background: #000; --foreground: #e5e5e5; --muted: #aaa; --subtle: #999; --placeholder: #888; --border: #333; --hover: #151515; --focus: #aaa; --error: #ff9286; }
}
:global(*) { box-sizing: border-box; }
:global(body) { margin: 0; background: var(--background); color: var(--foreground); font-family: 'Open Sans', sans-serif; font-size: 15px; line-height: 1.6; -webkit-font-smoothing: antialiased; }
:global(main) { max-width: 940px; margin: 40px auto; padding: 0 24px; }
:global(h1) { margin: 0 0 8px; font-size: 22px; font-weight: 600; letter-spacing: -.6px; line-height: 1.3; }
:global(p) { margin: 0; color: var(--muted); }
:global(a) { color: inherit; text-underline-offset: 3px; }
:global(a:hover) { color: var(--focus); }
:global(:focus-visible) { outline: 2px solid var(--focus); outline-offset: 3px; }
@media (max-width: 600px) { :global(main) { margin: 32px auto; padding: 0 20px; } }
</style>
