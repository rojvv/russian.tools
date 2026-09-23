<script lang="ts">
import { getI18n } from "$lib/i18n-context";
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
    <a href="/stress">{i18n.t("stressTitle")}</a>
  </div>
  <div>
    <a href="/stress-practice">{i18n.t("practiceTitle")}</a>
  </div>
  <div>
    <a href="/conjugator">{i18n.t("verbTitle")}</a>
  </div>
  <div>
    <a href="/decliner">{i18n.t("nounTitle")}</a>
  </div>
  <div>
    <a href="/transliterate">{i18n.t("transliterateTitle")}</a>
  </div>
  <div><a href="/motion">{i18n.t("motionTitle")}</a></div>
  <div><a href="/diminutive">{i18n.t("diminutiveTitle")}</a></div>
  <div><a href="/case-game">{i18n.t("caseGameTitle")}</a></div>
  <div>{i18n.t("moreToolsComingSoon")}</div>
</nav>

<style>
nav { margin-top: 32px; display: grid; gap: 24px; }
nav a { font-weight: 500; }
</style>
