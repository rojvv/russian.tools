<script lang="ts">
import { replaceState } from "$app/navigation";
import { page } from "$app/state";
import favicon from "$lib/assets/favicon.svg";
import { languageCookieMaxAge, type Locale } from "$lib/i18n";
import { createI18n } from "$lib/i18n-context";
import { languagePath, languageUrl } from "$lib/seo";
import { untrack } from "svelte";

let { children, data } = $props();
const i18n = createI18n(untrack(() => data.locale));
// Keep the current choice across client navigation; preloaded server data may
// have been rendered with the cookie from before the user switched languages.
let language = $state(untrack(() => data.locale));
$effect(() => {
  const requested = page.url.searchParams.get("lang");
  const locale = requested === "en" || requested === "ru"
    ? requested
    : language;
  // The library setter reads reactive state internally. Do not subscribe this
  // effect to those reads and overwrite a user's live language selection.
  untrack(() => {
    language = locale;
    i18n.locale = locale;
    saveLanguage(locale);
  });
});
$effect(() => {
  document.documentElement.lang = i18n.locale ?? "en";
});
function saveLanguage(locale: Locale) {
  document.cookie =
    `language=${locale}; Path=/; Max-Age=${languageCookieMaxAge}; SameSite=Lax${
      location.protocol === "https:" ? "; Secure" : ""
    }`;
}
function setLanguage(locale: Locale) {
  saveLanguage(locale);
  language = locale;
  i18n.locale = locale;
  replaceState(languageUrl(window.location.href, locale), page.state);
}
const toolTitle = $derived(
  page.route.id === "/stress"
    ? i18n.t("stressTitle")
    : page.route.id === "/stress-practice"
    ? i18n.t("practiceTitle")
    : page.route.id === "/conjugator"
    ? i18n.t("verbTitle")
    : page.route.id === "/decliner"
    ? i18n.t("nounTitle")
    : page.route.id === "/transliterate"
    ? i18n.t("transliterateTitle")
    : page.route.id === "/case-game"
    ? i18n.t("caseGameTitle")
    : page.route.id === "/motion"
    ? i18n.t("motionTitle")
    : page.route.id === "/diminutive"
    ? i18n.t("diminutiveTitle")
    : page.route.id === "/acknowledgements"
    ? i18n.t("acknowledgementsTitle")
    : "",
);
</script>

<svelte:head>
  <link
    rel="preload"
    href="/fonts/GolosText.ttf"
    as="font"
    type="font/ttf"
    crossorigin="anonymous"
  />
  <link rel="icon" href={favicon} />
</svelte:head>

<main class:editor-layout={page.route.id === "/stress" || page.route.id === "/transliterate"}>
  <header>
    <h1>
      <a href={languagePath("/", i18n.locale ?? "en")}>russian.tools</a>
      {#if toolTitle}<span>{toolTitle}</span>{/if}
    </h1>
    <nav aria-label={i18n.t("language")} data-sveltekit-preload-data="off">
      <a
        href={languageUrl(page.url.href, "en")}
        lang="en"
        aria-current={i18n.locale === "en"}
        onclick={(event) => {
          event.preventDefault();
          setLanguage("en");
        }}
      >
        English
      </a>
      <span aria-hidden="true">/</span>
      <a
        href={languageUrl(page.url.href, "ru")}
        lang="ru"
        aria-current={i18n.locale === "ru"}
        onclick={(event) => {
          event.preventDefault();
          setLanguage("ru");
        }}
      >
        русский
      </a>
    </nav>
  </header>
  {@render children()}
  <footer class="site-footer">
    <span>&copy; 2026 russian.tools</span>
    <a href="https://t.me/RussianDotTools">Telegram</a>
    <a href={`/acknowledgements?lang=${i18n.locale ?? "en"}`}>{
      i18n.t("acknowledgementsTitle")
    }</a>
  </footer>
</main>

<style>
.editor-layout { display: flex; flex-direction: column; height: calc(100dvh - 80px); min-height: 260px; }
.site-footer { display: flex; flex-shrink: 0; flex-wrap: wrap; gap: 4px 12px; margin-top: auto; padding-top: 32px; font-size: 12px; color: var(--muted); }
.editor-layout header { flex-shrink: 0; }
@media (max-width: 600px) { .editor-layout { height: calc(100dvh - 64px); } }
header { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 16px; margin-bottom: 24px; }
header h1 { margin: 0; }
header h1 span { margin: 0; font-weight: 400; color: var(--subtle); }
header a { text-decoration: none; }
nav { display: flex; align-items: center; gap: 6px; margin-left: auto; font-size: 12px; color: var(--subtle); }
nav a { border: 0; background: none; color: inherit; font: inherit; cursor: pointer; }
nav a[aria-current="true"] { color: var(--foreground); }
@media (hover: hover) { nav a:hover { text-decoration: underline; text-underline-offset: 3px; } }

@font-face { font-family: 'Golos Text'; src: url('/fonts/GolosText.ttf') format('truetype'); font-style: normal; font-weight: 400 900; font-display: swap; }
:global(:root) { color-scheme: light; --background: #fff; --foreground: #222; --muted: #666; --subtle: #777; --placeholder: #888; --border: #ddd; --hover: #f7f7f7; --focus: #555; --error: #a02e23; }
@media (prefers-color-scheme: dark) {
	:global(:root) { color-scheme: dark; --background: #000; --foreground: #e5e5e5; --muted: #aaa; --subtle: #999; --placeholder: #888; --border: #333; --hover: #151515; --focus: #aaa; --error: #ff9286; }
}
:global(*) { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
:global(body) { margin: 0; background: var(--background); color: var(--foreground); font-family: 'Golos Text', sans-serif; font-size: 15px; line-height: 1.6; -webkit-font-smoothing: antialiased; }
:global(main) { display: flex; flex-direction: column; min-height: calc(100dvh - 80px); max-width: 940px; margin: 40px auto; padding: 0 24px; }
:global(h1) { margin: 0 0 8px; font-size: 22px; font-weight: 600; letter-spacing: -.6px; line-height: 1.3; }
:global(p) { margin: 0; color: var(--muted); }
:global(a) { color: inherit; text-underline-offset: 3px; }
@media (hover: hover) { :global(a:hover) { color: var(--focus); } }
:global(:focus-visible) { outline: 2px solid var(--focus); outline-offset: 3px; }
@media (max-width: 600px) { :global(main) { min-height: calc(100dvh - 64px); margin: 32px auto; padding: 0 20px; } }
</style>
