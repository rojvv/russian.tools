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
    <a href="/conjugator">{i18n.t("verbSeoTitle")}</a>
  </div>
  <div>
    <a href="/decliner">{i18n.t("nounSeoTitle")}</a>
  </div>
  <div>{i18n.t("moreToolsComingSoon")}</div>
</nav>

<p class="examples">
  {i18n.t("examples")}:
  <a href="/conjugator?читать" lang="ru">читать</a> ·
  <a href="/conjugator?быть" lang="ru">быть</a> ·
  <a href="/decliner?книга" lang="ru">книга</a> ·
  <a href="/decliner?человек" lang="ru">человек</a>
</p>

<p class="source">
  {i18n.t("openRussianAttribution")} <a href="https://en.openrussian.org/"
  >OpenRussian</a>.
</p>

<style>
nav { margin-top: 32px; display: grid; gap: 24px; }
nav a { font-weight: 500; }
.examples { margin-top: 24px; }
.source { margin-top: 32px; font-size: 12px; }
</style>
