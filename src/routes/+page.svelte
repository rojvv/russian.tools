<script lang="ts">
import { getI18n } from "$lib/i18n-context";
import { languagePath } from "$lib/seo";
import Seo from "$lib/Seo.svelte";
const i18n = getI18n();
</script>

<Seo
  title={`${i18n.t("homeSeoTitle")} | russian.tools`}
  description={i18n.t("homeDescription")}
  canonical="https://russian.tools/"
  home
/>

<nav aria-label={i18n.t("tools")}>
  <div>
    <a href={languagePath("/stress", i18n.locale ?? "en")}>{
      i18n.t("stressTitle")
    }</a>
  </div>
  <div>
    <a href={languagePath("/stress-practice", i18n.locale ?? "en")}>{
      i18n.t("practiceTitle")
    }</a>
  </div>
  <div>
    <a href={languagePath("/conjugator", i18n.locale ?? "en")}>{
      i18n.t("verbTitle")
    }</a>
  </div>
  <div>
    <a href={languagePath("/decliner", i18n.locale ?? "en")}>{
      i18n.t("nounTitle")
    }</a>
  </div>
  <div>
    <a href={languagePath("/transliterate", i18n.locale ?? "en")}>{
      i18n.t("transliterateTitle")
    }</a>
  </div>
  <div>
    <a href={languagePath("/motion", i18n.locale ?? "en")}>{
      i18n.t("motionTitle")
    }</a>
  </div>
  <div>
    <a href={languagePath("/verb-prefixes", i18n.locale ?? "en")}>{
      i18n.t("prefixTitle")
    }</a>
  </div>
  <div>
    <a href={languagePath("/diminutive", i18n.locale ?? "en")}>{
      i18n.t("diminutiveTitle")
    }</a>
  </div>
  <div>
    <a href={languagePath("/case-game", i18n.locale ?? "en")}>{
      i18n.t("caseGameTitle")
    }</a>
  </div>
  <div>
    <a href={languagePath("/keyboard", i18n.locale ?? "en")}>{
      i18n.t("keyboardTitle")
    }</a>
  </div>
  <div>
    <a href={languagePath("/abbreviation", i18n.locale ?? "en")}>{
      i18n.t("abbreviationTitle")
    }</a>
  </div>
  <div>{i18n.t("moreToolsComingSoon")}</div>
</nav>

<style>
nav { margin-top: 32px; display: grid; gap: 24px; }
nav a { font-weight: 500; }
</style>
