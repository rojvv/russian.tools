<script lang="ts">
import { curseCopy } from "$lib/curse";
import { curseEntrySeo } from "$lib/curse-entry";
import CurseEntryCard from "$lib/CurseEntryCard.svelte";
import { getI18n } from "$lib/i18n-context";
import { languagePath } from "$lib/seo";
import Seo from "$lib/Seo.svelte";
import type { PageData } from "./$types";

let { data }: { data: PageData } = $props();
const i18n = getI18n();
const locale = $derived(i18n.locale === "ru" ? "ru" : "en");
const copy = $derived(curseCopy[locale]);
const seo = $derived(curseEntrySeo(data.entry, locale));
</script>

<Seo {...seo} />

<p class="back">
  <a href={languagePath("/curse", locale)}>{
    locale === "ru"
    ? "Все 1 000 слов и выражений"
    : "Browse all 1,000 words and expressions"
  }</a>
</p>
<CurseEntryCard entry={data.entry} {locale} />
<p class="scope">{copy.scope}</p>
<p>
  <a href={languagePath("/acknowledgements#curse-words", locale)}>{
    locale === "ru" ? "Источники" : "Sources"
  }</a>
</p>

<style>
.back { margin-bottom: 20px; }
.scope { margin: 20px 0 12px; font-size: 13px; }
</style>
